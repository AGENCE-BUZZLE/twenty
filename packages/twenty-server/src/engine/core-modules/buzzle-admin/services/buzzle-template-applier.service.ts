import { randomUUID } from 'node:crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { FieldMetadataType, ViewType } from 'twenty-shared/types';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { ViewEntity } from 'src/engine/metadata-modules/view/entities/view.entity';
import { ViewService } from 'src/engine/metadata-modules/view/services/view.service';
import { WebhookService } from 'src/engine/metadata-modules/webhook/webhook.service';
import { getBuzzleTemplate } from 'src/engine/core-modules/buzzle-admin/templates';
import {
  type BuzzleFieldDefinition,
  type BuzzleFieldType,
  type BuzzleObjectDefinition,
  type BuzzleWebhookDefinition,
  type BuzzleWorkspaceTemplate,
} from 'src/engine/core-modules/buzzle-admin/types/buzzle-workspace-template.type';

// Sprint S4 stage 3 real template applier.
//
// Given a template id and a freshly-created workspace, this service walks
// the template and calls Twenty's metadata services to provision:
//   1. Custom objects (via ObjectMetadataService auto-creates default view + label field)
//   2. Custom fields on those objects (via FieldMetadataService.createManyFields)
//   3. Webhooks (via WebhookService.create) pointing at n8n for OCT push
//
// Views (kanban, table with hidden fields), roles and hidden-Twenty-objects
// are stage-4 material they need view-level metadata edits and role
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
    private readonly viewService: ViewService,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    @InjectRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: Repository<FieldMetadataEntity>,
    @InjectRepository(ViewEntity)
    private readonly viewRepository: Repository<ViewEntity>,
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
      steps.push(await this.tryCreateView(workspaceId, viewDef));
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
    // Idempotent: if the object already exists in this workspace, reuse
    // its id instead of failing on the create. Applies to retries by
    // Clement clicking "Template" again after a partial failure.
    const existing = await this.objectMetadataRepository.findOne({
      where: {
        workspaceId,
        nameSingular: objectDef.nameSingular,
      },
    });

    if (existing) {
      return {
        step: `object:${objectDef.nameSingular}`,
        status: 'skipped',
        detail: existing.id,
      };
    }

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

    // Idempotent per-field: skip fields that already exist so a partial
    // failure can be retried without cleaning up state manually.
    const existingFields = await this.fieldMetadataRepository.find({
      where: { objectMetadataId, workspaceId },
      select: ['name'],
    });
    const existingFieldNames = new Set(existingFields.map((f) => f.name));

    // We create fields one-at-a-time (rather than createManyFields) so a
    // single bad field doesn't roll back the whole set. The pipeline
    // Statut > Nouveau lead can still start receiving records even if
    // one auxiliary field fails.
    for (const fieldDef of fields) {
      if (existingFieldNames.has(fieldDef.name)) {
        steps.push({
          step: `field:${objectDef.nameSingular}.${fieldDef.name}`,
          status: 'skipped',
          detail: 'field already exists',
        });
        continue;
      }
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

        const detailFromReport =
          error &&
          typeof error === 'object' &&
          'failedWorkspaceMigrationBuildResult' in error
            ? JSON.stringify(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any).failedWorkspaceMigrationBuildResult?.report,
              ).slice(0, 500)
            : '';

        this.logger.warn(
          `Failed to create field ${objectDef.nameSingular}.${fieldDef.name} in ${workspaceId}: ${message} ${detailFromReport}`,
        );

        steps.push({
          step: `field:${objectDef.nameSingular}.${fieldDef.name}`,
          status: 'failed',
          detail: detailFromReport ? `${message}. ${detailFromReport}` : message,
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
      const options = fieldDef.options.map((opt) => ({
        id: randomUUID(),
        value: opt.value,
        label: opt.label,
        color: opt.color,
        position: opt.position,
      }));
      // Twenty stores SELECT defaults as a SQL-quoted string, e.g. "'new'".
      // If the field is required we default to the first option; if
      // nullable we don't set a default so a record can be created without
      // choosing a status.
      const defaultValue =
        fieldDef.required && options.length > 0
          ? `'${options[0].value}'`
          : undefined;
      return {
        ...base,
        options,
        defaultValue,
      };
    }

    return base;
  }

  private async tryCreateView(
    workspaceId: string,
    viewDef: BuzzleWorkspaceTemplate['views'][number],
  ): Promise<TemplateApplicationStep> {
    // Find the target object metadata id first.
    const targetObject = await this.objectMetadataRepository.findOne({
      where: {
        workspaceId,
        nameSingular: viewDef.objectNameSingular,
        isActive: true,
      },
    });

    if (!targetObject) {
      return {
        step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
        status: 'skipped',
        detail: 'target object not found',
      };
    }

    // Idempotent: skip if a view with this exact name + type already exists
    const viewType = viewDef.type === 'kanban' ? ViewType.KANBAN : ViewType.TABLE;
    const existingView = await this.viewRepository.findOne({
      where: {
        workspaceId,
        objectMetadataId: targetObject.id,
        name: viewDef.name,
        type: viewType,
        deletedAt: IsNull(),
      },
    });
    if (existingView) {
      return {
        step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
        status: 'skipped',
        detail: 'view already exists',
      };
    }

    // Kanban needs mainGroupByFieldMetadataId. Resolve the group-by
    // field id from the object's fields (skip creation if we cannot
    // find it; better a table view than a broken kanban).
    let mainGroupByFieldMetadataId: string | undefined;
    if (viewType === ViewType.KANBAN && viewDef.groupByFieldName) {
      const groupByField = await this.fieldMetadataRepository.findOne({
        where: {
          workspaceId,
          objectMetadataId: targetObject.id,
          name: viewDef.groupByFieldName,
        },
      });
      if (!groupByField) {
        return {
          step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
          status: 'skipped',
          detail: `groupBy field ${viewDef.groupByFieldName} not found`,
        };
      }
      mainGroupByFieldMetadataId = groupByField.id;
    }

    try {
      await this.viewService.createOne({
        createViewInput: {
          name: viewDef.name,
          objectMetadataId: targetObject.id,
          type: viewType,
          icon: viewType === ViewType.KANBAN ? 'IconLayoutKanban' : 'IconTable',
          position: viewType === ViewType.KANBAN ? 1 : 0,
          mainGroupByFieldMetadataId,
        },
        workspaceId,
      });

      return {
        step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
        status: 'ok',
        detail: `type=${viewType}`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(
        `Failed to create view ${viewDef.name}: ${message}`,
      );
      return {
        step: `view:${viewDef.objectNameSingular}:${viewDef.name}`,
        status: 'failed',
        detail: message,
      };
    }
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

  // Preserved for backwards compat with the S4-stage-2 stub used by
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
