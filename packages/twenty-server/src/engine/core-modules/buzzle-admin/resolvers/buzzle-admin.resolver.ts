import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { AdminResolver } from 'src/engine/api/graphql/graphql-config/decorators/admin-resolver.decorator';
import { ImpersonateDTO } from 'src/engine/core-modules/admin-panel/dtos/impersonate.dto';
import { BuzzleCreateWorkspaceFromTemplateInput } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-create-workspace.input';
import { BuzzleCreatedWorkspaceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-created-workspace.dto';
import { BuzzleWorkspaceStatsDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-workspace-stats.dto';
import { BuzzleSuperAdminGuard } from 'src/engine/core-modules/buzzle-admin/guards/buzzle-super-admin.guard';
import { BuzzleImpersonationService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-impersonation.service';
import { BuzzleWorkspaceProvisioningService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-provisioning.service';
import { BuzzleWorkspaceStatsService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-stats.service';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';

@AdminResolver()
export class BuzzleAdminResolver {
  constructor(
    private readonly buzzleWorkspaceStatsService: BuzzleWorkspaceStatsService,
    private readonly buzzleWorkspaceProvisioningService: BuzzleWorkspaceProvisioningService,
    private readonly buzzleImpersonationService: BuzzleImpersonationService,
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

  @UseGuards(BuzzleSuperAdminGuard)
  @Mutation(() => ImpersonateDTO, {
    description:
      'Opens a client workspace as super admin — picks a target user in that workspace and returns an impersonation login token + workspace URLs. Frontend uses the token to authenticate into the subdomain.',
  })
  async buzzleImpersonateWorkspace(
    @Args('workspaceId') workspaceId: string,
    @AuthUserWorkspaceId() impersonatorUserWorkspaceId: string | undefined,
  ): Promise<ImpersonateDTO> {
    if (!impersonatorUserWorkspaceId) {
      throw new UnauthorizedException(
        'Impersonator userWorkspace not found in request context. This mutation requires a real user session (not an API key).',
      );
    }

    return this.buzzleImpersonationService.impersonateWorkspace(
      workspaceId,
      impersonatorUserWorkspaceId,
    );
  }
}
