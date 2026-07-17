import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Shared shell for Buzzle settings pages, portée sur le même patron que
// les autres espaces (Vue d'ensemble / Factures / Contacts / Appels) :
// header compact avec un titre 32px à gauche et une strip pill à droite
// pour switcher Profil / Membres / Workspace, plus le workspace picker
// tout à droite pour rester cohérent avec le reste de l'app.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 28px 40px 32px;
  color: ${InkColor};
  background: #efede6;
  overflow-y: auto;
  > * {
    max-width: 1320px;
    margin-left: auto;
    margin-right: auto;
  }
  @media (max-width: 768px) {
    padding: 16px 12px 24px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 20px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: ${InkColor};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const TabStrip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 999px;
  padding: 4px;
`;

const TabPill = styled.button<{ active?: boolean }>`
  padding: 7px 14px;
  border-radius: 999px;
  border: 0;
  background: ${({ active }) => (active ? InkColor : 'transparent')};
  color: ${({ active }) => (active ? SurfaceColor : InkColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover:not(:disabled) {
    background: ${({ active }) =>
      active ? InkColor : 'rgba(20, 20, 28, 0.06)'};
  }
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
      <HeaderRow>
        <HeaderText>
          <PageTitle>Paramètres</PageTitle>
        </HeaderText>
        <HeaderActions>
          <TabStrip role="tablist" aria-label="Section paramètres">
            <TabPill
              active={activeTab === 'profile'}
              onClick={() => navigate('/settings/profile')}
            >
              Profil
            </TabPill>
            <TabPill
              active={activeTab === 'members'}
              onClick={() => navigate('/settings/members')}
            >
              Membres
            </TabPill>
            {isSuperAdmin && (
              <TabPill
                active={activeTab === 'workspace'}
                onClick={() => navigate('/settings/workspace')}
              >
                Workspace
              </TabPill>
            )}
          </TabStrip>
          <BuzzleWorkspacesButton />
        </HeaderActions>
      </HeaderRow>
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
