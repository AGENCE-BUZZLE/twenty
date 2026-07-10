import { currentUserState } from '@/auth/states/currentUserState';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useMemo } from 'react';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Buzzle override of Twenty's default home path.
//
// Twenty's original hook computes the first-accessible object as the
// landing page. For Buzzle we always land clients on /overview
// (BuzzleOverviewPage), which is the true "home" of a client workspace,
// and land the super admin on /buzzle-admin. This gives us a single,
// stable landing surface per audience.
export const useDefaultHomePagePath = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );
  const areObjectMetadataItemsLoaded = metadataStore.status === 'up-to-date';

  const defaultHomePagePath = useMemo(() => {
    if (!isDefined(currentUser)) {
      return AppPath.SignInUp;
    }

    if (currentUser.canAccessFullAdminPanel === true) {
      return `/${AppPath.BuzzleAdmin}`;
    }

    // Hold on the index page until metadata is loaded so BuzzleOverviewPage
    // has a live currentWorkspace when it mounts.
    if (!areObjectMetadataItemsLoaded) {
      return AppPath.Index;
    }

    return '/overview';
  }, [currentUser, areObjectMetadataItemsLoaded]);

  return { defaultHomePagePath };
};
