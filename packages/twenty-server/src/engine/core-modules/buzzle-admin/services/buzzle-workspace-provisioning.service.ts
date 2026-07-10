import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { getBuzzleTemplate } from 'src/engine/core-modules/buzzle-admin/templates';
import { BuzzleTemplateApplierService } from 'src/engine/core-modules/buzzle-admin/services/buzzle-template-applier.service';
import { type BuzzleCreatedWorkspaceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-created-workspace.dto';
import { type BuzzleCreateWorkspaceFromTemplateInput } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-create-workspace.input';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

// Sprint S4 stage 2: real workspace creation.
//
// Wraps Twenty's SignInUpService.signUpOnNewWorkspace() which handles
// the full pending → active flow (workspace row, custom application,
// user-workspace membership, standard application seed, schema init).
// Then applies the Buzzle template on top (Prospect object, statuses,
// view, webhook) that piece is still TODO (BuzzleTemplateApplierService).
//
// The impersonator MUST be a real authenticated user (not an API key)
// because signUpOnNewWorkspace needs a full UserEntity to seed the
// workspace membership.

@Injectable()
export class BuzzleWorkspaceProvisioningService {
  private readonly logger = new Logger(BuzzleWorkspaceProvisioningService.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly signInUpService: SignInUpService,
    private readonly userService: UserService,
    private readonly templateApplierService: BuzzleTemplateApplierService,
  ) {}

  async createWorkspaceFromTemplate(
    input: BuzzleCreateWorkspaceFromTemplateInput,
    creatorUserId: string | undefined,
  ): Promise<BuzzleCreatedWorkspaceDTO> {
    const { displayName, subdomain, templateId } = input;

    if (!creatorUserId) {
      throw new UnauthorizedException(
        'Workspace creation requires a real user session. API-key auth is not supported for this mutation.',
      );
    }

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

    const creator = await this.userService.findUserByIdOrThrow(creatorUserId);

    const appliedSteps: string[] = [];

    appliedSteps.push('validation:subdomain-format-ok');
    appliedSteps.push('validation:template-exists');
    appliedSteps.push('validation:subdomain-unique');

    this.logger.log(
      `Buzzle provisioning: workspace "${displayName}" (subdomain=${subdomain}, template=${templateId}, creator=${creator.email})`,
    );

    // Twenty owns the transaction. signUpOnNewWorkspace creates:
    // - workspace row (PENDING_CREATION → then activated inside the flow)
    // - workspaceCustomApplication
    // - userWorkspace linking Clément (creator) as admin
    // - standard application setup (rôles par défaut, feature flags, etc.)
    const { workspace } = await this.signInUpService.signUpOnNewWorkspace(
      { type: 'existingUser', existingUser: creator },
      { displayName, subdomain },
    );

    appliedSteps.push(`workspace-record:${workspace.id}`);
    appliedSteps.push(`membership:${creator.email}`);
    appliedSteps.push('standard-application:created');

    // Sprint S4 stage 3: apply the Buzzle template. On failure we do NOT
    // roll back the workspace Clément can retry the applier or edit the
    // schema by hand from the Twenty settings UI. Log the outcome instead.
    try {
      const templateReport = await this.templateApplierService.applyTemplate(
        templateId,
        workspace.id,
      );

      for (const step of templateReport.steps) {
        appliedSteps.push(
          `template:${step.step}:${step.status}${
            step.detail ? `:${step.detail.slice(0, 80)}` : ''
          }`,
        );
      }

      if (!templateReport.ok) {
        this.logger.warn(
          `Template ${templateId} applied with failures on workspace ${workspace.id}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.error(
        `Template application crashed for workspace ${workspace.id}: ${message}`,
      );
      appliedSteps.push(`template:${templateId}:crashed:${message.slice(0, 120)}`);
    }

    return {
      id: workspace.id,
      displayName: workspace.displayName ?? displayName,
      subdomain: workspace.subdomain,
      url: `https://${workspace.subdomain}.crm.agence-buzzle.com`,
      templateId,
      appliedSteps,
    };
  }
}
