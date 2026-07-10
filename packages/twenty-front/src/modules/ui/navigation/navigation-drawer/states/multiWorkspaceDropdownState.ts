import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const multiWorkspaceDropdownState = createAtomState<
  'default' | 'workspaces-list' | 'themes' | 'languages'
>({
  key: 'multiWorkspaceDropdownState',
  defaultValue: 'default',
});
