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
  padding: 40px 48px 60px;
  max-width: 1200px;
  margin: 0 auto;
  color: ${InkColor};
`;

const Eyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 10px;
`;

const Title = styled.h1`
  font-family: 'Inter Tight', sans-serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.024em;
  margin: 0 0 8px;
  line-height: 1.1;
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 15px;
  max-width: 640px;
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
  border: 1px solid ${HairlineColor};
  border-radius: 10px;
  background: ${SurfaceColor};
`;

const StatHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: ${MutedColor};
`;

const StatIconWrap = styled.span`
  display: inline-flex;
  color: ${AccentColor};
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
  color: ${MutedColor};
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
  border: 1px solid ${HairlineColor};
  border-radius: 10px;
  background: ${SurfaceColor};
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  font-family: inherit;
  color: inherit;
  &:hover {
    background: ${PaperColor};
    border-color: ${InkColor};
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
  background: ${PaperColor};
  color: ${AccentColor};
  align-items: center;
  justify-content: center;
`;

const QuickLinkTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 16px;
  font-weight: 500;
`;

const QuickLinkText = styled.div`
  color: ${MutedColor};
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

const IconTrending = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
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
      <Eyebrow>Vue d'ensemble</Eyebrow>
      <Title>
        Bonjour {displayName ? displayName : ''}
      </Title>
      <Lede>
        Voici votre espace <b>{workspaceName}</b>. Retrouvez ici l'état de
        votre pipeline, vos contacts et vos rapports de performance.
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

        <QuickLink onClick={() => navigate('/pipeline')}>
          <QuickLinkHead>
            <QuickLinkIcon>
              <IconTrending />
            </QuickLinkIcon>
            <QuickLinkTitle>Ouvrir le pipeline</QuickLinkTitle>
          </QuickLinkHead>
          <QuickLinkText>
            Faites évoluer vos contacts d'un statut à l'autre pour informer
            Google Ads et Meta.
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
      </QuickLinksGrid>
    </Container>
  );
};
