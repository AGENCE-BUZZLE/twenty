import { styled } from '@linaria/react';

// Buzzle Pipeline page — kanban view scaffold.
// Real kanban wired to Contact object comes in Sprint S4 stage 3.

const Container = styled.div`
  padding: 32px 40px;
  max-width: 1400px;
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

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-top: 22px;
`;

const Col = styled.div`
  border: 1px solid #d6d2c7;
  border-radius: 6px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 340px;
`;

const ColHead = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid #d6d2c7;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Dot = styled.span<{ color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

const ColName = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const ColCount = styled.div`
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  opacity: 0.5;
`;

const ColBody = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const EmptyLine = styled.div`
  padding: 32px 12px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.4;
`;

const InfoBox = styled.div`
  padding: 14px 18px;
  border: 1px dashed #d6d2c7;
  border-radius: 6px;
  background: #efede6;
  font-size: 13px;
  opacity: 0.75;
  line-height: 1.55;
  margin-top: 22px;
`;

const stages = [
  { name: 'Nouveau', color: '#3d5efc' },
  { name: 'À rappeler', color: '#f5a623' },
  { name: 'Devis envoyé', color: '#5b4bff' },
  { name: 'Signé', color: '#38a169' },
  { name: 'Perdu', color: '#8a8b91' },
];

export const BuzzlePipelinePage = () => {
  return (
    <Container>
      <Head>
        <Sub>A.02 · Pipeline</Sub>
        <Title>Pipeline de qualification</Title>
        <Lede>
          Faites glisser vos contacts d'un statut à l'autre. Chaque changement
          de statut informe automatiquement Google Ads et Meta pour optimiser
          vos campagnes.
        </Lede>
      </Head>

      <Board>
        {stages.map((s) => (
          <Col key={s.name}>
            <ColHead>
              <Dot color={s.color} />
              <ColName>{s.name}</ColName>
              <ColCount>0</ColCount>
            </ColHead>
            <ColBody>
              <EmptyLine>Aucun contact</EmptyLine>
            </ColBody>
          </Col>
        ))}
      </Board>

      <InfoBox>
        Le pipeline se remplira dès que le premier lead arrivera depuis vos
        campagnes. Maquette du rendu final :{' '}
        <a href="https://ui-ux.agence-buzzle.com/client-view#prospects" target="_blank" rel="noopener noreferrer">
          ui-ux.agence-buzzle.com/client-view
        </a>
        .
      </InfoBox>
    </Container>
  );
};
