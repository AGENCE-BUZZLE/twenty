import { styled } from '@linaria/react';

// Buzzle Reports page — visible in every client workspace.
// Static scaffold showing what the Reports dashboard will look like.
// Full impl comes when the Contact object exists + stats aggregation
// service is wired.

const Container = styled.div`
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Head = styled.div`
  margin-bottom: 24px;
`;

const Sub = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 6px;
`;

const Title = styled.h1`
  font-family: 'Inter Tight', sans-serif;
  font-weight: 500;
  font-size: 28px;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
`;

const Lede = styled.p`
  opacity: 0.7;
  margin: 0;
  font-size: 14.5px;
  max-width: 620px;
  line-height: 1.55;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 22px 0;
`;

const Stat = styled.div`
  padding: 14px 16px;
  border: 1px solid #d6d2c7;
  border-radius: 6px;
  background: #ffffff;
`;

const StatLbl = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 6px;
`;

const StatVal = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const StatSub = styled.div`
  font-size: 11px;
  opacity: 0.55;
  margin-top: 2px;
`;

const InfoBox = styled.div`
  padding: 16px 18px;
  border: 1px dashed #d6d2c7;
  border-radius: 6px;
  background: #efede6;
  font-size: 13px;
  opacity: 0.75;
  line-height: 1.55;
  margin-top: 12px;
`;

export const BuzzleReportsPage = () => {
  return (
    <Container>
      <Head>
        <Sub>A.03 · Rapports · Aperçu</Sub>
        <Title>Performance des campagnes</Title>
        <Lede>
          Ce que Buzzle envoie automatiquement à Google Ads et Meta pour
          améliorer vos campagnes en continu.
        </Lede>
      </Head>

      <StatsGrid>
        <Stat><StatLbl>Leads reçus</StatLbl><StatVal>—</StatVal><StatSub>à venir</StatSub></Stat>
        <Stat><StatLbl>Qualifiés</StatLbl><StatVal>—</StatVal><StatSub>à venir</StatSub></Stat>
        <Stat><StatLbl>Signés</StatLbl><StatVal>—</StatVal><StatSub>à venir</StatSub></Stat>
        <Stat><StatLbl>CA généré</StatLbl><StatVal>—</StatVal><StatSub>à venir</StatSub></Stat>
      </StatsGrid>

      <InfoBox>
        Les rapports se rempliront automatiquement dès que les premiers leads
        arriveront et que vous mettrez à jour leur statut. Maquette du rendu
        final :{' '}
        <a href="https://ui-ux.agence-buzzle.com/reports" target="_blank" rel="noopener noreferrer">
          ui-ux.agence-buzzle.com/reports
        </a>
        .
      </InfoBox>
    </Container>
  );
};
