import { styled } from '@linaria/react';
import { Navigate } from 'react-router-dom';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';

// /contacts entry inside a client workspace.
// If Contact object exists we Navigate to Twenty's native record index.
// Otherwise we show a Buzzle-branded onboarding-needed state so the
// sidebar link never dead-ends.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  padding: 40px 48px 60px;
  max-width: 900px;
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
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: ${InkColor};
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 14.5px;
  max-width: 620px;
  line-height: 1.6;
`;

const Card = styled.div`
  margin-top: 32px;
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  padding: 40px;
  background: #ffffff;
  display: flex;
  gap: 32px;
  align-items: center;
`;

const IconFrame = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: ${PaperColor};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${AccentColor};
`;

const CardBody = styled.div`
  flex: 1;
`;

const CardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 6px;
  color: ${InkColor};
`;

const CardText = styled.div`
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.55;
`;

const Tag = styled.code`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  background: ${PaperColor};
  padding: 2px 6px;
  border-radius: 4px;
  color: ${InkColor};
`;

const IconUsers = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const BuzzleContactsPage = () => {
  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();

  const contactObject = findActiveObjectMetadataItemByNamePlural('contacts');
  if (contactObject) {
    return <Navigate to="/objects/contacts" replace />;
  }

  return (
    <Container>
      <Eyebrow>Espace · Contacts</Eyebrow>
      <Title>Vos contacts</Title>
      <Lede>
        Tous les leads reçus depuis vos campagnes Google Ads et Meta Ads
        arriveront ici avec leur historique complet.
      </Lede>

      <Card>
        <IconFrame>
          <IconUsers />
        </IconFrame>
        <CardBody>
          <CardTitle>Ce workspace n'est pas encore initialisé</CardTitle>
          <CardText>
            L'objet <Tag>Contact</Tag> sera provisionné automatiquement
            lorsque votre agence lancera l'onboarding. Une fois provisionné,
            cette page affiche directement votre liste de contacts.
          </CardText>
        </CardBody>
      </Card>
    </Container>
  );
};
