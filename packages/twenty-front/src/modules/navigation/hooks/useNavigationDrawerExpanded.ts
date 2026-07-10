import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle: sidebar is always expanded on desktop. Users cannot collapse
// it (we removed the toggle handle) so the client has a consistent
// left rail. On mobile the atom still controls visibility.
export const useNavigationDrawerExpanded = () => {
  const isMobile = useIsMobile();
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );
  return isMobile ? isNavigationDrawerExpanded : true;
};
