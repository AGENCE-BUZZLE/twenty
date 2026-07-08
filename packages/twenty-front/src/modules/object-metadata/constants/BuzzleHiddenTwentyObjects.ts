// Standard Twenty objects that Buzzle hides from client workspaces.
// Super admins (canAccessFullAdminPanel = true) still see them.
//
// These are the objects auto-created by Twenty's default workspace seed
// that don't fit the Buzzle CRM narrative (lead qualification for ads).

export const BUZZLE_HIDDEN_TWENTY_OBJECTS_FOR_CLIENTS: readonly string[] = [
  'company',
  'person',
  'opportunity',
  'task',
  'note',
  'pet',
  'rocket',
  'survey',
  'petCareAgreement',
  'employmentHistory',
  'starHistory',
  'dashboard',
  'workflow',
  'agent',
];
