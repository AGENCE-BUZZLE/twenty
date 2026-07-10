import { styled } from '@linaria/react';
import { Navigate } from 'react-router-dom';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';

// /pipeline entry. Once the Contact object exists we Navigate to the
// native record list. Until then, a preview of the kanban stages helps
// the client understand what their pipeline will look like.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  padding: 40px 48px 60px;
  max-width: 1400px;
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

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-top: 32px;
`;

const Col = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 10px;
  background: ${SurfaceColor};
  display: flex;
  flex-direction: column;
  min-height: 340px;
`;

const ColHead = styled.div`
  padding: 14px 16px 12px;
  border-bottom: 1px solid ${HairlineColor};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Dot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
  display: inline-block;
`;

const ColName = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${InkColor};
`;

const ColCount = styled.div`
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  color: ${MutedColor};
`;

const ColBody = styled.div`
  padding: 14px 12px;
  flex: 1;
`;

const EmptyLine = styled.div`
  padding: 32px 8px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const InfoBox = styled.div`
  padding: 16px 20px;
  border: 1px dashed ${HairlineColor};
  border-radius: 10px;
  background: ${PaperColor};
  font-size: 13.5px;
  color: ${MutedColor};
  line-height: 1.6;
  margin-top: 24px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const InfoIcon = styled.div`
  flex-shrink: 0;
  color: ${InkColor};
  opacity: 0.6;
`;

const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const stages = [
  { name: 'Nouveau', color: '#3d5efc' },
  { name: 'À rappeler', color: '#f5a623' },
  { name: 'Devis envoyé', color: '#5b4bff' },
  { name: 'Signé', color: '#187a4a' },
  { name: 'Perdu', color: '#8a8b91' },
];

export const BuzzlePipelinePage = () => {
  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const views = useAtomStateValue(viewsSelector);

  const contactObject = findActiveObjectMetadataItemByNamePlural('contacts');
  if (contactObject) {
    // Prefer the kanban view when the applier has created one, so
    // /pipeline lands the user on a real pipeline instead of the
    // default table.
    const kanbanView = views.find(
      (v) => v.objectMetadataId === contactObject.id && v.type === 'KANBAN',
    );
    const target = kanbanView
      ? `/objects/contacts?viewId=${kanbanView.id}`
      : '/objects/contacts';
    return <Navigate to={target} replace />;
  }

  return (
    <Container>
      <Eyebrow>Espace · Pipeline</Eyebrow>
      <Title>Pipeline de qualification</Title>
      <Lede>
        Faites glisser vos contacts d'un statut à l'autre. Chaque changement
        de statut informe automatiquement Google Ads et Meta pour améliorer
        vos campagnes en continu.
      </Lede>

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
        <InfoIcon>
          <IconInfo />
        </InfoIcon>
        <div>
          Le pipeline se remplira dès que le premier lead arrivera depuis vos
          campagnes. La colonne <b>Signé</b> déclenchera automatiquement un
          push de conversion vers Google Ads et Meta.
        </div>
      </InfoBox>
    </Container>
  );
};
