import { gql } from '@apollo/client';

export const BUZZLE_IMPERSONATE_WORKSPACE = gql`
  mutation BuzzleImpersonateWorkspace($workspaceId: String!) {
    buzzleImpersonateWorkspace(workspaceId: $workspaceId) {
      loginToken {
        token
        expiresAt
      }
      workspace {
        id
        workspaceUrls {
          subdomainUrl
          customUrl
        }
      }
    }
  }
`;
