import { useMutation } from '@apollo/client/react';
import { useState } from 'react';

import { BUZZLE_APPLY_TEMPLATE_TO_WORKSPACE } from '@/buzzle-admin/graphql/mutations/applyTemplateToWorkspace';
import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';

type ApplyTemplateResult = {
  buzzleApplyTemplateToWorkspace: string;
};

// Retro-applies a Buzzle template to an existing workspace.
// Returns the JSON report as a raw string; the caller decides what to
// display (we show a compact toast with ok/skipped/failed counts).
export const useBuzzleApplyTemplate = () => {
  const apolloAdminClient = useApolloAdminClient();
  const [applyTemplate, { loading, error }] = useMutation<
    ApplyTemplateResult,
    { workspaceId: string; templateId: string }
  >(BUZZLE_APPLY_TEMPLATE_TO_WORKSPACE, { client: apolloAdminClient });
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(
    null,
  );

  const apply = async (workspaceId: string, templateId: string) => {
    setPendingWorkspaceId(workspaceId);
    try {
      const result = await applyTemplate({
        variables: { workspaceId, templateId },
      });

      const raw = result.data?.buzzleApplyTemplateToWorkspace;

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as {
        ok: boolean;
        templateId: string;
        workspaceId: string;
        steps: Array<{
          step: string;
          status: 'ok' | 'skipped' | 'failed';
          detail?: string;
        }>;
      };
    } finally {
      setPendingWorkspaceId(null);
    }
  };

  return { apply, loading, error, pendingWorkspaceId };
};
