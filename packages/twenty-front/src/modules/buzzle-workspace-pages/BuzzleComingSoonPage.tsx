import { styled } from '@linaria/react';
import type { ComponentType } from 'react';

// Shared placeholder for pages that are not yet implemented. Renders a
// centered card with a title, one-line subtitle, and an SVG icon. Used
// by Rapports and Factures until the real content ships.

const InkColor = '#14141c';
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
  margin: 0 0 32px;
  color: ${MutedColor};
  font-size: 15px;
  line-height: 1.6;
`;

const Card = styled.div`
  margin-top: 40px;
  padding: 48px 40px;
  border: 1px solid ${InkColor};
  border-radius: 12px;
  background: ${InkColor};
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 28px;
`;

const IconFrame = styled.div`
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const CardText = styled.div`
  flex: 1;
`;

const CardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #ffffff;
`;

const CardSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  line-height: 1.55;
`;

type BuzzleComingSoonPageProps = {
  eyebrow: string;
  title: string;
  lede: string;
  Icon: ComponentType;
  cardTitle: string;
  cardSubtitle: string;
};

// The eyebrow + title props are merged into a single "Espace · X" header
// so the shell matches the treatment applied to Contacts / Factures /
// Appels. Callers keep passing both to describe the section.
export const BuzzleComingSoonPage = ({
  eyebrow,
  title: _title,
  lede,
  Icon,
  cardTitle,
  cardSubtitle,
}: BuzzleComingSoonPageProps) => (
  <Container>
    <PageTitle>{eyebrow}</PageTitle>
    <Lede>{lede}</Lede>
    <Card>
      <IconFrame>
        <Icon />
      </IconFrame>
      <CardText>
        <CardTitle>{cardTitle}</CardTitle>
        <CardSubtitle>{cardSubtitle}</CardSubtitle>
      </CardText>
    </Card>
  </Container>
);
