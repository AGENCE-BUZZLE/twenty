import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';

import { BuzzleZohoInvoiceService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-zoho-invoice.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

// REST endpoint for streaming a Zoho invoice PDF back to the browser. Kept
// as REST (not GraphQL) so the browser can download the binary directly.
@Controller('rest/buzzle')
@UseGuards(WorkspaceAuthGuard, UserAuthGuard)
export class BuzzleInvoicesController {
  constructor(
    private readonly buzzleZohoInvoiceService: BuzzleZohoInvoiceService,
  ) {}

  @Get('invoices/:invoiceId/pdf')
  async downloadInvoicePdf(
    @Param('invoiceId') invoiceId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Res() res: Response,
  ): Promise<void> {
    if (!/^\d+$/.test(invoiceId)) {
      throw new BadRequestException('Invalid invoice id');
    }

    const owns = await this.buzzleZohoInvoiceService.ownsInvoice(
      invoiceId,
      workspaceId,
    );

    if (!owns) {
      throw new ForbiddenException('This invoice does not belong to your workspace');
    }

    let payload: { buffer: Buffer; number: string };

    try {
      payload = await this.buzzleZohoInvoiceService.downloadInvoicePdf(
        invoiceId,
      );
    } catch (err) {
      throw new NotFoundException(
        `Impossible de recuperer la facture (${(err as Error).message})`,
      );
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${payload.number}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(payload.buffer);
  }
}
