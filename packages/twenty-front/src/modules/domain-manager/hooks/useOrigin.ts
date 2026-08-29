import { useMemo } from 'react';

import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import {
  getIsPathBasedWorkspace,
  getWorkspaceSlugFromPath,
} from '@/domain-manager/utils/getWorkspaceSlugFromPath';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useOrigin = () => {
  const domainConfiguration = useAtomStateValue(domainConfigurationState);

  const origin = useMemo(() => {
    // Buzzle path-based : sur crm.agence-buzzle.com/{slug}, on envoie au backend
    // l'origine sous-domaine canonique (https://{slug}.{frontDomain}) pour que la
    // résolution du workspace ET le contrôle sécu origin↔workspace côté serveur
    // restent inchangés.
    const isPathBased = getIsPathBasedWorkspace({
      frontDomain: domainConfiguration.frontDomain,
      defaultSubdomain: domainConfiguration.defaultSubdomain,
    });

    if (isPathBased) {
      const slug = getWorkspaceSlugFromPath();
      return `${window.location.protocol}//${slug}.${domainConfiguration.frontDomain}`;
    }

    return window.location.origin;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainConfiguration.frontDomain, domainConfiguration.defaultSubdomain]);

  return { origin };
};
