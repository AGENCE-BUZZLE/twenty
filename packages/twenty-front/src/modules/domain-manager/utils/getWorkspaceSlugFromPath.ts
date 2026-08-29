// Buzzle path-based routing (additif au sous-domaine).
// Quand le CRM est servi sur `crm.agence-buzzle.com/{slug}/...` (mode path),
// le 1er segment de l'URL est le slug du workspace. On l'extrait ici.
// Les routes racine (sign-in, verify, assets...) NE sont PAS des slugs.

// Segments de 1er niveau réservés = routes app/auth servies sur le domaine par
// défaut, jamais un slug de workspace.
const RESERVED_ROOT_SEGMENTS = new Set<string>([
  'sign-in',
  'sign-up',
  'invite',
  'verify',
  'verify-email',
  'authorize',
  'reset-password',
  'create-profile',
  'sync-emails',
  'install-apps',
  'invite-team',
  'plan-required',
  'plan-required-success',
  'book-call',
  'welcome',
  'not-found',
  'assets',
  'files',
  'favicon.ico',
  'manifest.json',
  'healthz',
]);

// Slug de workspace autorisé : minuscules, chiffres, tirets (comme la colonne subdomain).
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}$/;

export const getWorkspaceSlugFromPath = (
  pathname: string = window.location.pathname,
): string | undefined => {
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (
    firstSegment === undefined ||
    RESERVED_ROOT_SEGMENTS.has(firstSegment) ||
    !SLUG_REGEX.test(firstSegment)
  ) {
    return undefined;
  }

  return firstSegment;
};

// Mode path actif = on est sur le domaine « racine » (bare frontDomain OU
// {defaultSubdomain}.{frontDomain}, jamais un sous-domaine de workspace) ET un
// slug valide est présent dans le path.
type PathBasedDomainConfig = {
  frontDomain?: string;
  defaultSubdomain?: string;
};

export const getIsPathBasedWorkspace = ({
  frontDomain,
  defaultSubdomain,
}: PathBasedDomainConfig): boolean => {
  if (frontDomain === undefined || frontDomain === '') {
    return false;
  }

  const hostname = window.location.hostname;
  const isOnRootDomain =
    hostname === frontDomain ||
    (defaultSubdomain !== undefined &&
      hostname === `${defaultSubdomain}.${frontDomain}`);

  return isOnRootDomain && getWorkspaceSlugFromPath() !== undefined;
};

// Basename React Router en mode path : `/{slug}`, sinon undefined (racine).
export const getWorkspaceRouterBasename = (
  config: PathBasedDomainConfig,
): string | undefined => {
  if (!getIsPathBasedWorkspace(config)) {
    return undefined;
  }

  const slug = getWorkspaceSlugFromPath();

  return slug !== undefined ? `/${slug}` : undefined;
};
