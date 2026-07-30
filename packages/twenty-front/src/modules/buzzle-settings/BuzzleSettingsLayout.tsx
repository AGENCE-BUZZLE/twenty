import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';

// Shared shell for Buzzle settings pages · même design que les pages
// principales du CRM : Ink shell (sidebar pills + top bar + Stage card)
// avec un header 24px identique à Vue d'ensemble. Chaque section
// (Profil, Membres, Espace de travail) est totalement autonome · on
// navigue via le pill Paramètres en bas de la sidebar.

const InkColor = '#14141c';
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
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 20px;
  @media (max-width: 768px) {
    align-items: center;
    gap: 12px;
  }
`;

const HeaderText = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
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

type BuzzleSettingsLayoutProps = {
  activeTab: 'profile' | 'members' | 'workspace';
  children: ReactNode;
};

const TITLES: Record<BuzzleSettingsLayoutProps['activeTab'], string> = {
  profile: 'Profil',
  members: 'Membres',
  workspace: 'Espace de travail',
};

export const BuzzleSettingsLayout = ({
  activeTab,
  children,
}: BuzzleSettingsLayoutProps) => (
  <BuzzleWorkspaceShell>
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>{TITLES[activeTab]}</PageTitle>
        </HeaderText>
      </HeaderRow>
      {children}
    </Container>
  </BuzzleWorkspaceShell>
);

export const settingsTheme = {
  InkColor,
  MutedColor,
};
