import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Shared shell for Buzzle settings pages. Renders an eyebrow, a title,
// a horizontal tab bar (Profil / Membres) and the page content below.
// The Buzzle main drawer stays visible on the left because
// useIsSettingsDrawer() is stubbed to false.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 60px 48px 60px;
  color: ${InkColor};
  overflow-y: auto;
  > * {
    max-width: 1080px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.028em;
  color: ${InkColor};
  margin: 0 0 24px;
`;

const TabBar = styled.div`
  display: flex;
  gap: 6px;
  border-bottom: 1px solid ${HairlineColor};
  margin-bottom: 28px;
`;

const Tab = styled.button<{ isActive: boolean }>`
  background: transparent;
  border: 0;
  padding: 10px 16px 12px;
  font-family: inherit;
  font-size: 13.5px;
  color: ${({ isActive }) => (isActive ? InkColor : MutedColor)};
  font-weight: ${({ isActive }) => (isActive ? 500 : 400)};
  cursor: pointer;
  position: relative;
  &:hover {
    color: ${InkColor};
  }
  ${({ isActive }) =>
    isActive
      ? `&::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: -1px;
      height: 2px;
      border-radius: 2px;
      background: ${InkColor};
    }`
      : ''}
`;

type BuzzleSettingsLayoutProps = {
  activeTab: 'profile' | 'members' | 'workspace';
  children: ReactNode;
};

export const BuzzleSettingsLayout = ({
  activeTab,
  children,
}: BuzzleSettingsLayoutProps) => {
  const navigate = useNavigate();
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel ?? false;

  return (
    <Container>
      <PageTitle>Espace · Paramètres</PageTitle>
      <TabBar>
        <Tab
          isActive={activeTab === 'profile'}
          onClick={() => navigate('/settings/profile')}
        >
          Profil
        </Tab>
        <Tab
          isActive={activeTab === 'members'}
          onClick={() => navigate('/settings/members')}
        >
          Membres
        </Tab>
        {isSuperAdmin && (
          <Tab
            isActive={activeTab === 'workspace'}
            onClick={() => navigate('/settings/workspace')}
          >
            Workspace
          </Tab>
        )}
      </TabBar>
      {children}
    </Container>
  );
};

export const settingsTheme = {
  InkColor,
  PaperColor,
  HairlineColor,
  AccentColor,
  MutedColor,
};
