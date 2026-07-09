import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import { useBuzzleApplyTemplate } from '@/buzzle-admin/hooks/useBuzzleApplyTemplate';
import { useBuzzleImpersonateWorkspace } from '@/buzzle-admin/hooks/useBuzzleImpersonateWorkspace';
import { useBuzzleWorkspaces } from '@/buzzle-admin/hooks/useBuzzleWorkspaces';
import { useState } from 'react';

// Buzzle SuperAdmin Cockpit — landing page for Clément
// as agency owner. Lists all workspaces + basic stats, entry
// point for creating new workspaces and impersonating users.
//
// V3-early scaffold. Full visual design (Schemata palette, Inter
// Tight, hairlines, kanban preview per workspace) comes in next
// sprints.

const Container = styled.div`
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
`;

const Subtitle = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.6;
`;

const CreateButton = styled.button`
  background: #5b4bff;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #d6d2c7;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #d6d2c7;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #14141c;
  opacity: 0.6;
  font-weight: 500;
`;

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid #efede6;
  font-size: 13px;
`;

const Badge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid #d6d2c7;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 0;
  opacity: 0.6;
`;

const EmptyStateBig = styled.div`
  text-align: center;
  padding: 64px 24px;
  border: 1px dashed #d6d2c7;
  border-radius: 8px;
  background: #efede6;
`;

const EmptyStateTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
`;

const EmptyStateSub = styled.div`
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 20px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.55;
`;

const OpenButton = styled.button`
  background: transparent;
  color: #14141c;
  border: 1px solid #d6d2c7;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #efede6; }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RowActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const ApplyButton = styled.button`
  background: transparent;
  color: #5b4bff;
  border: 1px solid #5b4bff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(91, 75, 255, 0.06); }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReportPanel = styled.div`
  padding: 12px 14px;
  border: 1px solid #d6d2c7;
  background: #ffffff;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 20px;
  white-space: pre-wrap;
`;

const ImpersonateError = styled.div`
  padding: 10px 14px;
  border: 1px solid #c94a4a;
  background: #fbe5e5;
  color: #5a1010;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 20px;
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  padding: 14px 16px;
  border: 1px solid #d6d2c7;
  border-radius: 6px;
  background: #ffffff;
`;

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const StatSub = styled.div`
  font-size: 11px;
  opacity: 0.6;
  margin-top: 2px;
`;

export const BuzzleCockpit = () => {
  const { workspaces, loading, error, refetch } = useBuzzleWorkspaces();
  const navigate = useNavigate();
  const {
    openWorkspace,
    error: impersonateError,
    pendingWorkspaceId,
  } = useBuzzleImpersonateWorkspace();
  const {
    apply: applyTemplate,
    error: applyError,
    pendingWorkspaceId: applyPending,
  } = useBuzzleApplyTemplate();
  const [lastReport, setLastReport] = useState<string | null>(null);

  const handleApply = async (workspaceId: string) => {
    setLastReport(null);
    const report = await applyTemplate(workspaceId, 'leads-google-ads');

    if (report) {
      const ok = report.steps.filter((s) => s.status === 'ok').length;
      const skipped = report.steps.filter((s) => s.status === 'skipped').length;
      const failed = report.steps.filter((s) => s.status === 'failed').length;

      setLastReport(
        `Template leads-google-ads → workspace ${report.workspaceId}\n` +
          `${ok} ok / ${skipped} skipped / ${failed} failed\n\n` +
          report.steps
            .map(
              (s) =>
                `[${s.status.padEnd(7)}] ${s.step}${s.detail ? ` — ${s.detail}` : ''}`,
            )
            .join('\n'),
      );
    }
  };

  const activeCount = workspaces.filter(
    (w) => w.activationStatus === 'ACTIVE',
  ).length;
  const totalUsers = workspaces.reduce((sum, w) => sum + w.totalUsers, 0);
  const createdThisMonth = workspaces.filter((w) => {
    const created = new Date(w.createdAt);
    const now = new Date();

    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <Container>
      <Header>
        <div>
          <Subtitle>Cockpit · Agence Buzzle</Subtitle>
          <Title>Mes workspaces clients</Title>
        </div>
        <CreateButton onClick={() => navigate('/buzzle-admin/new')}>
          + Nouveau workspace
        </CreateButton>
      </Header>

      {impersonateError && (
        <ImpersonateError>
          Ouverture workspace : {impersonateError.message}
        </ImpersonateError>
      )}

      {applyError && (
        <ImpersonateError>
          Application template : {applyError.message}
        </ImpersonateError>
      )}

      {lastReport && <ReportPanel>{lastReport}</ReportPanel>}

      {!error && !loading && workspaces.length > 0 && (
        <StatsBar>
          <StatCard>
            <StatLabel>Clients</StatLabel>
            <StatValue>{workspaces.length}</StatValue>
            <StatSub>{activeCount} actif{activeCount > 1 ? 's' : ''}</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Users cumulés</StatLabel>
            <StatValue>{totalUsers}</StatValue>
            <StatSub>tous workspaces confondus</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Nouveaux ce mois</StatLabel>
            <StatValue>{createdThisMonth}</StatValue>
            <StatSub>
              {createdThisMonth === 0 ? 'aucun encore' : 'workspace(s) créé(s)'}
            </StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Leads 30j</StatLabel>
            <StatValue>—</StatValue>
            <StatSub>agrégation à venir (V2)</StatSub>
          </StatCard>
        </StatsBar>
      )}

      {error && (
        <EmptyState>
          Erreur chargement workspaces: {error.message}
          <br />
          <button onClick={() => refetch()}>Réessayer</button>
        </EmptyState>
      )}

      {!error && !loading && workspaces.length === 0 && (
        <EmptyStateBig>
          <EmptyStateTitle>Aucun workspace client pour l'instant</EmptyStateTitle>
          <EmptyStateSub>
            Crée ton premier workspace client. Chaque workspace = un client Buzzle
            avec son propre sous-domaine et son pipeline de leads.
          </EmptyStateSub>
          <CreateButton onClick={() => navigate('/buzzle-admin/new')}>
            + Créer mon premier workspace
          </CreateButton>
        </EmptyStateBig>
      )}

      {!error && (loading || workspaces.length > 0) && (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Sous-domaine</Th>
              <Th>Statut</Th>
              <Th>Users</Th>
              <Th>Créé le</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {loading && workspaces.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <EmptyState>Chargement…</EmptyState>
                </Td>
              </tr>
            )}
            {workspaces.map((w) => (
              <tr key={w.id}>
                <Td>{w.displayName}</Td>
                <Td>
                  <a
                    href={`https://${w.subdomain}.crm.agence-buzzle.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {w.subdomain}
                  </a>
                </Td>
                <Td>
                  <Badge status={w.activationStatus}>{w.activationStatus}</Badge>
                </Td>
                <Td>{w.totalUsers}</Td>
                <Td>{new Date(w.createdAt).toLocaleDateString('fr-FR')}</Td>
                <Td>
                  <RowActions>
                    <ApplyButton
                      onClick={() => handleApply(w.id)}
                      disabled={applyPending !== null}
                      title="Applique le template leads-google-ads (crée Contact + fields + webhook OCT)"
                    >
                      {applyPending === w.id ? 'Application…' : 'Template'}
                    </ApplyButton>
                    <OpenButton
                      onClick={() => openWorkspace(w.id)}
                      disabled={pendingWorkspaceId !== null}
                    >
                      {pendingWorkspaceId === w.id ? 'Ouverture…' : 'Ouvrir →'}
                    </OpenButton>
                  </RowActions>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};
