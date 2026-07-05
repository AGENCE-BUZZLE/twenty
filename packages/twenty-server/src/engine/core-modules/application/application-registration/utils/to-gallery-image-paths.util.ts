import { type ApplicationManifest } from 'twenty-shared/application';

export const toGalleryImagePaths = (
  application: ApplicationManifest | undefined,
): string[] => {
  const galleryImages = application?.galleryImages;

  if (galleryImages && galleryImages.length > 0) {
    return [...galleryImages]
      .sort((a, b) => a.position - b.position)
      .map((galleryImage) => galleryImage.path);
  }

  return application?.screenshots ?? [];
};
