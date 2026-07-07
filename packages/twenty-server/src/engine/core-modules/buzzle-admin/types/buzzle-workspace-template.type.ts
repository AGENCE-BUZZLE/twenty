// Shape of a Buzzle workspace template.
// Templates are code-defined recipes that provision a full workspace
// (custom objects, fields, statuses, views, webhooks, roles) in one call.
//
// Each template lives in `templates/*.template.ts` and is registered
// in the TemplateRegistry. The provisioning service picks a template
// by id and applies it against a newly-created workspace.

export type BuzzleFieldType =
  | 'FULL_NAME'
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE_TIME'
  | 'CURRENCY'
  | 'RICH_TEXT'
  | 'SELECT';

export type BuzzleFieldPermission = 'read' | 'update' | 'hidden';

export type BuzzleFieldDefinition = {
  name: string;
  label: string;
  type: BuzzleFieldType;
  required?: boolean;
  isHidden?: boolean;
  clientPermission?: BuzzleFieldPermission;
  options?: BuzzleSelectOption[];
};

export type BuzzleSelectOption = {
  label: string;
  value: string;
  color: 'blue' | 'orange' | 'purple' | 'green' | 'gray' | 'red' | 'yellow';
  position: number;
};

export type BuzzleObjectDefinition = {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  icon: string;
  description: string;
  fields: BuzzleFieldDefinition[];
};

export type BuzzleViewDefinition = {
  objectNameSingular: string;
  name: string;
  type: 'table' | 'kanban';
  groupByFieldName?: string;
  visibleFields: string[];
};

export type BuzzleWebhookDefinition = {
  name: string;
  urlTemplate: string;
  operation: 'create' | 'update' | 'delete';
  objectNameSingular: string;
  onlyIfFieldChanged?: string;
};

export type BuzzleRoleDefinition = {
  name: string;
  label: string;
  description: string;
  canCreateRecords: boolean;
  canUpdateAllRecords: boolean;
  canDeleteAllRecords: boolean;
  canReadAllRecords: boolean;
  canAccessSettings: boolean;
  fieldRestrictions?: Record<
    string,
    { updatable: string[]; visible: string[] }
  >;
};

export type BuzzleWorkspaceTemplate = {
  id: string;
  name: string;
  description: string;
  version: string;
  objects: BuzzleObjectDefinition[];
  views: BuzzleViewDefinition[];
  webhooks: BuzzleWebhookDefinition[];
  hiddenTwentyObjects: string[];
  roles: BuzzleRoleDefinition[];
};
