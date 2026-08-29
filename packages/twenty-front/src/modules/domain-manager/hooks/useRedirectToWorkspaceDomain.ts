import { currentUserState } from '@/auth/states/currentUserState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { useBuildSearchParamsFromUrlSyncedStates } from '@/domain-manager/hooks/useBuildSearchParamsFromUrlSyncedStates';
import { useBuildWorkspaceUrl } from '@/domain-manager/hooks/useBuildWorkspaceUrl';
import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { getIsPathBasedWorkspace } from '@/domain-manager/utils/getWorkspaceSlugFromPath';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useRedirectToWorkspaceDomain = () => {
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const currentUser = useAtomStateValue(currentUserState);
  const domainConfiguration = useAtomStateValue(domainConfigurationState);
  const { buildWorkspaceUrl } = useBuildWorkspaceUrl();
  const { redirect } = useRedirect();

  const { buildSearchParamsFromUrlSyncedStates } =
    useBuildSearchParamsFromUrlSyncedStates();

  const redirectToWorkspaceDomain = async (
    baseUrl: string,
    pathname?: string,
    searchParams?: Record<string, string | boolean>,
    target?: string,
  ) => {
    if (!isMultiWorkspaceEnabled) return;

    // Buzzle path-based : en mode path (crm.agence-buzzle.com/{slug}), on est
    // déjà sur l'URL canonique du workspace → ne pas rediriger vers le sous-domaine.
    if (
      getIsPathBasedWorkspace({
        frontDomain: domainConfiguration.frontDomain,
        defaultSubdomain: domainConfiguration.defaultSubdomain,
      })
    ) {
      return;
    }

    // Buzzle: super admins stay on their current domain when switching
    // workspaces (kills the annoying subdomain redirect for Clément).
    // Regular users still get the standard multi-workspace redirect.
    if (currentUser?.canAccessFullAdminPanel === true) {
      return;
    }

    redirect(
      buildWorkspaceUrl(baseUrl, pathname, {
        ...searchParams,
        ...(await buildSearchParamsFromUrlSyncedStates()),
      }),
      target,
    );
  };

  return {
    redirectToWorkspaceDomain,
  };
};
