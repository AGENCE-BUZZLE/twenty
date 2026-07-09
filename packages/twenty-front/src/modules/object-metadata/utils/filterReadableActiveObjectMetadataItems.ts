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
    // When true, keep Twenty demo objects (Companies/People/etc.) visible.
    // Default false — hide them across the whole app.
    showTwentyDefaults?: boolean;
  },
): EnrichedObjectMetadataItem[] =>
  objectMetadataItems.filter((objectMetadataItem) => {
    if (!objectMetadataItem.isActive) {
      return false;
    }

    // Buzzle: hide standard Twenty demo objects from EVERYONE by
    // default (Companies, People, Deals, Notes, Tasks, Pets, Rockets,
    // Opportunities, Dashboards, Workflows...). This is a lead-focused
    // CRM — those objects don't fit the narrative.
    //
    // Callers that legitimately need to see them (e.g. record table
    // settings admin dropdown) pass options.showTwentyDefaults=true.
    const showTwentyDefaults = options?.showTwentyDefaults ?? false;

    if (
      !showTwentyDefaults &&
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
