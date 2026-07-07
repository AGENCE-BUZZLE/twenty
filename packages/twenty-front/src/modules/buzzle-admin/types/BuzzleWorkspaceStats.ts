export type BuzzleWorkspaceStats = {
  id: string;
  displayName: string;
  subdomain: string;
  activationStatus: string;
  totalUsers: number;
  createdAt: string;
  lastActivityAt?: string | null;
};

export type BuzzleListAllWorkspacesWithStatsQueryResult = {
  buzzleListAllWorkspacesWithStats: BuzzleWorkspaceStats[];
};
