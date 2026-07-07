# syntax=docker/dockerfile:1
ARG TWENTY_TAG=v2.18.5
FROM twentycrm/twenty:${TWENTY_TAG}

# --- Buzzle branding overlay ---
# Overrides frontend assets baked in the vanilla Twenty image
# Path inside container: /app/packages/twenty-server/dist/front/

# 1) Favicons + PWA icons (Buzzle logo)
COPY images/icons/android/ /app/packages/twenty-server/dist/front/images/icons/android/
COPY images/icons/ios/ /app/packages/twenty-server/dist/front/images/icons/ios/

# 2) PWA manifest — name "Buzzle CRM"
COPY manifest.json /app/packages/twenty-server/dist/front/manifest.json

# 3) Integration reference to Twenty logo swapped to Buzzle (used in tabs listing)
COPY buzzle-logo.svg /app/packages/twenty-server/dist/front/images/integrations/twenty-logo.svg

# 4) Rebrand meta tags in the served index.html (static parts)
USER root
RUN sed -i \
  -e 's|content="A modern open-source CRM"|content="CRM Buzzle — leads Google Ads \& Meta Ads"|g' \
  -e 's|<meta property="og:title" content="Twenty"|<meta property="og:title" content="Buzzle CRM"|g' \
  -e 's|content="#000000"|content="#14141c"|g' \
  /app/packages/twenty-server/dist/front/index.html && \
  sed -i 's|<meta charset="UTF-8" />|<meta charset="UTF-8" />\n    <title>Buzzle CRM</title>|' \
    /app/packages/twenty-server/dist/front/index.html

# Keep original entrypoint from base image
