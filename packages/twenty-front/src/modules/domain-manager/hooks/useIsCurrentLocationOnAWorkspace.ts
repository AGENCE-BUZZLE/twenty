import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { getIsPathBasedWorkspace } from '@/domain-manager/utils/getWorkspaceSlugFromPath';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export const useIsCurrentLocationOnAWorkspace = () => {
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();

  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const domainConfiguration = useAtomStateValue(domainConfigurationState);

  if (
    isMultiWorkspaceEnabled &&
    (!isDefined(domainConfiguration.frontDomain) ||
      !isDefined(domainConfiguration.defaultSubdomain))
  ) {
    throw new Error('frontDomain and defaultSubdomain are required');
  }

  // Buzzle path-based : un slug en path = on est sur un workspace.
  const isPathBasedWorkspace = getIsPathBasedWorkspace({
    frontDomain: domainConfiguration.frontDomain,
    defaultSubdomain: domainConfiguration.defaultSubdomain,
  });

  const isOnAWorkspace = !isMultiWorkspaceEnabled
    ? true
    : window.location.hostname !== defaultDomain || isPathBasedWorkspace;

  return {
    isOnAWorkspace,
  };
};
