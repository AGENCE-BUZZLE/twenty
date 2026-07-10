import { styled } from '@linaria/react';

// Shared placeholder for pages that are not yet implemented. Renders a
// centered card with a title, one-line subtitle, and an SVG icon. Used
// by Rapports and Factures until the real content ships.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  padding: 80px 48px 60px;
  max-width: 720px;
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
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.024em;
  margin: 0 0 8px;
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 15px;
  max-width: 540px;
  line-height: 1.6;
`;

const Card = styled.div`
  margin-top: 40px;
  padding: 48px 40px;
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 28px;
`;

const IconFrame = styled.div`
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: ${PaperColor};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${AccentColor};
`;

const CardText = styled.div`
  flex: 1;
`;

const CardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 6px;
`;

const CardSubtitle = styled.div`
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.55;
`;

type BuzzleComingSoonPageProps = {
  eyebrow: string;
  title: string;
  lede: string;
  Icon: () => JSX.Element;
  cardTitle: string;
  cardSubtitle: string;
};

export const BuzzleComingSoonPage = ({
  eyebrow,
  title,
  lede,
  Icon,
  cardTitle,
  cardSubtitle,
}: BuzzleComingSoonPageProps) => (
  <Container>
    <Eyebrow>{eyebrow}</Eyebrow>
    <Title>{title}</Title>
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
