import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { ImpersonationModule } from 'src/engine/core-modules/impersonation/impersonation.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
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
    TypeOrmModule.forFeature([WorkspaceEntity, UserWorkspaceEntity]),
    ImpersonationModule,
    AuthModule,
    UserModule,
    ObjectMetadataModule,
    FieldMetadataModule,
    WebhookModule,
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
