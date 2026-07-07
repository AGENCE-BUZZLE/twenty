# Buzzle CRM — Deploy sur VPS

## Environnement de prod

- VPS Hostinger `srv897353` — IP `31.97.77.214`
- OS Ubuntu 24.04
- Stack : `/opt/twenty/` avec Docker Compose (Postgres 16 + Redis + Twenty server + worker)
- Reverse proxy : nginx + Let's Encrypt
- Domaines couverts : `crm.agence-buzzle.com`, `app.crm.agence-buzzle.com`, `agence-buzzle.crm.agence-buzzle.com`, `galaxy-glass.crm.agence-buzzle.com`

## Deploy manuel depuis GitHub Actions

Chaque push sur `buzzle-main` déclenche `build-buzzle-overlay.yml` qui build et push `ghcr.io/agence-buzzle/crm:{tags}`.

Sur le VPS pour pull la nouvelle version :

```bash
ssh clement@31.97.77.214
cd /opt/twenty
# Login GHCR one-time (personal access token avec read:packages)
echo $GHCR_TOKEN | sudo docker login ghcr.io -u AGENCE-BUZZLE --password-stdin

# Update docker-compose.yml pour utiliser l'image GHCR
sudo sed -i 's|image: buzzle-crm:.*|image: ghcr.io/agence-buzzle/crm:latest|g' docker-compose.yml
sudo docker compose pull
sudo docker compose up -d --force-recreate server worker
```

## Deploy auto (à setup)

Option 1 : cron sur VPS toutes les nuits qui pull + redeploy si nouvelle image
Option 2 : webhook GHCR → n8n → SSH VPS
Option 3 : GitHub Actions étape "deploy" qui SSH depuis le workflow (nécessite SSH key en secret)

## Rollback

```bash
sudo sed -i 's|image: ghcr.io/agence-buzzle/crm:.*|image: ghcr.io/agence-buzzle/crm:v1.0.1|g' /opt/twenty/docker-compose.yml
sudo docker compose -f /opt/twenty/docker-compose.yml up -d --force-recreate server worker
```

## Variables d'environnement critiques

Dans `/opt/twenty/.env` (chmod 600) :
- `SERVER_URL=https://crm.agence-buzzle.com`
- `IS_MULTIWORKSPACE_ENABLED=true`
- `AUTH_PASSWORD_ENABLED=true`
- `PG_DATABASE_PASSWORD=…` (generated openssl rand)
- `ENCRYPTION_KEY=…`
- `FALLBACK_ENCRYPTION_KEY=…`
- `APP_SECRET=…`

**Ne jamais commit** ce fichier.

## Backup DB

Setup à faire (V1) :
```bash
# Cron quotidien 3h du mat
0 3 * * * sudo docker exec twenty-db-1 pg_dump -U postgres default | gzip > /var/backups/twenty/db-$(date +\%Y\%m\%d).sql.gz
```
