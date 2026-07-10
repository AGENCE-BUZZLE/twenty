import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useMemo } from 'react';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Buzzle override of Twenty's default home path.
//
// Landing rules:
//   - unauthenticated                            -> /sign-in-up
//   - super admin AND on the admin workspace     -> /buzzle-admin (cockpit)
//   - anyone else (super admin on a client, or
//     regular client)                            -> /overview
//
// The admin workspace subdomains are 'gestion' (current) and
// 'agence-buzzle' (legacy). When Clement impersonates himself into a
// client workspace, he lands on /overview like the client would, which
// mirrors the client experience for his hand-holding sessions.
const BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS: readonly string[] = [
  'gestion',
  'agence-buzzle',
];

export const useDefaultHomePagePath = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );
  const areObjectMetadataItemsLoaded = metadataStore.status === 'up-to-date';

  const defaultHomePagePath = useMemo(() => {
    if (!isDefined(currentUser)) {
      return AppPath.SignInUp;
    }

    const isSuperAdmin = currentUser.canAccessFullAdminPanel === true;
    const isAdminWorkspace =
      isDefined(currentWorkspace?.subdomain) &&
      BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS.includes(currentWorkspace.subdomain);

    if (isSuperAdmin && isAdminWorkspace) {
      return `/${AppPath.BuzzleAdmin}`;
    }

    // Hold on the index page until metadata is loaded so BuzzleOverviewPage
    // has a live currentWorkspace when it mounts.
    if (!areObjectMetadataItemsLoaded) {
      return AppPath.Index;
    }

    return '/overview';
  }, [currentUser, currentWorkspace, areObjectMetadataItemsLoaded]);

  return { defaultHomePagePath };
};
