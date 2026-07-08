import { currentUserState } from '@/auth/states/currentUserState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { useBuildSearchParamsFromUrlSyncedStates } from '@/domain-manager/hooks/useBuildSearchParamsFromUrlSyncedStates';
import { useBuildWorkspaceUrl } from '@/domain-manager/hooks/useBuildWorkspaceUrl';
import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useRedirectToWorkspaceDomain = () => {
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const currentUser = useAtomStateValue(currentUserState);
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
