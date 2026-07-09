import { randomUUID } from 'node:crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { FieldMetadataType } from 'twenty-shared/types';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { WebhookService } from 'src/engine/metadata-modules/webhook/webhook.service';
import { getBuzzleTemplate } from 'src/engine/core-modules/buzzle-admin/templates';
import {
  type BuzzleFieldDefinition,
  type BuzzleFieldType,
  type BuzzleObjectDefinition,
  type BuzzleWebhookDefinition,
  type BuzzleWorkspaceTemplate,
} from 'src/engine/core-modules/buzzle-admin/types/buzzle-workspace-template.type';

// Sprint S4 stage 3 — real template applier.
//
// Given a template id and a freshly-created workspace, this service walks
// the template and calls Twenty's metadata services to provision:
//   1. Custom objects (via ObjectMetadataService — auto-creates default view + label field)
//   2. Custom fields on those objects (via FieldMetadataService.createManyFields)
//   3. Webhooks (via WebhookService.create) pointing at n8n for OCT push
//
// Views (kanban, table with hidden fields), roles and hidden-Twenty-objects
// are stage-4 material — they need view-level metadata edits and role
// permission wiring that the current MVP cockpit doesn't require.
//
// The Buzzle "fullName" template field is intentionally *not* created here:
// Twenty's ObjectMetadataService already creates a default TEXT `name` field
// as the label identifier, which serves the same purpose. Duplicating it
// would produce two identifier fields.

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

const BUZZLE_TO_TWENTY_FIELD_TYPE: Record<BuzzleFieldType, FieldMetadataType> =
  {
    FULL_NAME: FieldMetadataType.FULL_NAME,
    TEXT: FieldMetadataType.TEXT,
    EMAIL: FieldMetadataType.EMAILS,
    PHONE: FieldMetadataType.PHONES,
    DATE_TIME: FieldMetadataType.DATE_TIME,
    CURRENCY: FieldMetadataType.CURRENCY,
    RICH_TEXT: FieldMetadataType.RICH_TEXT,
    SELECT: FieldMetadataType.SELECT,
  };

