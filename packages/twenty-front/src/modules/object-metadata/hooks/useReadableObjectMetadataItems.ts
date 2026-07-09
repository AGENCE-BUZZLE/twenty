import { useMemo } from 'react';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { filterReadableActiveObjectMetadataItems } from '@/object-metadata/utils/filterReadableActiveObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';

// Buzzle: filterReadableActiveObjectMetadataItems now hides Twenty
// demo objects (Companies/People/Deals/Pets/Rockets/etc.) by default
// for EVERYONE. The nav drawer, kanban, mention search and every
// consumer of this hook get the trimmed list — a lead-focused CRM.
export const useReadableObjectMetadataItems = () => {
  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const readableObjectMetadataItems = useMemo(
    () =>
      filterReadableActiveObjectMetadataItems(
        activeObjectMetadataItems,
        objectPermissionsByObjectMetadataId,
      ),
    [activeObjectMetadataItems, objectPermissionsByObjectMetadataId],
  );

  return { readableObjectMetadataItems };
};
