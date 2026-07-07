# Buzzle CRM Platform — Architecture

Fork Twenty CRM personnalisé pour Agence Buzzle. Vision : plateforme multi-tenant qui héberge le CRM de chaque client Google Ads / Meta Ads avec push OCT automatique, et un cockpit agence unifié.

## Roadmap

### V1 (en cours)
- **SuperAdmin Buzzle** : cockpit `/buzzle-admin` accessible à Clément seul
  - Liste tous les workspaces + stats basiques (leads, dernière activité)
  - Bouton "Créer nouveau workspace" avec choix de template
  - Impersonation d'un user client
  - Dropdown navigation entre workspaces sans quitter la page admin
- **Workspaces clients** : chacun a
  - Objet `Prospect` avec 12 champs (nom, tél, email, message, statut, notes, montant + 5 cachés OCT)
  - Statuts pipeline configurables par client (adaptés au produit/service)
  - Vue "Mes prospects" en table
  - Menu Twenty simplifié : uniquement Prospects, pas Companies/Deals/etc.
- **OCT automatique** :
  - Webhook sortant Twenty sur changement de statut
  - Workflow n8n `crm-oct-google-ads` : uploadClickConversions
  - Workflow n8n `crm-oct-meta-capi` : events Lead + Purchase
  - Config par workspace (Ads customer_id + conversion actions + Meta Pixel + token)
- **Templates de workspace** en code :
  - `leads-google-ads.template.ts` (statuts génériques)
  - Extensible pour statuts custom par client (menuiserie, restaurant, e-commerce…)

### V2 (après)
- Dashboards Metabase branchés sur Postgres Twenty
  - Cockpit agence multi-clients
  - Rapports client-facing partageables via lien public
- Système de rôles clients (client viewer = read + update statut/notes uniquement)
- Landing page templates UTMRX intégrés (bouton "Générer LP client" depuis SuperAdmin)

### V3 (plus tard)
- Intégration Zoho Invoice ↔ objet `Facture` custom
- Alertes churn (workspace inactif 30j)
- Notifications Discord/email sur événements importants
- API publique Buzzle pour intégrations client

## Architecture

### Fork repo
- `github.com/AGENCE-BUZZLE/twenty` (fork de `twentyhq/twenty`)
- Branche `buzzle-main` = branche de prod
- Merges de `upstream/main` tous les 1-2 mois (résolution conflits manuelle)

### Modifications principales dans le fork

```
packages/
├── twenty-server/
│   └── src/engine/core-modules/
│       └── buzzle-admin/              ← NEW module Buzzle
│           ├── buzzle-admin.module.ts
│           ├── controllers/
│           ├── resolvers/             ← GraphQL mutations custom
│           │   ├── create-workspace-from-template.resolver.ts
│           │   └── list-workspaces-with-stats.resolver.ts
│           ├── services/
│           │   ├── workspace-provisioning.service.ts
│           │   └── template-applier.service.ts
│           ├── templates/             ← Templates de workspace
│           │   ├── leads-google-ads.template.ts
│           │   ├── leads-meta-ads.template.ts
│           │   └── leads-mixed.template.ts
│           └── guards/
│               └── buzzle-super-admin.guard.ts
│
├── twenty-front/
│   └── src/modules/
│       └── buzzle-admin/              ← NEW module frontend
│           ├── pages/
│           │   ├── BuzzleCockpit.tsx
│           │   ├── BuzzleWorkspaceDetail.tsx
│           │   └── BuzzleCreateWorkspace.tsx
│           ├── components/
│           │   ├── WorkspacesTable.tsx
│           │   ├── WorkspaceStatsCard.tsx
│           │   └── CreateWorkspaceForm.tsx
│           ├── hooks/
│           │   ├── useBuzzleCockpit.ts
│           │   └── useCreateWorkspace.ts
│           └── graphql/
│               └── buzzle-admin.queries.ts
│
└── twenty-docker/
    └── buzzle-overlay/                ← Existing overlay (favicons, manifest)
```

### Modifications de code Twenty existant

