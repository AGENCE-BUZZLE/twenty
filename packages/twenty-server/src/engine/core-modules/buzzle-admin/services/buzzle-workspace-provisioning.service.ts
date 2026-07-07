import { Injectable, NotImplementedException } from '@nestjs/common';

import { type BuzzleCreatedWorkspaceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-created-workspace.dto';
import { type BuzzleCreateWorkspaceFromTemplateInput } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-create-workspace.input';

// Skeleton service for Sprint S4 — provisioning logic will call:
// - WorkspaceService.createWorkspace(...) from Twenty core
// - TemplateApplierService.applyTemplate(workspaceId, templateId)
// - WebhookService.createWebhook(workspaceId, oct-webhook-url)
// - SendEmailService.sendWorkspaceInvite(ownerEmail, workspaceId)
//
// Kept as scaffold in Sprint S2 so the resolver mutation compiles.
// The actual implementation will be delivered in Sprint S4 when the
// template system is coded.

@Injectable()
export class BuzzleWorkspaceProvisioningService {
  async createWorkspaceFromTemplate(
    input: BuzzleCreateWorkspaceFromTemplateInput,
  ): Promise<BuzzleCreatedWorkspaceDTO> {
    // TODO S4: wire actual provisioning
    // 1. Validate subdomain uniqueness
    // 2. Create workspace via WorkspaceService
    // 3. Provision default admin user + send invite email
    // 4. Apply template (create Prospect object + fields + statuses + view)
    // 5. Setup webhook to n8n for OCT
    // 6. Return created workspace summary
    throw new NotImplementedException(
      `buzzleCreateWorkspaceFromTemplate not yet implemented — coming in Sprint S4. Requested template: ${input.templateId}, subdomain: ${input.subdomain}`,
    );
  }
}
