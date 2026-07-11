import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle workspace overview.
// Landing page for a client. Shows a welcome message, headline stats,
// and quick links to the other Buzzle sections. Stats will be wired to
// real aggregations in a follow-up sprint; for now the layout communicates
// what Buzzle does for them.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
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
  margin: 0 0 14px;
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 15px;
  line-height: 1.6;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 32px 0 24px;
`;

const StatCard = styled.div`
  padding: 20px 22px;
  border: 1px solid ${InkColor};
  border-radius: 10px;
  background: ${InkColor};
  color: ${SurfaceColor};
`;

const StatHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: rgba(255, 255, 255, 0.72);
`;

const StatIconWrap = styled.span`
  display: inline-flex;
  color: rgba(255, 255, 255, 0.9);
`;

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StatValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
`;

const StatSub = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6px;
`;

const QuickLinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 32px;
`;

const QuickLink = styled.button`
  text-align: left;
  padding: 22px;
  border: 1px solid ${InkColor};
  border-radius: 10px;
  background: ${InkColor};
  color: ${SurfaceColor};
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, opacity 0.12s;
  font-family: inherit;
  &:hover {
    opacity: 0.9;
  }
`;

const QuickLinkHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const QuickLinkIcon = styled.span`
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: ${SurfaceColor};
  align-items: center;
  justify-content: center;
`;

const QuickLinkTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: ${SurfaceColor};
`;

const QuickLinkText = styled.div`
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.55;
`;

const SectionTitle = styled.h2`
  font-family: 'Inter Tight', sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 40px 0 12px;
  color: ${InkColor};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionLine = styled.span`
  flex: 1;
  height: 1px;
  background: ${HairlineColor};
`;

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconReceipt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4v18l3-2 3 2 3-2 3 2 3-2 1 2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

const IconChartBar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export const BuzzleOverviewPage = () => {
  const navigate = useNavigate();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();

  const contactObject = findActiveObjectMetadataItemByNamePlural('contacts');
  const displayName = currentUser?.firstName ?? '';
  const workspaceName = currentWorkspace?.displayName ?? 'Votre workspace';

  return (
    <Container>
      <PageTitle>
        Espace · Vue d'ensemble
      </PageTitle>
      <Lede>
        Bonjour{displayName ? ` ${displayName}` : ''}, voici votre espace{' '}
        <b>{workspaceName}</b>. Retrouvez ici l'état de vos contacts, de vos
        rapports de performance et de vos factures.
      </Lede>

      <StatsGrid>
        <StatCard>
          <StatHead>
            <StatIconWrap>
              <IconUsers />
            </StatIconWrap>
            <StatLabel>Contacts</StatLabel>
          </StatHead>
          <StatValue>0</StatValue>
          <StatSub>
            {contactObject
              ? 'aucun contact reçu pour le moment'
              : 'workspace en cours d\'initialisation'}
          </StatSub>
        </StatCard>
        <StatCard>
          <StatHead>
            <StatIconWrap>
              <IconTrophy />
            </StatIconWrap>
            <StatLabel>Signés ce mois</StatLabel>
          </StatHead>
          <StatValue>0</StatValue>
          <StatSub>aucun devis signé pour le moment</StatSub>
        </StatCard>
        <StatCard>
          <StatHead>
            <StatIconWrap>
              <IconClock />
            </StatIconWrap>
            <StatLabel>Temps moyen</StatLabel>
          </StatHead>
          <StatValue>0j</StatValue>
          <StatSub>délai de qualification à venir</StatSub>
        </StatCard>
      </StatsGrid>

      <SectionTitle>
        Accès rapide
        <SectionLine />
      </SectionTitle>

      <QuickLinksGrid>
        <QuickLink onClick={() => navigate('/contacts')}>
          <QuickLinkHead>
            <QuickLinkIcon>
              <IconUsers />
            </QuickLinkIcon>
            <QuickLinkTitle>Voir mes contacts</QuickLinkTitle>
          </QuickLinkHead>
          <QuickLinkText>
            Retrouvez la liste complète de vos leads avec leur historique de
            qualification.
          </QuickLinkText>
        </QuickLink>

        <QuickLink onClick={() => navigate('/reports')}>
          <QuickLinkHead>
            <QuickLinkIcon>
              <IconChartBar />
            </QuickLinkIcon>
            <QuickLinkTitle>Consulter les rapports</QuickLinkTitle>
          </QuickLinkHead>
          <QuickLinkText>
            Suivez la performance de vos campagnes et les conversions
            remontées.
          </QuickLinkText>
        </QuickLink>

        <QuickLink onClick={() => navigate('/invoices')}>
          <QuickLinkHead>
            <QuickLinkIcon>
              <IconReceipt />
            </QuickLinkIcon>
            <QuickLinkTitle>Voir mes factures</QuickLinkTitle>
          </QuickLinkHead>
          <QuickLinkText>
            Retrouvez vos factures et l'historique de vos abonnements Buzzle.
          </QuickLinkText>
        </QuickLink>
      </QuickLinksGrid>
    </Container>
  );
};
