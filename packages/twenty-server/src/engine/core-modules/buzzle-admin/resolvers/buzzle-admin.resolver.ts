import { Query } from '@nestjs/graphql';

import { AdminResolver } from 'src/engine/api/graphql/graphql-config/decorators/admin-resolver.decorator';
import { BuzzleWorkspaceStatsDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-workspace-stats.dto';
import { BuzzleWorkspaceStatsService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-workspace-stats.service';

@AdminResolver()
export class BuzzleAdminResolver {
  constructor(
    private readonly buzzleWorkspaceStatsService: BuzzleWorkspaceStatsService,
  ) {}

  @Query(() => [BuzzleWorkspaceStatsDTO], {
    description:
      'Lists all workspaces on the instance with per-workspace stats. Buzzle super admin cockpit query.',
  })
  async buzzleListAllWorkspacesWithStats(): Promise<BuzzleWorkspaceStatsDTO[]> {
    return this.buzzleWorkspaceStatsService.listAllWorkspacesWithStats();
  }
}
