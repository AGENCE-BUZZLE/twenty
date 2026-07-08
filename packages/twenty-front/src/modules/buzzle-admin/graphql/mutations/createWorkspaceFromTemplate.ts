import { gql } from '@apollo/client';

export const BUZZLE_CREATE_WORKSPACE_FROM_TEMPLATE = gql`
  mutation BuzzleCreateWorkspaceFromTemplate(
    $input: BuzzleCreateWorkspaceFromTemplateInput!
  ) {
    buzzleCreateWorkspaceFromTemplate(input: $input) {
      id
      displayName
      subdomain
      url
      templateId
      appliedSteps
    }
  }
`;