@Injectable()
export class BuzzleTemplateApplierService {
  private readonly logger = new Logger(BuzzleTemplateApplierService.name);

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly webhookService: WebhookService,
  ) {}

  async applyTemplate(
    templateId: string,
    workspaceId: string,
  ): Promise<TemplateApplicationReport> {
    const template = getBuzzleTemplate(templateId);

    if (!template) {
      throw new NotFoundException(
        `Buzzle template not found: ${templateId}`,
      );
    }

    this.logger.log(
      `Applying template ${templateId} v${template.version} to workspace ${workspaceId}`,
    );

    const steps: TemplateApplicationStep[] = [];

    for (const objectDef of template.objects) {
      const objectStep = await this.tryCreateObject(workspaceId, objectDef);
      steps.push(objectStep);

      if (objectStep.status !== 'ok' || !objectStep.detail) {
        // objectId is stored in `detail` on success. If create failed
        // we skip its fields entirely.
        for (const fieldDef of objectDef.fields) {
          steps.push({
            step: `field:${objectDef.nameSingular}.${fieldDef.name}`,
            status: 'skipped',
            detail: 'skipped because object creation failed',
          });
        }
        continue;
      }

      const objectId = objectStep.detail;
      const fieldsToCreate = objectDef.fields.filter(
        (f) => f.type !== 'FULL_NAME',
      );

      if (objectDef.fields.some((f) => f.type === 'FULL_NAME')) {
        steps.push({
          step: `field:${objectDef.nameSingular}.fullName`,
          status: 'skipped',
          detail: 'Twenty auto-creates default TEXT name field',
        });
      }

      steps.push(
        ...(await this.createFields(workspaceId, objectId, objectDef, fieldsToCreate)),
      );
    }

    for (const webhookDef of template.webhooks) {
      steps.push(await this.tryCreateWebhook(workspaceId, webhookDef));
    }

    for (const viewDef of template.views) {
      steps.push({
        step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
        status: 'skipped',
        detail: 'Twenty auto-creates default table view — kanban view is S4-stage-4',
      });
    }

    for (const roleDef of template.roles) {
      steps.push({
        step: `role:${roleDef.name}`,
        status: 'skipped',
        detail: 'role provisioning is S4-stage-4',
      });
    }

    steps.push({
      step: `hide-objects:${template.hiddenTwentyObjects.length}`,
      status: 'skipped',
      detail: 'handled UI-side by filterReadableActiveObjectMetadataItems',
    });

    const report: TemplateApplicationReport = {
      templateId,
      workspaceId,
      steps,
      ok: steps.every((s) => s.status !== 'failed'),
    };

    const okCount = steps.filter((s) => s.status === 'ok').length;
    const skippedCount = steps.filter((s) => s.status === 'skipped').length;
    const failedCount = steps.filter((s) => s.status === 'failed').length;

    this.logger.log(
      `Template ${templateId} applied to ${workspaceId}: ${okCount} ok, ${skippedCount} skipped, ${failedCount} failed`,
    );

    return report;
  }

  private async tryCreateObject(
    workspaceId: string,
    objectDef: BuzzleObjectDefinition,
  ): Promise<TemplateApplicationStep> {
    try {
      const flatObject = await this.objectMetadataService.createOneObject({
        createObjectInput: {
          nameSingular: objectDef.nameSingular,
          namePlural: objectDef.namePlural,
          labelSingular: objectDef.labelSingular,
          labelPlural: objectDef.labelPlural,
          icon: objectDef.icon,
          description: objectDef.description,
          isLabelSyncedWithName: false,
        },
        workspaceId,
      });

      return {
        step: `object:${objectDef.nameSingular}`,
        status: 'ok',
        detail: flatObject.id,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown error';

      this.logger.error(
        `Failed to create object ${objectDef.nameSingular} in ${workspaceId}: ${message}`,
      );

      return {
        step: `object:${objectDef.nameSingular}`,
        status: 'failed',
        detail: message,
      };
    }
  }

  private async createFields(
    workspaceId: string,
    objectMetadataId: string,
    objectDef: BuzzleObjectDefinition,
    fields: BuzzleFieldDefinition[],
  ): Promise<TemplateApplicationStep[]> {
    const steps: TemplateApplicationStep[] = [];

    // We create fields one-at-a-time (rather than createManyFields) so a
    // single bad field doesn't roll back the whole set — the pipeline
    // Statut > Nouveau lead can still start receiving records even if
    // one auxiliary field fails.
    for (const fieldDef of fields) {
      try {
        const input = this.buildCreateFieldInput(objectMetadataId, fieldDef);

        await this.fieldMetadataService.createOneField({
          createFieldInput: input,
          workspaceId,
        });

        steps.push({
          step: `field:${objectDef.nameSingular}.${fieldDef.name}`,
          status: 'ok',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';

        this.logger.warn(
          `Failed to create field ${objectDef.nameSingular}.${fieldDef.name} in ${workspaceId}: ${message}`,
        );

        steps.push({
          step: `field:${objectDef.nameSingular}.${fieldDef.name}`,
          status: 'failed',
          detail: message,
        });
      }
    }

    return steps;
  }

  private buildCreateFieldInput(
    objectMetadataId: string,
    fieldDef: BuzzleFieldDefinition,
  ) {
    const twentyType = BUZZLE_TO_TWENTY_FIELD_TYPE[fieldDef.type];

    const base = {
      objectMetadataId,
      name: fieldDef.name,
      label: fieldDef.label,
      type: twentyType,
      isNullable: !fieldDef.required,
      icon: undefined,
      description: undefined,
    };

    if (twentyType === FieldMetadataType.SELECT && fieldDef.options) {
      return {
        ...base,
        options: fieldDef.options.map((opt) => ({
          id: randomUUID(),
          value: opt.value,
          label: opt.label,
          color: opt.color,
          position: opt.position,
        })),
      };
    }

    return base;
  }

  private async tryCreateWebhook(
    workspaceId: string,
    webhookDef: BuzzleWebhookDefinition,
  ): Promise<TemplateApplicationStep> {
    const targetUrl = webhookDef.urlTemplate.replaceAll(
      '{{workspaceId}}',
      workspaceId,
    );

    try {
      await this.webhookService.create(
        {
          targetUrl,
          operations: [
            `${webhookDef.objectNameSingular}.${webhookDef.operation}`,
          ],
          description: webhookDef.name,
        },
        workspaceId,
      );

      return {
        step: `webhook:${webhookDef.name}`,
        status: 'ok',
        detail: targetUrl,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(
        `Failed to create webhook ${webhookDef.name} in ${workspaceId}: ${message}`,
      );

      return {
        step: `webhook:${webhookDef.name}`,
        status: 'failed',
        detail: message,
      };
    }
  }

  // Preserved for backwards compat with the S4-stage-2 stub — used by
  // callers that log a pre-applier "what would be applied" report.
  resolveWebhookUrl(urlTemplate: string, workspaceId: string): string {
    return urlTemplate.replaceAll('{{workspaceId}}', workspaceId);
  }

  // Placeholder retained so external callers importing the type
  // definition compile; unused inside the applier itself.
  private _templateShapeAssertion(t: BuzzleWorkspaceTemplate) {
    return t;
  }
}
