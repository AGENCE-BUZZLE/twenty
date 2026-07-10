# Buzzle Admin Module

Custom module Buzzle qui étend Twenty avec un cockpit agence multi-tenant.

## Endpoints exposés (route `/admin-panel` GraphQL)

Toutes les queries/mutations sont gated par `@AdminResolver()` → seuls les users avec `canAccessFullAdminPanel = true` y ont accès.

### Queries

- `buzzleListAllWorkspacesWithStats` (Liste tous les workspaces + stats (users, dernière activité)

### Mutations (à venir)

- `buzzleCreateWorkspaceFromTemplate(name, subdomain, templateId, ownerEmail)` (provisionne un workspace + applique un template (Prospect object + statuts + vue + webhook OCT)
- `buzzleUpdateWorkspaceCustomization(workspaceId, config)` (modifier statuts custom, cacher menus

## Architecture

```
buzzle-admin/
├── buzzle-admin.module.ts      # NestJS module
├── dtos/                       # GraphQL @ObjectType
├── resolvers/                  # @AdminResolver, expose queries/mutations
├── services/                   # Business logic
└── templates/                  # Workspace templates (leads-google-ads.template.ts) [S4]
```

## Registration

Le module est importé dans :
- `src/engine/core-modules/core-engine.module.ts` (module core)
- `src/engine/api/graphql/admin-panel-graphql-api.module.ts` (routing schema `/admin-panel`)

## Sprint status

- ✅ S2 (Scaffold module + `buzzleListAllWorkspacesWithStats` query
- ⏳ S2 (`buzzleCreateWorkspaceFromTemplate` mutation (utilise WorkspaceProvisioningService à créer)
- ⏳ S4 (Templates workspace en code
- ⏳ S3 (Frontend consumer `/buzzle-admin`

## Reference

Vise le pattern de `packages/twenty-server/src/engine/core-modules/admin-panel/` (module officiel Twenty).
