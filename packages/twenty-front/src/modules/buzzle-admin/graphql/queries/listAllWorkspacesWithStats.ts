import { gql } from '@apollo/client';

export const BUZZLE_LIST_ALL_WORKSPACES_WITH_STATS = gql`
  query BuzzleListAllWorkspacesWithStats {
    buzzleListAllWorkspacesWithStats {
      id
      displayName
      subdomain
      activationStatus
      totalUsers
      createdAt
      lastActivityAt
    }
  }
`;
