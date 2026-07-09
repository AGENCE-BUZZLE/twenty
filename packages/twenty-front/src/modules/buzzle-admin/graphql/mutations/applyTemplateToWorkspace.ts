import { gql } from '@apollo/client';

export const BUZZLE_APPLY_TEMPLATE_TO_WORKSPACE = gql`
  mutation BuzzleApplyTemplateToWorkspace(
    $workspaceId: String!
    $templateId: String!
  ) {
    buzzleApplyTemplateToWorkspace(
      workspaceId: $workspaceId
      templateId: $templateId
    )
  }
`;
