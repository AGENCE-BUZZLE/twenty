import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { MainNavigationDrawerNavigationContent } from '@/navigation/components/MainNavigationDrawerNavigationContent';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle: the Twenty tab row (Home pill + AI Chat + Add tab) is removed.
// The Home shortcut is redundant with our fixed "Vue d'ensemble" entry
// in BuzzleWorkspaceNav, and AI Chat is disabled at the permission level.
export const MainNavigationDrawer = ({ className }: { className?: string }) => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  return (
    <NavigationDrawer
      className={className}
      title={currentWorkspace?.displayName ?? ''}
    >
      <NavigationDrawerScrollableContent>
        <MainNavigationDrawerNavigationContent />
      </NavigationDrawerScrollableContent>
    </NavigationDrawer>
  );
};
