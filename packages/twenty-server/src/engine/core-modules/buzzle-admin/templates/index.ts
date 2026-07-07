import { leadsGoogleAdsTemplate } from 'src/engine/core-modules/buzzle-admin/templates/leads-google-ads.template';
import { type BuzzleWorkspaceTemplate } from 'src/engine/core-modules/buzzle-admin/types/buzzle-workspace-template.type';

// Registry of all available Buzzle workspace templates.
// New templates go in `templates/*.template.ts` and are registered here.

export const BUZZLE_TEMPLATES: Record<string, BuzzleWorkspaceTemplate> = {
  'leads-google-ads': leadsGoogleAdsTemplate,
};

export const getBuzzleTemplate = (
  templateId: string,
): BuzzleWorkspaceTemplate | undefined => {
  return BUZZLE_TEMPLATES[templateId];
};

export const listBuzzleTemplateIds = (): string[] => {
  return Object.keys(BUZZLE_TEMPLATES);
};
