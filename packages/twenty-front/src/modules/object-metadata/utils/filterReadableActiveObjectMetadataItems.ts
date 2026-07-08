import { BUZZLE_HIDDEN_TWENTY_OBJECTS_FOR_CLIENTS } from '@/object-metadata/constants/BuzzleHiddenTwentyObjects';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectPermissions } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const filterReadableActiveObjectMetadataItems = (
  objectMetadataItems: EnrichedObjectMetadataItem[],
  objectPermissionsByObjectMetadataId: Record<
    string,
    ObjectPermissions & { objectMetadataId: string }
  >,
  options?: {
    isBuzzleSuperAdmin?: boolean;
  },
): EnrichedObjectMetadataItem[] =>
  objectMetadataItems.filter((objectMetadataItem) => {
    if (!objectMetadataItem.isActive) {
      return false;
    }

    // Buzzle: hide standard Twenty objects from client workspaces.
    // Super admins still see them (isBuzzleSuperAdmin default true so
    // existing callers that don't pass the option don't regress).
    const isBuzzleSuperAdmin = options?.isBuzzleSuperAdmin ?? true;

    if (
      !isBuzzleSuperAdmin &&
      BUZZLE_HIDDEN_TWENTY_OBJECTS_FOR_CLIENTS.includes(
        objectMetadataItem.nameSingular,
      )
    ) {
      return false;
    }

    const objectPermissions =
      objectPermissionsByObjectMetadataId[objectMetadataItem.id];

    if (!isDefined(objectPermissions)) {
      return true;
    }

    return objectPermissions.canReadObjectRecords;
  });
