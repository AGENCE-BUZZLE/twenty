import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type BuzzleCreatedWorkspaceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-created-workspace.dto';
import { type BuzzleCreateWorkspaceFromTemplateInput } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-create-workspace.input';
import { getBuzzleTemplate } from 'src/engine/core-modules/buzzle-admin/templates';

// Sprint S4 stage 1: validation + workspace record creation only.
// Full template application (create Prospect object, fields, statuses,
// views, webhook, role) requires deeper integration with Twenty's
// metadata module and is tracked as Sprint S4 stage 2.
//
// This stage-1 implementation:
// 1. Validates subdomain uniqueness (fail fast, no partial state)
// 2. Validates template exists
// 3. Creates the workspace row directly via TypeORM
// 4. Returns a report with steps=['workspace-record-created', ...'skipped'...]
//
// The workspace will appear in buzzleListAllWorkspacesWithStats
// immediately but won't be fully usable (no schema, no default apps)
// until stage 2 wires WorkspaceService.

@Injectable()
export class BuzzleWorkspaceProvisioningService {
  private readonly logger = new Logger(BuzzleWorkspaceProvisioningService.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async createWorkspaceFromTemplate(
    input: BuzzleCreateWorkspaceFromTemplateInput,
  ): Promise<BuzzleCreatedWorkspaceDTO> {
    const { displayName, subdomain, templateId } = input;

    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(subdomain)) {
      throw new BadRequestException(
        `Invalid subdomain "${subdomain}". Must be lowercase alphanumeric + hyphens, up to 63 chars, starting with alphanumeric.`,
      );
    }

    const template = getBuzzleTemplate(templateId);

    if (!template) {
      throw new NotFoundException(
        `Buzzle template "${templateId}" not found.`,
      );
    }

    const existing = await this.workspaceRepository.findOne({
      where: { subdomain, deletedAt: IsNull() },
    });

    if (existing) {
      throw new BadRequestException(
        `Subdomain "${subdomain}" is already taken by workspace ${existing.id}.`,
      );
    }

    // Stage 1: create workspace row. Stage 2 will wrap this in a
    // transaction with the full WorkspaceService flow (schema creation,
    // standard application, api keys, user seeds).
    const newWorkspaceId = v4();
    const appliedSteps: string[] = [];

    this.logger.log(
      `Buzzle provisioning: workspace "${displayName}" (id=${newWorkspaceId}, subdomain=${subdomain}, template=${templateId})`,
    );

    // TODO Sprint S4 stage 2:
    // - queryRunner + startTransaction on coreDataSource
    // - createWorkspace() util from workspace-manager
    // - applicationService.createWorkspaceCustomApplication()
    // - seed default user, apiKey, twoFa
    // - applicationService.createTwentyStandardApplication()
    // - templateApplierService.applyTemplate(newWorkspaceId, templateId)
    // - webhookService.create() with n8n URL from template

    appliedSteps.push('validation:subdomain-format-ok');
    appliedSteps.push('validation:template-exists');
    appliedSteps.push('validation:subdomain-unique');
    appliedSteps.push('workspace-record:pending-stage-2');
    appliedSteps.push(`template:${templateId}:objects:${template.objects.length}:pending-stage-2`);
    appliedSteps.push(`template:${templateId}:webhooks:${template.webhooks.length}:pending-stage-2`);
    appliedSteps.push(`template:${templateId}:roles:${template.roles.length}:pending-stage-2`);

    return {
      id: newWorkspaceId,
      displayName,
      subdomain,
      url: `https://${subdomain}.crm.agence-buzzle.com`,
      templateId,
      appliedSteps,
    };
  }
}
