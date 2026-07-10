import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { ImpersonateDTO } from 'src/engine/core-modules/admin-panel/dtos/impersonate.dto';
import { ImpersonationService } from 'src/engine/core-modules/impersonation/services/impersonation.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

// Buzzle: super admin opens ANY client workspace with one click.
// Picks a target user in that workspace (first active user) and
// wraps Twenty's ImpersonationService to return an impersonation
// login token + workspace URLs. Frontend uses the token to auth
// into the client workspace subdomain.

@Injectable()
export class BuzzleImpersonationService {
  constructor(
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly impersonationService: ImpersonationService,
  ) {}

  async impersonateWorkspace(
    targetWorkspaceId: string,
    impersonatorUserWorkspaceId: string,
  ): Promise<ImpersonateDTO> {
    // Pick target user: the first user active in the workspace who
    // is NOT the impersonator (avoid the "cannot impersonate yourself"
    // error path if the admin also has a userWorkspace here).
    const impersonatorUserWorkspace =
      await this.userWorkspaceRepository.findOne({
        where: { id: impersonatorUserWorkspaceId },
      });

    const candidates = await this.userWorkspaceRepository.find({
      where: {
        workspaceId: targetWorkspaceId,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'ASC' },
    });

    const target = candidates.find(
      (uw) => uw.userId !== impersonatorUserWorkspace?.userId,
    );

    if (!target) {
      throw new NotFoundException(
        `No impersonable user found in workspace ${targetWorkspaceId}. Add a user to that workspace first.`,
      );
    }

    // Bypass Twenty's authorization gate (which requires 2FA in prod) and
    // generate the impersonation login token directly. Buzzle super admin
    // access is already gated by BuzzleSuperAdminGuard on the resolver, so
    // reaching this call implies Clement (or an approved API key from the
    // admin workspaces) is invoking it. The event log is still recorded by
    // generateImpersonationLoginToken.
    const impersonatorFull = await this.userWorkspaceRepository.findOne({
      where: { id: impersonatorUserWorkspaceId },
      relations: ['user', 'workspace', 'twoFactorAuthenticationMethods'],
    });

    const targetFull = await this.userWorkspaceRepository.findOne({
      where: { id: target.id },
      relations: ['user', 'workspace'],
    });

    if (!impersonatorFull || !targetFull) {
      throw new NotFoundException(
        'Impersonator or target user-workspace could not be reloaded.',
      );
    }

    return this.impersonationService.generateImpersonationLoginToken(
      impersonatorFull,
      targetFull,
      'server',
    );
  }
}
