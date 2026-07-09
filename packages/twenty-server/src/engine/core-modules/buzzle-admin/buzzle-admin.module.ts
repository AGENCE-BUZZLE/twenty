import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImpersonationModule } from 'src/engine/core-modules/impersonation/impersonation.module';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { BuzzleAdminResolver } from 'src/engine/core-modules/buzzle-admin/resolvers/buzzle-admin.resolver';
import { BuzzleImpersonationService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-impersonation.service';
import { BuzzleTemplateApplierService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-template-applier.service';
import { BuzzleWorkspaceProvisioningService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-provisioning.service';
import { BuzzleWorkspaceStatsService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity, UserWorkspaceEntity]),
    ImpersonationModule,
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
