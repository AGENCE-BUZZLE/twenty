import { isValidAuthTokenPair } from '@/apollo/utils/isValidAuthTokenPair';
import { getWorkspaceSlugFromPath } from '@/domain-manager/utils/getWorkspaceSlugFromPath';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type AuthTokenPair } from '~/generated-metadata/graphql';

// Buzzle path-based : en mode path (crm.agence-buzzle.com/{slug}), plusieurs
// workspaces partagent la même origine localStorage. On namespace la clé par
// slug pour isoler les tokens entre workspaces dans le même navigateur.
// Le slug est fixé au chargement de page (rechargement complet au changement de
// workspace), donc figer la clé au module load est correct.
const workspaceSlugFromPath = getWorkspaceSlugFromPath();

export const TOKEN_PAIR_LOCAL_STORAGE_KEY =
  workspaceSlugFromPath !== undefined
    ? `tokenPairState:${workspaceSlugFromPath}`
    : 'tokenPairState';

export const tokenPairState = createAtomState<AuthTokenPair | null>({
  key: TOKEN_PAIR_LOCAL_STORAGE_KEY,
  defaultValue: null,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: (payload) => isValidAuthTokenPair(payload),
});
