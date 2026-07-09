import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BUZZLE_CREATE_WORKSPACE_FROM_TEMPLATE } from '@/buzzle-admin/graphql/mutations/createWorkspaceFromTemplate';
import { useApolloAdminClient } from '@/settings/admin-panel/apollo/hooks/useApolloAdminClient';

const Container = styled.div`
  padding: 32px 40px;
  max-width: 640px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Crumb = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 8px;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const Title = styled.h1`
  font-family: 'Inter Tight', sans-serif;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid #d6d2c7;
  border-radius: 8px;
  background: #ffffff;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #14141c;
  opacity: 0.6;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d6d2c7;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #14141c;
  background: #ffffff;
  transition: border-color 0.15s;
  &:focus {
    outline: none;
    border-color: #5b4bff;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d6d2c7;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #14141c;
  background: #ffffff;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #5b4bff;
  }
`;

const Helper = styled.span`
  font-size: 12px;
  color: #14141c;
  opacity: 0.6;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const SubmitButton = styled.button`
  background: #5b4bff;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background: transparent;
  color: #14141c;
  border: 1px solid #d6d2c7;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #efede6; }
`;

const InfoBox = styled.div`
  padding: 12px 14px;
  border: 1px dashed #d6d2c7;
  border-radius: 4px;
  font-size: 12.5px;
  color: #14141c;
  opacity: 0.75;
  background: #efede6;
  line-height: 1.5;
`;

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

export const BuzzleCreateWorkspace = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [templateId, setTemplateId] = useState('leads-google-ads');
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const created = (result.data as {
        buzzleCreateWorkspaceFromTemplate?: {
          appliedSteps: string[];
          url: string;
        };
      } | null | undefined)?.buzzleCreateWorkspaceFromTemplate;
      if (created) {
        alert(
          `Workspace créé (stage 1 validation OK).\n\nURL : ${created.url}\n\nÉtapes appliquées :\n- ${created.appliedSteps.join('\n- ')}\n\nStage 2 (création workspace complète + template applier) en cours de développement.`,
        );
        navigate('/buzzle-admin');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue lors de la création';
      setErrorMessage(message);
    }
  };

  return (
    <Container>
      <Header>
        <Crumb onClick={() => navigate('/buzzle-admin')}>
          ← Cockpit · Agence Buzzle
        </Crumb>
        <Title>Nouveau workspace client</Title>
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
            Ce nom apparaîtra dans le workspace du client (top-left dropdown).
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
            . Auto-généré depuis le nom, tu peux le modifier.
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
              Leads Meta Ads (à venir)
            </option>
            <option value="leads-mixed" disabled>
              Leads Mixte Google + Meta (à venir)
            </option>
          </Select>
          <Helper>
            Le template crée l'objet Prospect, les 5 statuts (Nouveau · À
            rappeler · Devis envoyé · Signé · Perdu) et wire le webhook OCT
            vers n8n automatiquement.
          </Helper>
        </Field>

        {errorMessage && (
          <InfoBox style={{ borderColor: '#c94a4a', background: '#fbe5e5' }}>
            <strong>Erreur backend :</strong> {errorMessage}
          </InfoBox>
        )}

        <InfoBox>
          Backend Sprint S4 stage 1 actif : validation subdomain + template.
          La création workspace complète (schéma Postgres, objet Prospect,
          statuts, webhook OCT) arrive en Stage 2.
        </InfoBox>

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
