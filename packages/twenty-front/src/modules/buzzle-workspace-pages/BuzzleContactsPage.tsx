import { styled } from '@linaria/react';

// Buzzle Contacts page — visible in every client workspace.
// Currently a static "coming soon" scaffold. Will be wired to the
// Contact custom object once Sprint S4 stage 3 provisions it in
// each workspace.

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

const EmptyPanel = styled.div`
  padding: 64px 24px;
  text-align: center;
  border: 1px dashed #d6d2c7;
  border-radius: 8px;
  background: #efede6;
  margin-top: 22px;
`;

const EmptyTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const EmptyBody = styled.div`
  opacity: 0.7;
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.55;
  font-size: 14px;
`;

const Tag = styled.span`
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 3px;
  background: #ffffff;
  border: 1px solid #d6d2c7;
  margin: 0 4px;
`;

export const BuzzleContactsPage = () => {
  return (
    <Container>
      <Head>
        <Sub>A.02 · Contacts</Sub>
        <Title>Vos contacts</Title>
        <Lede>
          Tous les leads reçus depuis vos campagnes Google Ads et Meta Ads
          arriveront ici avec leur historique complet.
        </Lede>
      </Head>

      <EmptyPanel>
        <EmptyTitle>Bientôt disponible</EmptyTitle>
        <EmptyBody>
          L'objet <Tag>Contact</Tag> sera provisionné automatiquement dans votre
          workspace lors du prochain onboarding.
          <br />
          <br />
          En attendant, une maquette du rendu final est visible sur{' '}
          <a href="https://ui-ux.agence-buzzle.com/contacts" target="_blank" rel="noopener noreferrer">
            ui-ux.agence-buzzle.com/contacts
          </a>
          .
        </EmptyBody>
      </EmptyPanel>
    </Container>
  );
};
