# Buzzle Tools

Scripts et configs annexes à Twenty pour la plateforme Buzzle CRM.

Contrairement aux modules dans `packages/twenty-server/…/buzzle-admin/` qui sont
compilés dans l'image Docker, ces outils vivent en dehors et se lancent depuis
Claude Code ou depuis le VPS.

## Structure

```
buzzle-tools/
├── scripts/
│   ├── create-n8n-oct-workflow.py    # Crée le workflow OCT dans n8n via API
│   ├── (à venir) create-google-ads-conversions.py
│   ├── (à venir) apply-workspace-template.py
│   └── (à venir) deploy-crm-image.sh
└── n8n-workflows/
    └── (workflows exportés en JSON pour versionning)
```

## Prérequis

Ces scripts s'attendent à trouver des credentials dans `~/.claude/secrets/` :

- `n8n.env` — `N8N_API_KEY` + `N8N_BASE_URL` (ou `http://localhost:5678` si run sur le VPS)
- `twenty-admin.env` — `TWENTY_API_KEY` (JWT admin d'un workspace Buzzle)
- `google-ads.env` — refresh token OAuth + developer token pour l'API Google Ads
- `github.env` (optionnel) — token GitHub pour le push d'images GHCR

## Scripts disponibles

### create-n8n-oct-workflow.py

Crée le workflow n8n `Buzzle CRM - OCT push (Google Ads + Meta CAPI)` :
- Webhook `POST /webhook/crm-oct` — reçoit les événements Twenty prospect update
- Normalize node — extrait workspaceId + status + gclid + fbclid + quoteAmount
- Branchement conditionnel — ne pousse que si status change vers `quoted` ou `won`
- Sub-nodes Google Ads OCT + Meta CAPI (placeholders pour l'instant)

Lancement :
```bash
. ~/.claude/secrets/n8n.env
export N8N_API_KEY N8N_BASE_URL
python3 buzzle-tools/scripts/create-n8n-oct-workflow.py
```

Idempotence : lancer plusieurs fois créera plusieurs workflows en doublon (n8n
n'a pas de merge). Supprimer les anciens via UI n8n avant relance.

### État V1 du workflow OCT

- ✅ Webhook actif, reçoit et parse le payload Twenty
- ✅ Branchement par status change (quoted / won)
- ⏳ Google Ads OCT push — placeholder Set node, à remplacer par vraie HTTP call
  à `customers/{customerId}/conversionUploads:uploadClickConversions` avec
  refresh du token OAuth (V2 quand on aura la config par workspace)
- ⏳ Meta CAPI — placeholder Set node, à remplacer par HTTP call à
  `graph.facebook.com/v21.0/{pixelId}/events` (V2)
- ⏳ Update prospect octPushedAt — TODO (call Twenty GraphQL mutation)

### Config par workspace (à définir)

Chaque workspace client Buzzle aura besoin en config :

```json
{
  "googleAds": {
    "customerId": "4041445292",
    "conversionActions": {
      "quoted": "customers/4041445292/conversionActions/12345",
      "won": "customers/4041445292/conversionActions/12346"
    },
    "refreshToken": "1//..."
  },
  "metaCapi": {
    "pixelId": "1234567890",
    "accessToken": "EAA..."
  }
}
```

Stocké soit :
- Dans la config workspace Twenty (JSONB `buzzleConfig` sur `core.workspace`) →
  requiert un fork mod (Sprint S6+)
- Ou dans n8n en variables globales par workspaceId
- Ou dans un fichier `~/.buzzle/workspace-configs/{workspaceId}.json`

Décision reportée à Sprint S7 part 2 quand on wire les vraies HTTP calls.
