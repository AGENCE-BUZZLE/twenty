import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { getBuzzleTemplate } from 'src/engine/core-modules/buzzle-admin/templates';
import { type BuzzleWorkspaceTemplate } from 'src/engine/core-modules/buzzle-admin/types/buzzle-workspace-template.type';

// Applies a BuzzleWorkspaceTemplate against a workspace by calling
// Twenty's metadata services (ObjectMetadataService, FieldMetadataService,
// WebhookService, ViewService, RoleService).
//
// Sprint S4 part 2 will inject those services and implement the actual
// applyTemplate() body. This scaffold defines the surface + logging.

export type TemplateApplicationStep = {
  step: string;
  status: 'ok' | 'skipped' | 'failed';
  detail?: string;
};

export type TemplateApplicationReport = {
  templateId: string;
  workspaceId: string;
  steps: TemplateApplicationStep[];
  ok: boolean;
};

@Injectable()
export class BuzzleTemplateApplierService {
  private readonly logger = new Logger(BuzzleTemplateApplierService.name);

  // TODO S4 part 2: inject these Twenty services
  // - objectMetadataService: ObjectMetadataService
  // - fieldMetadataService: FieldMetadataService
  // - webhookService: WebhookService
  // - viewService: ViewService
  // - roleService: RoleService
  //
  // NOTE: WorkspaceService circular dep — inject with @Inject(forwardRef(...))
  constructor() {}

  async applyTemplate(
    templateId: string,
    workspaceId: string,
  ): Promise<TemplateApplicationReport> {
    const template = getBuzzleTemplate(templateId);

    if (!template) {
      throw new NotFoundException(
        `Buzzle template not found: ${templateId}. Available: ` +
          Object.keys(await import('src/engine/core-modules/buzzle-admin/templates').then((m) => m.BUZZLE_TEMPLATES)).join(
            ', ',
          ),
      );
    }

    this.logger.log(
      `Applying template ${templateId} v${template.version} to workspace ${workspaceId}`,
    );

    const steps: TemplateApplicationStep[] = [];

    // TODO S4 part 2 — replace with real service calls
    for (const objectDef of template.objects) {
      steps.push(await this.createObjectStub(workspaceId, objectDef));
      for (const fieldDef of objectDef.fields) {
        steps.push({
          step: `field:${objectDef.nameSingular}.${fieldDef.name}`,
          status: 'skipped',
          detail: 'not implemented — S4 part 2',
        });
      }
    }

    for (const viewDef of template.views) {
      steps.push({
        step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
        status: 'skipped',
        detail: 'not implemented — S4 part 2',
      });
    }

    for (const webhookDef of template.webhooks) {
      steps.push({
        step: `webhook:${webhookDef.name}`,
        status: 'skipped',
        detail: `URL would be ${this.resolveWebhookUrl(webhookDef.urlTemplate, workspaceId)}`,
      });
    }

    for (const roleDef of template.roles) {
      steps.push({
        step: `role:${roleDef.name}`,
        status: 'skipped',
        detail: 'not implemented — S4 part 2',
      });
    }

    steps.push({
      step: `hide-objects:${template.hiddenTwentyObjects.length}`,
      status: 'skipped',
      detail: 'requires UI variant system — S5',
    });

    const report: TemplateApplicationReport = {
      templateId,
      workspaceId,
      steps,
      ok: steps.every((s) => s.status !== 'failed'),
    };

    this.logger.log(
      `Template ${templateId} applied to ${workspaceId}: ${steps.length} steps, ok=${report.ok}`,
    );

    return report;
  }

  private async createObjectStub(
    workspaceId: string,
    objectDef: BuzzleWorkspaceTemplate['objects'][number],
  ): Promise<TemplateApplicationStep> {
    // TODO: return await this.objectMetadataService.createOneObject({
    //   input: {
    //     nameSingular: objectDef.nameSingular,
    //     namePlural: objectDef.namePlural,
    //     labelSingular: objectDef.labelSingular,
    //     labelPlural: objectDef.labelPlural,
    //     icon: objectDef.icon,
    //     description: objectDef.description,
    //   },
    //   workspaceId,
    // });
    return {
      step: `object:${objectDef.nameSingular}`,
      status: 'skipped',
      detail: 'not implemented — S4 part 2',
    };
  }

  private resolveWebhookUrl(urlTemplate: string, workspaceId: string): string {
    return urlTemplate.replaceAll('{{workspaceId}}', workspaceId);
  }
}
