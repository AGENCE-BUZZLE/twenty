import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type BuzzleWorkspaceStatsDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-workspace-stats.dto';

// Subdomains that identify Buzzle admin containers (not real client
// workspaces). Excluded from the cockpit "Mes workspaces clients" list
// so Clément only sees his actual clients.
const BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS: readonly string[] = [
  'gestion',
  'agence-buzzle',
];

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

    const clientWorkspaces = workspaces.filter(
      (workspace) =>
        workspace.subdomain === undefined ||
        !BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS.includes(workspace.subdomain),
    );

    const stats = await Promise.all(
      clientWorkspaces.map(async (workspace) => {
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
