import { useMemo } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { filterReadableActiveObjectMetadataItems } from '@/object-metadata/utils/filterReadableActiveObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useReadableObjectMetadataItems = () => {
  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const currentUser = useAtomStateValue(currentUserState);
  const isBuzzleSuperAdmin = currentUser?.canAccessFullAdminPanel === true;

  const readableObjectMetadataItems = useMemo(
    () =>
      filterReadableActiveObjectMetadataItems(
        activeObjectMetadataItems,
        objectPermissionsByObjectMetadataId,
        { isBuzzleSuperAdmin },
      ),
    [
      activeObjectMetadataItems,
      objectPermissionsByObjectMetadataId,
      isBuzzleSuperAdmin,
    ],
  );

  return { readableObjectMetadataItems };
};