- `packages/twenty-front/src/App.tsx` : ajouter route `/buzzle-admin/*`
- `packages/twenty-front/src/modules/navigation/hooks/useRedirectToWorkspaceDomain.ts` : bypass redirect si user est super admin en train de switcher
- `packages/twenty-front/src/utils/title-utils.ts` : "Twenty" → "Buzzle CRM"
- `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/constants/DefaultWorkspaceName.ts`
- Théme Schemata dans `packages/twenty-ui/src/theme/constants/` (V2)

## CI/CD

### GitHub Actions
- Workflow `.github/workflows/build-crm-image.yml`
- Trigger : push sur `buzzle-main` + tags `v*.*.*` + manual dispatch
- Steps :
  1. Checkout
  2. Build overlay image `packages/twenty-docker/buzzle-overlay/Dockerfile` (rapide, 30s)
  3. Push vers `ghcr.io/agence-buzzle/crm:v{semver}` + `latest`
- Auth GHCR via `GITHUB_TOKEN` (built-in)

### Deploy sur VPS
- Le VPS pull la nouvelle image via un webhook GHCR OU par cron
- Script `/opt/twenty/pull-and-restart.sh` :
  ```sh
  cd /opt/twenty && docker compose pull && docker compose up -d --force-recreate server worker
  ```

### Build full frontend (pour les fork mods React)
- Impossible sur VPS (RAM insuffisante, ~4Go peak pour build front Twenty)
- Se fait UNIQUEMENT dans GitHub Actions (workers Ubuntu 4vCPU/16Go)
- Multi-stage Dockerfile : stage `full-build` compile front + server, stage final = image finale

## Endpoints custom Buzzle

### Backend GraphQL — Route `/buzzle-admin`

**Queries** (super admin only) :
- `listAllWorkspacesWithStats` — tous les workspaces + count leads, dernière activité, statuts, revenus OCT
- `getWorkspaceDetailsForAdmin(workspaceId)` — deep dive sur 1 workspace
- `getAvailableTemplates` — liste des templates disponibles
- `getBuzzleCockpit` — vue agrégée (nouveaux leads 24h, OCT pushed today, workspaces at risk)

**Mutations** (super admin only) :
- `createWorkspaceFromTemplate(name, subdomain, templateId, ownerEmail)` — provisionne workspace + applique template + envoie invite email
- `updateWorkspaceCustomization(workspaceId, config)` — modifier statuts custom, cacher menus, etc.
- `impersonateUser(userId)` — retourne un JWT temporaire pour se logger comme lui

### Frontend — Route `/buzzle-admin`

- `/buzzle-admin` → cockpit agence
- `/buzzle-admin/workspaces` → table workspaces
- `/buzzle-admin/workspaces/new` → form création
- `/buzzle-admin/workspaces/:id` → détail workspace + settings client

## Sécurité

- Route `/buzzle-admin` gardée par `BuzzleSuperAdminGuard` qui vérifie `canAccessFullAdminPanel = true`
- Mutations custom loggent qui a fait quoi (nouvelle table `core.buzzleAdminAuditLog`)
- Impersonation limitée dans le temps (JWT 1h max, révocation possible)

## Templates de workspace

Un template définit :
- Objets custom à créer (avec `nameSingular`, `namePlural`, icône, description)
- Champs sur chaque objet (nom, type, options select, permissions par rôle)
- Statuts pipeline (pour objets de type "kanban")
- Vues par défaut
- Webhooks à configurer (endpoint n8n avec ID du workspace en query)
- Rôles à créer (client-viewer avec permissions restreintes)

