import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BUZZLE_CREATE_WORKSPACE_FROM_TEMPLATE } from '@/buzzle-admin/graphql/mutations/createWorkspaceFromTemplate';
import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';

// New client workspace form. Same Schemata design language as the
// cockpit: eyebrow / title / lede, hairline border card, keyboard-first
// input fields, primary Ink CTA. Inline success/error rendering (no
// browser alerts).

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const AccentColor = '#12b76a';
const OkColor = '#187a4a';
const OkSoft = '#e3f4ea';
const DangerColor = '#c94a4a';
const DangerSoft = '#fbe5e5';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  padding: 40px 48px 60px;
  max-width: 720px;
  margin: 0 auto;
  color: ${InkColor};
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: ${MutedColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  &:hover {
    color: ${InkColor};
  }
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
  max-width: 560px;
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
  margin-top: 24px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
  font-weight: 500;
`;

const Input = styled.input`
  padding: 11px 14px;
  border: 1px solid ${HairlineColor};
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: ${InkColor};
  background: ${SurfaceColor};
  transition: border-color 0.15s;
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const Select = styled.select`
  padding: 11px 14px;
  border: 1px solid ${HairlineColor};
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: ${InkColor};
  background: ${SurfaceColor};
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const Helper = styled.span`
  font-size: 12.5px;
  color: ${MutedColor};
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const SubmitButton = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 1px solid ${InkColor};
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    opacity: 0.88;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background: transparent;
  color: ${InkColor};
  border: 1px solid ${HairlineColor};
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  &:hover {
    background: ${PaperColor};
  }
`;

const InfoCard = styled.div`
  padding: 14px 16px;
  border: 1px dashed ${HairlineColor};
  border-radius: 8px;
  font-size: 13px;
  color: ${MutedColor};
  background: ${PaperColor};
  line-height: 1.55;
`;

const ErrorCard = styled(InfoCard)`
  background: ${DangerSoft};
  border-color: ${DangerColor};
  border-style: solid;
  color: #5a1010;
`;

const SuccessCard = styled.div`
  padding: 16px 18px;
  border-radius: 10px;
  background: ${OkSoft};
  border: 1px solid ${OkColor};
  color: #0d4a2a;
  margin-top: 20px;
`;

const SuccessTitle = styled.div`
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SuccessSteps = styled.pre`
  margin: 8px 0 0;
  padding: 10px 12px;
  background: ${SurfaceColor};
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  color: ${InkColor};
`;

const IconBack = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

type CreatedWorkspace = {
  displayName: string;
  url: string;
  appliedSteps: string[];
};

export const BuzzleCreateWorkspace = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [templateId, setTemplateId] = useState('leads-google-ads');
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedWorkspace | null>(null);

  const apolloAdminClient = useApolloAdminClient();
  const [createWorkspaceFromTemplate, { loading: submitting }] = useMutation(
    BUZZLE_CREATE_WORKSPACE_FROM_TEMPLATE,
    { client: apolloAdminClient },
  );

  const handleNameChange = (value: string) => {
    setDisplayName(value);
    if (!subdomainTouched) {
      setSubdomain(slugify(value));
    }
  };

  const canSubmit =
    displayName.trim().length > 0 && subdomain.trim().length > 0 && !submitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setErrorMessage(null);
    setCreated(null);
    try {
      const result = await createWorkspaceFromTemplate({
        variables: {
          input: {
            displayName: displayName.trim(),
            subdomain: subdomain.trim(),
            templateId,
          },
        },
      });
      const payload = (result.data as {
        buzzleCreateWorkspaceFromTemplate?: {
          appliedSteps: string[];
          url: string;
          displayName: string;
        };
      } | null | undefined)?.buzzleCreateWorkspaceFromTemplate;
      if (payload) {
        setCreated({
          displayName: payload.displayName,
          url: payload.url,
          appliedSteps: payload.appliedSteps,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue lors de la création';
      setErrorMessage(message);
    }
  };

  if (created) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate('/buzzle-admin')}>
            <IconBack /> Retour au cockpit
          </BackButton>
          <Title>Workspace créé</Title>
          <Lede>
            <b>{created.displayName}</b> est disponible sur{' '}
            <a href={created.url} target="_blank" rel="noopener noreferrer">
              {created.url}
            </a>
            .
          </Lede>
        </Header>

        <SuccessCard>
          <SuccessTitle>
            <IconCheck /> Provisioning terminé
          </SuccessTitle>
          <div>Étapes appliquées durant la création :</div>
          <SuccessSteps>
            {created.appliedSteps.map((s) => `- ${s}`).join('\n')}
          </SuccessSteps>
        </SuccessCard>

        <Actions>
          <CancelButton onClick={() => setCreated(null)}>
            Créer un autre workspace
          </CancelButton>
          <SubmitButton onClick={() => navigate('/buzzle-admin')}>
            Retour au cockpit
          </SubmitButton>
        </Actions>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/buzzle-admin')}>
          <IconBack /> Cockpit
        </BackButton>
        <Title>Nouveau workspace client</Title>
        <Lede>
          Chaque workspace correspond à un client de l'agence. Le template
          choisi provisionne l'objet Contact et le webhook OCT en un clic.
        </Lede>
      </Header>

      <Form onSubmit={handleSubmit}>
        <Field>
          <Label>Nom du client</Label>
          <Input
            type="text"
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="BF Menuiseries"
            autoFocus
          />
          <Helper>
            Ce nom apparaîtra en haut du workspace pour votre client.
          </Helper>
        </Field>

        <Field>
          <Label>Sous-domaine</Label>
          <Input
            type="text"
            value={subdomain}
            onChange={(e) => {
              setSubdomainTouched(true);
              setSubdomain(slugify(e.target.value));
            }}
            placeholder="bf-menuiseries"
          />
          <Helper>
            L'URL du client sera{' '}
            <strong>
              {subdomain || '{slug}'}.crm.agence-buzzle.com
            </strong>
            . Autogénéré depuis le nom, modifiable.
          </Helper>
        </Field>

        <Field>
          <Label>Template pipeline</Label>
          <Select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="leads-google-ads">
              Leads Google Ads (5 statuts, push OCT auto)
            </option>
            <option value="leads-meta-ads" disabled>
              Leads Meta Ads (bientôt disponible)
            </option>
            <option value="leads-mixed" disabled>
              Leads Google + Meta (bientôt disponible)
            </option>
          </Select>
          <Helper>
            Le template crée l'objet Contact, les 5 statuts (Nouveau, À
            rappeler, Devis envoyé, Signé, Perdu) et wire le webhook OCT
            vers n8n.
          </Helper>
        </Field>

        {errorMessage && (
          <ErrorCard>
            <strong>Erreur :</strong> {errorMessage}
          </ErrorCard>
        )}

        <Actions>
          <CancelButton
            type="button"
            onClick={() => navigate('/buzzle-admin')}
          >
            Annuler
          </CancelButton>
          <SubmitButton type="submit" disabled={!canSubmit}>
            {submitting ? 'Création…' : 'Créer le workspace'}
          </SubmitButton>
        </Actions>
      </Form>
    </Container>
  );
};
