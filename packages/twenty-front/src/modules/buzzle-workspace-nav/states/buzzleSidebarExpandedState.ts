import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Shared expand/collapse state for the Ink shell floating sidebar.
// Toggled by BuzzleFloatingHamburger; read by BuzzleFloatingSidebar and
// each ShellGrid parent so the whole column can widen in lockstep with
// the pills switching to horizontal button rows.
export const buzzleSidebarExpandedState = createAtomState<boolean>({
  key: 'buzzleSidebarExpandedState',
  defaultValue: false,
});
