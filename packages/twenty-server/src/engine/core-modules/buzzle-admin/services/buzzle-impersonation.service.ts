import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { ImpersonateDTO } from 'src/engine/core-modules/admin-panel/dtos/impersonate.dto';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';

// Buzzle: super admin opens a client workspace with one click.
//
// Rather than doing a real Twenty impersonation (which requires a
// separate target user, workspaceMember row and 2FA), we generate a
// plain LOGIN token for the same super-admin user in the target
// workspace. Clement's userWorkspace + workspaceMember exist in every
// client workspace by convention (he is the workspace creator via the
// cockpit's Nouveau workspace flow), so the login token exchange
// succeeds without any of the impersonation-flow constraints.

@Injectable()
export class BuzzleImpersonationService {
  constructor(
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly loginTokenService: LoginTokenService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {}

  async impersonateWorkspace(
    targetWorkspaceId: string,
    impersonatorUserWorkspaceId: string,
  ): Promise<ImpersonateDTO> {
    const impersonatorUserWorkspace =
      await this.userWorkspaceRepository.findOne({
        where: { id: impersonatorUserWorkspaceId },
        relations: ['user'],
      });

    if (!impersonatorUserWorkspace) {
      throw new NotFoundException(
        `Impersonator userWorkspace ${impersonatorUserWorkspaceId} not found.`,
      );
    }

    const targetWorkspace = await this.workspaceRepository.findOne({
      where: { id: targetWorkspaceId },
    });

    if (!targetWorkspace) {
      throw new NotFoundException(
        `Target workspace ${targetWorkspaceId} not found.`,
      );
    }

    // Look for the super admin's userWorkspace in the target workspace.
    // If missing, we cannot log him in there. That means the target
    // workspace was created outside of the Buzzle cockpit flow.
    const superAdminInTarget = await this.userWorkspaceRepository.findOne({
      where: {
        userId: impersonatorUserWorkspace.user.id,
        workspaceId: targetWorkspaceId,
        deletedAt: IsNull(),
      },
    });

    if (!superAdminInTarget) {
      throw new NotFoundException(
        `Super admin ${impersonatorUserWorkspace.user.email} is not a member of workspace ${targetWorkspaceId}. Add him as a workspace member first.`,
      );
    }

    const loginToken = await this.loginTokenService.generateLoginToken(
      impersonatorUserWorkspace.user.email,
      targetWorkspaceId,
      AuthProviderEnum.Password,
    );

    return {
      workspace: {
        id: targetWorkspaceId,
        workspaceUrls:
          this.workspaceDomainsService.getWorkspaceUrls(targetWorkspace),
      },
      loginToken,
    };
  }
}
