import { type ApplicationManifest } from 'twenty-shared/application';

export const toGalleryImagePaths = (
  application: ApplicationManifest | undefined,
): string[] => application?.galleryImages ?? application?.screenshots ?? [];
