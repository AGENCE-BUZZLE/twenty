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

    return this.impersonationService.impersonate(
      target.userId,
      targetWorkspaceId,
      impersonatorUserWorkspaceId,
    );
  }
}
