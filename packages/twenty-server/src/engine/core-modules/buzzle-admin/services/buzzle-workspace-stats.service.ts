import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type BuzzleWorkspaceStatsDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-workspace-stats.dto';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';

// Subdomains that identify Buzzle admin containers (not real client
// workspaces). Excluded from the cockpit "Mes workspaces clients" list
// so Clément only sees his actual clients.
const BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS: readonly string[] = [
  'gestion',
  'agence-buzzle',
];

@Injectable()
export class BuzzleWorkspaceStatsService {
  private readonly logger = new Logger(BuzzleWorkspaceStatsService.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
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

    // Batch-check Contact object presence per workspace in a single query
    // so we don't do N round-trips against the metadata repository.
    const workspaceIds = clientWorkspaces.map((w) => w.id);
    const contactObjects =
      workspaceIds.length > 0
        ? await this.objectMetadataRepository
            .createQueryBuilder('om')
            .where('om.workspaceId IN (:...workspaceIds)', { workspaceIds })
            .andWhere('om.nameSingular = :name', { name: 'contact' })
            .andWhere('om.isActive = true')
            .getMany()
            .catch((error) => {
              this.logger.warn(
                `Contact-object presence lookup failed: ${
                  error instanceof Error ? error.message : 'unknown'
                }`,
              );
              return [];
            })
        : [];
    const workspacesWithContact = new Set(
      contactObjects.map((o) => o.workspaceId),
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
          hasContactObject: workspacesWithContact.has(workspace.id),
        };
      }),
    );

    return stats;
  }
}
