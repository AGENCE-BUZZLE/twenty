import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ApplicationGalleryImageEntity } from 'src/engine/core-modules/application/application-gallery-image/application-gallery-image.entity';

@Injectable()
export class ApplicationGalleryImageService {
  constructor(
    @InjectRepository(ApplicationGalleryImageEntity)
    private readonly applicationGalleryImageRepository: Repository<ApplicationGalleryImageEntity>,
  ) {}

  async replaceApplicationGalleryImages({
    applicationId,
    fileIds,
  }: {
    applicationId: string;
    fileIds: string[];
  }): Promise<void> {
    await this.applicationGalleryImageRepository.delete({ applicationId });

    if (fileIds.length === 0) {
      return;
    }

    await this.applicationGalleryImageRepository.insert(
      fileIds.map((fileId, position) => ({ fileId, position, applicationId })),
    );
  }

  async replaceRegistrationGalleryImages({
    applicationRegistrationId,
    fileIds,
  }: {
    applicationRegistrationId: string;
    fileIds: string[];
  }): Promise<void> {
    await this.applicationGalleryImageRepository.delete({
      applicationRegistrationId,
    });

    if (fileIds.length === 0) {
      return;
    }

    await this.applicationGalleryImageRepository.insert(
      fileIds.map((fileId, position) => ({
        fileId,
        position,
        applicationRegistrationId,
      })),
    );
  }
}
