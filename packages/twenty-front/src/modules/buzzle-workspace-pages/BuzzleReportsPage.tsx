import { styled } from '@linaria/react';

// /reports entry. Static scaffold until the aggregation service is wired.
// No unicode em dashes for empty values; we use the label "à venir" and
// a subdued SVG icon per card instead.

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
  margin-bottom: 8px;
`;

const Title = styled.h1`
  font-family: 'Inter Tight', sans-serif;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 14.5px;
  max-width: 640px;
  line-height: 1.6;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin: 32px 0 24px;
`;

const StatCard = styled.div`
  padding: 18px 20px;
  border: 1px solid ${HairlineColor};
  border-radius: 10px;
  background: ${SurfaceColor};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${MutedColor};
`;

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StatIconWrap = styled.span`
  display: inline-flex;
  color: ${AccentColor};
`;

const StatValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 24px;
  font-weight: 500;
  color: ${InkColor};
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const StatSub = styled.span`
  font-size: 12px;
  color: ${MutedColor};
  font-weight: 400;
`;

const InfoBox = styled.div`
  padding: 16px 20px;
  border: 1px dashed ${HairlineColor};
  border-radius: 10px;
  background: ${PaperColor};
  font-size: 13.5px;
  color: ${MutedColor};
  line-height: 1.6;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const InfoIcon = styled.div`
  color: ${InkColor};
  opacity: 0.6;
  flex-shrink: 0;
`;

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const IconCoin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const stats = [
  { label: 'Leads reçus', Icon: IconMail },
  { label: 'Qualifiés', Icon: IconTarget },
  { label: 'Signés', Icon: IconTrophy },
  { label: 'CA généré', Icon: IconCoin },
];

export const BuzzleReportsPage = () => {
  return (
    <Container>
      <Eyebrow>Espace · Rapports</Eyebrow>
      <Title>Performance des campagnes</Title>
      <Lede>
        Ce que Buzzle envoie automatiquement à Google Ads et Meta pour
        améliorer vos campagnes en continu.
      </Lede>

      <StatsGrid>
        {stats.map(({ label, Icon }) => (
          <StatCard key={label}>
            <StatHead>
              <StatIconWrap>
                <Icon />
              </StatIconWrap>
              <StatLabel>{label}</StatLabel>
            </StatHead>
            <StatValue>
              0 <StatSub>à venir</StatSub>
            </StatValue>
          </StatCard>
        ))}
      </StatsGrid>

      <InfoBox>
        <InfoIcon>
          <IconInfo />
        </InfoIcon>
        <div>
          Les rapports se rempliront dès que les premiers leads arriveront et
          que leurs statuts évolueront. Chaque changement de statut vers
          <b> Devis envoyé</b> ou <b>Signé</b> pousse une conversion vers
          Google Ads et Meta.
        </div>
      </InfoBox>
    </Container>
  );
};
