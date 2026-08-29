import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  getIsOnRootDomain,
  getIsPathBasedWorkspace,
} from '@/domain-manager/utils/getWorkspaceSlugFromPath';

export const useIsCurrentLocationOnDefaultDomain = () => {
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const domainConfiguration = useAtomStateValue(domainConfigurationState);

  const domainConfig = {
    frontDomain: domainConfiguration.frontDomain,
    defaultSubdomain: domainConfiguration.defaultSubdomain,
  };

  // Buzzle path-based : le domaine racine = bare frontDomain (crm.agence-buzzle.com)
  // OU app.{frontDomain}. Avec un slug en path, on est sur un workspace path-based
  // → PAS le domaine par défaut (DomainShell charge WorkspaceApp).
  const isDefaultDomain = isMultiWorkspaceEnabled
    ? getIsOnRootDomain(domainConfig) && !getIsPathBasedWorkspace(domainConfig)
    : true;

  return {
    isDefaultDomain,
  };
};
