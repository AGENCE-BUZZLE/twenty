# Migration CRM Buzzle : sous-domaine → path-based (`crm.agence-buzzle.com/{slug}`)

Branche : `feat/path-based-routing`. Objectif : servir chaque workspace client sur `crm.agence-buzzle.com/{slug}` au lieu de `{slug}.crm.agence-buzzle.com`, **sans casser les leads, l'OCT, ni les clients existants**. Approche **additive** (le sous-domaine continue de marcher en parallèle, feature-flag), jamais destructive.

## Ce qui est DÉJÀ en place (28-29/08/2026)
- **Staging jetable** : box Hetzner `crm-staging` `91.99.4.102` (cx33, Docker+swap). Clone de prod (base 5 workspaces restaurée) déployé et **healthy** (image `crm-full:v1.9.112`, healthz 200). Sert de banc de test. **À SUPPRIMER en fin de projet** (Hetzner API, id serveur 163945708).
- **Pipeline de build** : CI GitHub `build-buzzle-full.yml` (workflow_dispatch), ~9 min → GHCR `ghcr.io/agence-buzzle/crm-full:{tag}`. Déclencher : `gh workflow run build-buzzle-full.yml -R AGENCE-BUZZLE/twenty --ref feat/path-based-routing -f version_tag=path-test-N -f push_to_registry=true`. `gh` authentifié (scopes repo+workflow).
- **Prod INTACTE** : Hostinger `31.97.77.214`, rien touché. La prod reste sur Hostinger.

## Fait de base rassurant (issu de la cartographie du code)
L'**API runtime (data/GraphQL/permissions) est pilotée par le JWT** (`workspaceId` dans le token, header `Authorization: Bearer`), **PAS par le sous-domaine** (`jwt-wrapper.service.ts`, `access-token.service.ts`, middlewares `graphql-hydrate-request-from-token`). → **Les webhooks n8n `galaxy-glass-lead` et OCT `crm-oct` qui écrivent via l'API ne dépendent PAS du sous-domaine → ils ne bougent pas.** Le sous-domaine ne sert qu'à : (1) résoudre le workspace avant login, (2) isoler les tokens dans le navigateur (localStorage par origine), (3) construire les URLs de redirection.

## 🎯 Stratégie recommandée (LA moins risquée) : « origin synthétique »
Plutôt que réécrire toute la résolution backend (`origin`→`slug`) — qui touche l'auth et la sécurité — exploiter le fait que **le front envoie déjà l'`origin` au backend en argument**. En mode path :
- le navigateur est sur `crm.agence-buzzle.com/{slug}` ;
- mais le front **envoie au backend un `origin` synthétique = `https://{slug}.crm.agence-buzzle.com`** (l'URL sous-domaine canonique).
→ Le backend résout le workspace **sans aucune modification**, et le contrôle de sécurité origin↔workspace (`auth.resolver.ts:697 validateWorkspaceAccess`) **reste intact**. On évite la faille cross-workspace flaggée. Le backend reste quasi inchangé = risque sécurité minimal.

Le travail devient **quasi 100 % frontend + nginx**.

## Implémentation (ordre + fichiers précis)
### A. Détection du mode path + slug (nouveau helper front)
- Nouveau `modules/domain-manager/utils/getWorkspaceSlugFromPath.ts` : lit `window.location.pathname`, extrait le 1er segment s'il n'est pas une route app réservée (`/settings`, `/objects`, `/verify`, `/sign-in`, assets…). Liste de réservés à maintenir.
- Feature-flag : `IS_PATH_BASED` (ex. via un flag de config ou détection : path-mode si hostname === frontDomain ET 1er segment = slug connu).

### B. Isolation des tokens par slug (PRIORITÉ 1 — sinon collision `/clientA` vs `/clientB`)
- `modules/auth/states/tokenPairState.ts` : la clé localStorage `tokenPairState` doit devenir `tokenPairState:{slug}` en mode path. Idem tous les états persistés par origine (chercher `useLocalStorage: true` liés à la session/workspace). C'est LE point critique d'isolation navigateur.

### C. Origin synthétique
- `modules/domain-manager/hooks/useOrigin.ts` : en mode path, retourner `https://{slug}.{frontDomain}` au lieu de `window.location.origin`.

### D. Routing front (basename)
- Router React : `basename={/${slug}}` en mode path (chercher le `<Router>`/`createBrowserRouter`). Vite `base` / chemins d'assets : les assets sont servis depuis `/` → soit garder assets absolus `/`, soit rewrite nginx. Gérer le deep-linking `/{slug}/objects/...`.
- Hooks à rendre path-aware : `useIsCurrentLocationOnAWorkspace.ts`, `useReadWorkspaceUrlFromCurrentLocation.ts`, `useReadDefaultDomainFromConfiguration.ts` (lisent `window.location.hostname`).

### E. Construction des URLs de workspace → chemins `/{slug}`
- `utils/getWorkspaceUrl.ts`, `modules/domain-manager/hooks/useBuildWorkspaceUrl.ts`, `useRedirectToWorkspaceDomain.ts`, `WorkspaceProviderEffect.tsx` (ne PAS rediriger vers le sous-domaine en mode path), `useBuzzleImpersonateWorkspace.ts` (→ `/{slug}/verify?loginToken=`).

### F. nginx (bascule finale)
- Servir le SPA sur `crm.agence-buzzle.com/{slug}/*` (try_files → index.html), assets sur `/`.
- **301 des anciens `{slug}.crm.agence-buzzle.com` → `crm.agence-buzzle.com/{slug}`** (rétro-compat, rien ne casse).

## Validation obligatoire sur staging avant toute idée de prod
1. Login sur 2 workspaces différents dans le même navigateur → **aucune fuite de token** entre `/clientA` et `/clientB` (test isolation localStorage).
2. Le sous-domaine continue de marcher (additif).
3. Webhook `galaxy-glass-lead` + OCT `crm-oct` : créer un lead de test, vérifier qu'il arrive et que l'OCT se déclenche (via l'API, indépendant du domaine).
4. Deep-link direct `/{slug}/objects/...` OK après refresh.

## ⚠️ Bascule prod = AVEC Clément (jamais à l'aveugle)
Auth + clients payants + leads. Une fois validé sur staging : build image prod, script de bascule nginx + 301, **script de rollback**, et on tire ENSEMBLE (2 min) + rollback prêt. Puis suppression de la box Hetzner staging.

## Points durs restants (du rapport de faisabilité)
1. Isolation localStorage par slug (B) — le plus critique.
2. Assets statiques sous préfixe de path (D) — gotcha Vite/nginx.
3. Redirections & branding pré-login (E).
4. Custom domains + impersonation Buzzle (E).
5. La stratégie « origin synthétique » neutralise le point auth/sécurité #3 du rapport — à confirmer sur les flux verify/2FA/OAuth.
