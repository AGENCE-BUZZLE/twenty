import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { AdminResolver } from 'src/engine/api/graphql/graphql-config/decorators/admin-resolver.decorator';
import { BuzzleCreateWorkspaceFromTemplateInput } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-create-workspace.input';
import { BuzzleCreatedWorkspaceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-created-workspace.dto';
import { BuzzleWorkspaceStatsDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-workspace-stats.dto';
import { BuzzleWorkspaceProvisioningService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-provisioning.service';
import { BuzzleWorkspaceStatsService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-stats.service';
import { BuzzleSuperAdminGuard } from 'src/engine/core-modules/buzzle-admin/guards/buzzle-super-admin.guard';

@AdminResolver()
export class BuzzleAdminResolver {
  constructor(
    private readonly buzzleWorkspaceStatsService: BuzzleWorkspaceStatsService,
    private readonly buzzleWorkspaceProvisioningService: BuzzleWorkspaceProvisioningService,
  ) {}

  @UseGuards(BuzzleSuperAdminGuard)
  @Query(() => [BuzzleWorkspaceStatsDTO], {
    description:
      'Lists all workspaces on the instance with per-workspace stats. Buzzle super admin cockpit query.',
  })
  async buzzleListAllWorkspacesWithStats(): Promise<BuzzleWorkspaceStatsDTO[]> {
    return this.buzzleWorkspaceStatsService.listAllWorkspacesWithStats();
  }

  @UseGuards(BuzzleSuperAdminGuard)
  @Mutation(() => BuzzleCreatedWorkspaceDTO, {
    description:
      'Provisions a new workspace + applies a template (Prospect object, statuses, view, OCT webhook). Buzzle super admin only.',
  })
  async buzzleCreateWorkspaceFromTemplate(
    @Args('input') input: BuzzleCreateWorkspaceFromTemplateInput,
  ): Promise<BuzzleCreatedWorkspaceDTO> {
    return this.buzzleWorkspaceProvisioningService.createWorkspaceFromTemplate(
      input,
    );
  }
}
