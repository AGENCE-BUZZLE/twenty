import { Helmet } from '@dr.pogodin/react-helmet';

// Buzzle white-label: always ship the Buzzle CRM favicon regardless of the
// per-workspace logo. Twenty's original component swapped in the workspace
// logo at runtime, which surfaced any legacy logo still stored on the
// workspace (e.g. Galaxy Glass shipping the old "fix it" mark) as the
// browser tab favicon.
const BUZZLE_FAVICON_HREF = '/images/favicon-crm-buzzle.png?v=2';

export const PageFavicon = () => (
  <Helmet>
    <link rel="icon" type="image/png" href={BUZZLE_FAVICON_HREF} />
    <link rel="apple-touch-icon" href={BUZZLE_FAVICON_HREF} />
  </Helmet>
);
