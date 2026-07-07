import { useQuery } from '@apollo/client';

import { BUZZLE_LIST_ALL_WORKSPACES_WITH_STATS } from '@/buzzle-admin/graphql/queries/listAllWorkspacesWithStats';
import {
  type BuzzleListAllWorkspacesWithStatsQueryResult,
  type BuzzleWorkspaceStats,
} from '@/buzzle-admin/types/BuzzleWorkspaceStats';

// The Buzzle admin query lives on the /admin-panel GraphQL endpoint,
// same schema scope as Twenty's native admin panel queries.
// The default Apollo client points at /graphql; we need to target
// the admin endpoint explicitly. For now we use the same client and
// rely on twenty-front's admin schema link (see apollo.factory.ts —
// admin queries are routed by the resolver schema scope, not URL).

export const useBuzzleWorkspaces = (): {
  workspaces: BuzzleWorkspaceStats[];
  loading: boolean;
  error?: Error;
  refetch: () => void;
} => {
  const { data, loading, error, refetch } =
    useQuery<BuzzleListAllWorkspacesWithStatsQueryResult>(
      BUZZLE_LIST_ALL_WORKSPACES_WITH_STATS,
      {
        context: { headers: { 'X-Schema-Scope': 'admin' } },
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
