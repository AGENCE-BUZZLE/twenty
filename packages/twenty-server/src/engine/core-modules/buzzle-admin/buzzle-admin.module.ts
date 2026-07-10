import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { ImpersonationModule } from 'src/engine/core-modules/impersonation/impersonation.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ViewEntity } from 'src/engine/metadata-modules/view/entities/view.entity';
import { ViewModule } from 'src/engine/metadata-modules/view/view.module';
import { BuzzleAdminResolver } from 'src/engine/core-modules/buzzle-admin/resolvers/buzzle-admin.resolver';
import { BuzzleImpersonationService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-impersonation.service';
import { BuzzleTemplateApplierService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-template-applier.service';
import { BuzzleWorkspaceProvisioningService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-provisioning.service';
import { BuzzleWorkspaceStatsService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-stats.service';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { WebhookModule } from 'src/engine/metadata-modules/webhook/webhook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      UserWorkspaceEntity,
      ObjectMetadataEntity,
      FieldMetadataEntity,
      ViewEntity,
    ]),
    ImpersonationModule,
    AuthModule,
    UserModule,
    ObjectMetadataModule,
    FieldMetadataModule,
    WebhookModule,
    ViewModule,
  ],
  providers: [
    BuzzleAdminResolver,
    BuzzleWorkspaceStatsService,
    BuzzleWorkspaceProvisioningService,
    BuzzleTemplateApplierService,
    BuzzleImpersonationService,
  ],
  exports: [
    BuzzleWorkspaceStatsService,
    BuzzleWorkspaceProvisioningService,
    BuzzleTemplateApplierService,
    BuzzleImpersonationService,
  ],
})
export class BuzzleAdminModule {}