Exemple `leads-google-ads.template.ts` :
```ts
export const leadsGoogleAdsTemplate: WorkspaceTemplate = {
  id: 'leads-google-ads',
  name: 'Leads Google Ads',
  description: 'Pipeline lead standard pour campagne Google Ads',
  objects: [
    {
      nameSingular: 'prospect',
      namePlural: 'prospects',
      icon: 'IconUsers',
      description: 'Prospects entrants depuis Google Ads',
      fields: [
        { name: 'name', type: 'FULL_NAME', required: true },
        { name: 'phone', type: 'PHONE', required: true },
        { name: 'email', type: 'EMAIL' },
        { name: 'message', type: 'TEXT' },
        { name: 'notes', type: 'RICH_TEXT' },
        { name: 'quoteAmount', type: 'CURRENCY' },
        { name: 'status', type: 'SELECT', options: [
          { label: 'Nouveau', value: 'new', color: 'blue' },
          { label: 'À rappeler', value: 'contacted', color: 'orange' },
          { label: 'Devis envoyé', value: 'quoted', color: 'purple' },
          { label: 'Signé', value: 'won', color: 'green' },
          { label: 'Perdu', value: 'lost', color: 'gray' },
        ]},
        // Hidden fields (client ne les voit pas)
        { name: 'gclid', type: 'TEXT', isHidden: true },
        { name: 'fbclid', type: 'TEXT', isHidden: true },
        { name: 'utmSource', type: 'TEXT', isHidden: true },
        { name: 'utmMedium', type: 'TEXT', isHidden: true },
        { name: 'utmCampaign', type: 'TEXT', isHidden: true },
        { name: 'octPushedAt', type: 'DATE_TIME', isHidden: true },
        { name: 'octPlatform', type: 'TEXT', isHidden: true },
      ],
    },
  ],
  views: [
    { objectId: 'prospect', name: 'Mes prospects', type: 'TABLE', columns: [...] },
    { objectId: 'prospect', name: 'Pipeline', type: 'KANBAN', groupBy: 'status' },
  ],
  webhooks: [
    {
      name: 'OCT to n8n',
      url: 'https://n8n.agence-buzzle.com/webhook/crm-oct/{{workspaceId}}',
      operation: 'update',
      objectId: 'prospect',
      onlyIfFieldChanged: 'status',
    },
  ],
  hiddenObjects: ['company', 'person', 'opportunity', 'task', 'note', 'pet', 'rocket'],
  roles: [
    {
      name: 'client-viewer',
      permissions: {
        canReadAllRecords: true,
        canUpdateAllRecords: false, // only status, notes, quoteAmount
        canDeleteAllRecords: false,
        canCreateRecords: false,
        objectRestrictedFields: {
          prospect: {
            updatable: ['status', 'notes', 'quoteAmount'],
            visible: ['name', 'phone', 'email', 'message', 'notes', 'quoteAmount', 'status'],
          },
        },
        canAccessSettings: false, // sauf profil perso
      },
    },
  ],
};
```

## Pipeline OCT

### Ingestion lead (LP → CRM)
```
LP (Google Ads / Meta) → Form submit → n8n webhook /ingest
  → n8n parse form data + captures gclid, fbclid, utm_*
  → n8n calls Twenty GraphQL createOneProspect mutation
  → Prospect créé dans workspace du client avec status=new
```

### Push OCT (CRM → Ads platforms)
```
Client change status new → contacted → quoted → won
  → Twenty webhook fire sur update Prospect
  → n8n receives payload {workspaceId, prospectId, oldStatus, newStatus, prospect data}
  → n8n route sur newStatus :
     - "quoted" → push OCT "Qualified Lead" (Google Ads + Meta Lead event)
     - "won" → push OCT "Purchase" avec quoteAmount (Google Ads + Meta Purchase event)
  → n8n stocke oct_pushed_at + oct_platform dans Prospect (update mutation)
```

### Config par workspace
Nouveau champ dans `core.workspace` : `buzzleConfig JSONB` qui stocke :
```json
{
  "googleAds": {
    "customerId": "404-144-5292",
    "conversionActions": {
      "quoted": "customers/4041445292/conversionActions/12345",
      "won": "customers/4041445292/conversionActions/12346"
    }
  },
  "metaCapi": {
    "pixelId": "1234567890",
    "accessToken": "EAAxxxx"
  }
}
```

## Roadmap effort

| Sprint | Livrable | Durée |
|---|---|---|
| S1 | Arch doc + CI/CD GHCR + module scaffold backend | Cette session |
| S2 | Backend module `buzzle-admin` : queries listAllWorkspacesWithStats + createWorkspaceFromTemplate | 1-2j |
| S3 | Frontend `/buzzle-admin` : cockpit + form création | 2j |
| S4 | Template `leads-google-ads` + provisioning workspace | 1j |
| S5 | Système UI variant (masquer objets par rôle) | 1j |
| S6 | Patch routing subdomain UX | 2h |
| S7 | n8n workflows OCT (Google Ads + Meta CAPI) | 1j |
| S8 | Test end-to-end sur Galaxy Glass pilote | 1j |
| **Total V1** | | **~7-8 jours cumulés** |
