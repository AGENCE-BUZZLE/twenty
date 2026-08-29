import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';
import { getIsPathBasedWorkspace } from '@/domain-manager/utils/getWorkspaceSlugFromPath';

export const useIsCurrentLocationOnDefaultDomain = () => {
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();
  const domainConfiguration = useAtomStateValue(domainConfigurationState);

  // Buzzle path-based : sur le domaine racine mais avec un slug en path, on est
  // sur un workspace (path-based) → PAS le domaine par défaut, pour que
  // DomainShell charge WorkspaceApp.
  const isPathBasedWorkspace = getIsPathBasedWorkspace({
    frontDomain: domainConfiguration.frontDomain,
    defaultSubdomain: domainConfiguration.defaultSubdomain,
  });

  const isDefaultDomain = isMultiWorkspaceEnabled
    ? window.location.hostname === defaultDomain && !isPathBasedWorkspace
    : true;

  return {
    isDefaultDomain,
  };
};
