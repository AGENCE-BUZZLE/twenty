import { useMutation } from '@apollo/client/react';
import { useState } from 'react';

import { BUZZLE_IMPERSONATE_WORKSPACE } from '@/buzzle-admin/graphql/mutations/impersonateWorkspace';
import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';

type ImpersonateResult = {
  buzzleImpersonateWorkspace: {
    loginToken: { token: string; expiresAt: string };
    workspace: {
      id: string;
      workspaceUrls: { subdomainUrl?: string | null; customUrl?: string | null };
    };
  };
};

// Opens a client workspace as super admin without re-login.
// Calls backend impersonate mutation, receives a login token,
// and redirects to the target subdomain with the token as a
// query parameter (Twenty's /verify route consumes it).
export const useBuzzleImpersonateWorkspace = () => {
  const apolloAdminClient = useApolloAdminClient();
  const [impersonate, { loading, error }] = useMutation<
    ImpersonateResult,
    { workspaceId: string }
  >(BUZZLE_IMPERSONATE_WORKSPACE, { client: apolloAdminClient });
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(
    null,
  );

  const openWorkspace = async (workspaceId: string) => {
    setPendingWorkspaceId(workspaceId);
    try {
      const result = await impersonate({ variables: { workspaceId } });
      const payload = result.data?.buzzleImpersonateWorkspace;

      if (!payload) {
        throw new Error('No impersonation payload returned by backend');
      }

      const { token } = payload.loginToken;
      const targetUrl =
        payload.workspace.workspaceUrls.customUrl ??
        payload.workspace.workspaceUrls.subdomainUrl;

      if (!targetUrl) {
        throw new Error('No workspace URL returned by backend');
      }

      // Bypass our custom useRedirectToWorkspaceDomain patch impersonation
      // MUST cross domains (that's the whole point). Use plain window
      // navigation with the login token, hitting Twenty's /verify route
      // which consumes the token from the URL, sets the cookie, then
      // redirects to the workspace home.
      const url = new URL(targetUrl);

      url.pathname = '/verify';
      url.searchParams.set('loginToken', token);

      window.location.assign(url.toString());
    } finally {
      setPendingWorkspaceId(null);
    }
  };

  return {
    openWorkspace,
    loading,
    error,
    pendingWorkspaceId,
  };
};
