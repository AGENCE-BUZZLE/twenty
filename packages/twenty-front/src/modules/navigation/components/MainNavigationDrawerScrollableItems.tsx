import { BuzzleWorkspaceNav } from '@/buzzle-workspace-nav/BuzzleWorkspaceNav';
import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';

import { styled } from '@linaria/react';

import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

// Buzzle: the workspace drawer intentionally shows ONLY the Buzzle nav
// (Vue d'ensemble, Contacts, Pipeline, Rapports, Mon profil, Contacter
// Buzzle). Twenty's dynamic Workspace + Favorites sections are removed
// because our CRM does not expose Companies / People / Opportunities /
// Tasks / Notes / Dashboards / Workflows to end users. Custom Buzzle
// objects (currently `contact`) are reachable through the fixed nav
// entries which redirect to /objects/<namePlural> when the object exists.
export const MainNavigationDrawerScrollableItems = () => {
  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <BuzzleWorkspaceNav />
    </StyledScrollableItemsContainer>
  );
};
