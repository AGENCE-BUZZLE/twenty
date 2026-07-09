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
// view, webhook) — that piece is still TODO (BuzzleTemplateApplierService).
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

    // TODO Sprint S4 stage 3:
    // - templateApplierService.applyTemplate(workspace.id, templateId)
    //   creates Prospect object, fields, statuses, view via
    //   ObjectMetadataService + FieldMetadataService
    // - webhookService.create() with n8n OCT URL
    appliedSteps.push(`template:${templateId}:objects:${template.objects.length}:pending-stage-3`);
    appliedSteps.push(`template:${templateId}:webhooks:${template.webhooks.length}:pending-stage-3`);
    appliedSteps.push(`template:${templateId}:roles:${template.roles.length}:pending-stage-3`);

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
