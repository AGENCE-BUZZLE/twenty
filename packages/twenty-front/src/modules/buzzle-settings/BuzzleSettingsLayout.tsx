import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Shared shell for Buzzle settings pages · même design que Vue
// d'ensemble : Ink shell (sidebar pills + top bar + Stage card), avec
// un tab strip Profil / Membres / (Workspace pour super admin) au
// sommet du Stage pour naviguer entre les 3 sections.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  width: 100%;
  color: ${InkColor};
  > * {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${InkColor};
  margin: 0;
  line-height: 1.15;

  @media (max-width: 768px) {
    font-size: 20px;
    letter-spacing: -0.016em;
  }
`;

const TabStrip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${SurfaceColor};
  border: 1px solid rgba(20, 20, 28, 0.14);
  border-radius: 999px;
  padding: 4px;
  align-self: flex-start;
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

const TITLES: Record<BuzzleSettingsLayoutProps['activeTab'], string> = {
  profile: 'Profil',
  members: 'Membres',
  workspace: 'Workspace',
};

export const BuzzleSettingsLayout = ({
  activeTab,
  children,
}: BuzzleSettingsLayoutProps) => {
  const navigate = useNavigate();
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel ?? false;

  return (
    <BuzzleWorkspaceShell>
      <Container>
        <HeaderRow>
          <PageTitle>{TITLES[activeTab]}</PageTitle>
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
        </HeaderRow>
        {children}
      </Container>
    </BuzzleWorkspaceShell>
  );
};

export const settingsTheme = {
  InkColor,
  PaperColor,
  HairlineColor,
  AccentColor,
  MutedColor,
};
