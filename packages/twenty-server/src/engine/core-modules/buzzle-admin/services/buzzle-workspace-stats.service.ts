import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type BuzzleWorkspaceStatsDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-workspace-stats.dto';

@Injectable()
export class BuzzleWorkspaceStatsService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  async listAllWorkspacesWithStats(): Promise<BuzzleWorkspaceStatsDTO[]> {
    const workspaces = await this.workspaceRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    const stats = await Promise.all(
      workspaces.map(async (workspace) => {
        const totalUsers = await this.userWorkspaceRepository.count({
          where: { workspaceId: workspace.id, deletedAt: IsNull() },
        });

        return {
          id: workspace.id,
          displayName: workspace.displayName ?? '(no name)',
          subdomain: workspace.subdomain ?? '',
          activationStatus: workspace.activationStatus,
          totalUsers,
          createdAt: workspace.createdAt,
          lastActivityAt: workspace.updatedAt ?? undefined,
        };
      }),
    );

    return stats;
  }
}
