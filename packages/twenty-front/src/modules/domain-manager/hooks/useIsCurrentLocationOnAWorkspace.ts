import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import {
  getIsOnRootDomain,
  getIsPathBasedWorkspace,
} from '@/domain-manager/utils/getWorkspaceSlugFromPath';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export const useIsCurrentLocationOnAWorkspace = () => {
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

  const domainConfig = {
    frontDomain: domainConfiguration.frontDomain,
    defaultSubdomain: domainConfiguration.defaultSubdomain,
  };

  // Buzzle path-based : on est sur un workspace si on n'est PAS sur le domaine
  // racine (bare frontDomain OU app.{frontDomain}), OU si un slug est en path.
  const isOnAWorkspace = !isMultiWorkspaceEnabled
    ? true
    : !getIsOnRootDomain(domainConfig) || getIsPathBasedWorkspace(domainConfig);

  return {
    isOnAWorkspace,
  };
};
