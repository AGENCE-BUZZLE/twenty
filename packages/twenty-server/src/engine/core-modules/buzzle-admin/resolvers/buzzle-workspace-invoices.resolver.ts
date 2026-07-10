import { UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { BuzzleInvoiceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-invoice.dto';
import { BuzzleZohoInvoiceService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-zoho-invoice.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

// Read-only query surfacing Zoho invoices for the current workspace. Auth is
// the standard workspace-scoped JWT — anyone with access to the workspace can
// see the invoices, mirroring how the Twenty UI treats billing pages.
@CoreResolver()
@UseGuards(WorkspaceAuthGuard, UserAuthGuard)
export class BuzzleWorkspaceInvoicesResolver {
  constructor(
    private readonly buzzleZohoInvoiceService: BuzzleZohoInvoiceService,
  ) {}

  @Query(() => [BuzzleInvoiceDTO], {
    description:
      'Zoho invoices for the current workspace. Empty array when the workspace is not linked to a Zoho customer.',
  })
  async myWorkspaceInvoices(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<BuzzleInvoiceDTO[]> {
    return this.buzzleZohoInvoiceService.listInvoicesForWorkspace(workspaceId);
  }
}
