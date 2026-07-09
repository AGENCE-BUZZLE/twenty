import { useQuery } from '@apollo/client/react';

import { BUZZLE_LIST_ALL_WORKSPACES_WITH_STATS } from '@/buzzle-admin/graphql/queries/listAllWorkspacesWithStats';
import {
  type BuzzleListAllWorkspacesWithStatsQueryResult,
  type BuzzleWorkspaceStats,
} from '@/buzzle-admin/types/BuzzleWorkspaceStats';
import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';

// Query lives on the /admin-panel GraphQL endpoint (via @AdminResolver).
// Must use apolloAdminClient which points at /admin-panel, not the
// default apolloClient (which targets /graphql and doesn't know about
// admin queries).
export const useBuzzleWorkspaces = (): {
  workspaces: BuzzleWorkspaceStats[];
  loading: boolean;
  error?: Error;
  refetch: () => void;
} => {
  const apolloAdminClient = useApolloAdminClient();

  const { data, loading, error, refetch } =
    useQuery<BuzzleListAllWorkspacesWithStatsQueryResult>(
      BUZZLE_LIST_ALL_WORKSPACES_WITH_STATS,
      {
        client: apolloAdminClient,
        fetchPolicy: 'cache-and-network',
      },
    );

  return {
    workspaces: data?.buzzleListAllWorkspacesWithStats ?? [],
    loading,
    error,
    refetch,
  };
};
