import { styled } from '@linaria/react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';

// Shared shell for settings pages qui doivent hériter du même design
// que le reste du CRM (Ink shell + Stage card + titre 24px). Utilisé
// pour Profil et Membres · les autres écrans Settings gardent le
// SettingsPageLayout historique en attendant leur passage à l'Ink DA.

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
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
`;

const HeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const BackButton = styled.button`
  background: transparent;
  color: ${MutedColor};
  border: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.12s;
  &:hover {
    color: ${InkColor};
  }
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

const TabsRow = styled.div`
  margin-bottom: 20px;
`;

const IconArrowLeft = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

type BuzzleSettingsShellProps = {
  title: string;
  tabs?: ReactNode;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

export const BuzzleSettingsShell = ({
  title,
  tabs,
  backTo = '/overview',
  backLabel = 'Retour',
  children,
}: BuzzleSettingsShellProps) => {
  const navigate = useNavigate();

  return (
    <BuzzleWorkspaceShell>
      <Container>
        <HeaderRow>
          <HeaderTopRow>
            <BackButton type="button" onClick={() => navigate(backTo)}>
              <IconArrowLeft />
              {backLabel}
            </BackButton>
          </HeaderTopRow>
          <PageTitle>{title}</PageTitle>
        </HeaderRow>
        {tabs !== undefined && <TabsRow>{tabs}</TabsRow>}
        {children}
      </Container>
    </BuzzleWorkspaceShell>
  );
};
