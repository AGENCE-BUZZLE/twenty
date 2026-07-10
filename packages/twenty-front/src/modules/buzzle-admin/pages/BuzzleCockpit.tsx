import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useBuzzleApplyTemplate } from '@/buzzle-admin/hooks/useBuzzleApplyTemplate';
import { useBuzzleImpersonateWorkspace } from '@/buzzle-admin/hooks/useBuzzleImpersonateWorkspace';
import { useBuzzleWorkspaces } from '@/buzzle-admin/hooks/useBuzzleWorkspaces';

// Buzzle SuperAdmin Cockpit. Landing page for Clément when he logs into
// gestion.crm.agence-buzzle.com. Lists client workspaces with per-row
// stats, template-provisioning status, and quick actions (open + apply).
//
// Design language:
//   - Schemata palette (ink #14141c, paper #efede6, violet accent #5b4bff)
//   - Inter Tight for display, Inter for body, JetBrains Mono for labels
//   - Hairlines only (no shadows), radius 6/8px max
//   - Icons: inline SVG, never emoji or unicode symbols

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const AccentSoft = 'rgba(91, 75, 255, 0.08)';
const OkColor = '#187a4a';
const OkSoft = '#e3f4ea';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const DangerColor = '#c94a4a';
const DangerSoft = '#fbe5e5';

const Container = styled.div`
  padding: 40px 48px 80px;
  max-width: 1240px;
  margin: 0 auto;
  color: ${InkColor};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 40px;
`;

const Eyebrow = styled.div`
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 10px;
`;

const Title = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.024em;
  line-height: 1.1;
  margin: 0 0 6px;
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 14px;
  max-width: 540px;
  line-height: 1.55;
`;

const PrimaryButton = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 1px solid ${InkColor};
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.86;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  padding: 16px 18px;
  border: 1px solid ${HairlineColor};
  border-radius: 8px;
  background: ${SurfaceColor};
`;

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 10px;
`;

const StatValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.024em;
  line-height: 1;
  color: ${InkColor};
`;

const StatValueEmpty = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${MutedColor};
  font-family: 'Inter Tight', sans-serif;
  font-size: 15px;
`;

const StatSub = styled.div`
  font-size: 11.5px;
  color: ${MutedColor};
  margin-top: 6px;
`;

const TableWrap = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 8px;
  background: ${SurfaceColor};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 18px;
  border-bottom: 1px solid ${HairlineColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  font-weight: 500;
  background: ${PaperColor};
`;

const Td = styled.td`
  padding: 16px 18px;
  border-bottom: 1px solid ${HairlineColor};
  font-size: 13.5px;
  vertical-align: middle;
  &:last-child {
    border-bottom: 0;
  }
`;

const TableRow = styled.tr`
  &:last-child ${Td} {
    border-bottom: 0;
  }
  &:hover ${Td} {
    background: rgba(239, 237, 230, 0.4);
  }
`;

const NameCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NameMain = styled.div`
  font-weight: 500;
  color: ${InkColor};
`;

const SubdomainLink = styled.a`
  color: ${MutedColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  text-decoration: none;
  &:hover {
    color: ${AccentColor};
  }
`;

const Chip = styled.span<{ tone: 'ok' | 'idle' | 'danger' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
  border: 1px solid transparent;
  background: ${PaperColor};
  color: ${InkColor};
`;

const ChipOk = styled(Chip)`
  background: ${OkSoft};
  color: ${OkColor};
`;

const ChipDanger = styled(Chip)`
  background: ${DangerSoft};
  color: ${DangerColor};
`;

const RowActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const IconButton = styled.button`
  background: transparent;
  color: ${InkColor};
  border: 1px solid ${HairlineColor};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.12s;
  &:hover {
    background: ${PaperColor};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const AccentIconButton = styled(IconButton)`
  color: ${AccentColor};
  border-color: ${AccentColor};
  &:hover {
    background: ${AccentSoft};
  }
`;

const EmptyStateBig = styled.div`
  text-align: center;
  padding: 80px 24px;
  border: 1px dashed ${HairlineColor};
  border-radius: 12px;
  background: ${PaperColor};
`;

const EmptyStateTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
  color: ${InkColor};
`;

const EmptyStateSub = styled.div`
  font-size: 14px;
  color: ${MutedColor};
  margin: 0 auto 26px;
  max-width: 440px;
  line-height: 1.6;
`;

const EmptyStateRow = styled.div`
  text-align: center;
  padding: 60px 0;
  color: ${MutedColor};
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  border: 1px solid ${DangerColor};
  background: ${DangerSoft};
  color: #5a1010;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ReportPanel = styled.div`
  padding: 16px 18px;
  border: 1px solid ${HairlineColor};
  background: ${SurfaceColor};
  border-radius: 8px;
  margin-bottom: 24px;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ReportTitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const ReportCounters = styled.div`
  display: flex;
  gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
`;

const CounterOk = styled.span`
  color: ${OkColor};
`;

const CounterSkip = styled.span`
  color: ${MutedColor};
`;

const CounterFail = styled.span`
  color: ${DangerColor};
`;

const ReportBody = styled.pre`
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.55;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: 12px;
  border: 1px solid ${HairlineColor};
  border-radius: 6px;
  background: ${PaperColor};
  color: ${InkColor};
  white-space: pre-wrap;
`;

const CloseReport = styled.button`
  background: transparent;
  border: 0;
  cursor: pointer;
  color: ${MutedColor};
  padding: 2px;
  display: inline-flex;
  &:hover {
    color: ${InkColor};
  }
`;

// SVG icons: inline so we control exact stroke width and sizing, no
// dependency on any icon package for these one-off cockpit affordances.
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconEmptyDot = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconWorkspace = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconOpen = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </svg>
);

const IconTemplate = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 9v12" />
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

type ReportState = {
  ok: number;
  skipped: number;
  failed: number;
  body: string;
  workspaceName: string;
} | null;

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
  const [report, setReport] = useState<ReportState>(null);

  const handleApply = async (workspaceId: string, workspaceName: string) => {
    setReport(null);
    const result = await applyTemplate(workspaceId, 'leads-google-ads');
    if (!result) return;
    const ok = result.steps.filter((s) => s.status === 'ok').length;
    const skipped = result.steps.filter((s) => s.status === 'skipped').length;
    const failed = result.steps.filter((s) => s.status === 'failed').length;
    const body = result.steps
      .map((s) => {
        const badge = `[${s.status.padEnd(7)}]`;
        const detail = s.detail ? `  ${s.detail}` : '';
        return `${badge} ${s.step}${detail}`;
      })
      .join('\n');
    setReport({ ok, skipped, failed, body, workspaceName });
    refetch();
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
  const templatedCount = workspaces.filter(
    (w) => w.hasContactObject === true,
  ).length;

  return (
    <Container>
      <Header>
        <div>
          <Eyebrow>Cockpit · Agence Buzzle</Eyebrow>
          <Title>Mes workspaces clients</Title>
          <Lede>
            Chaque workspace correspond à un client. Le template
            leads-google-ads provisionne l'objet Contact et le webhook OCT
            en un clic.
          </Lede>
        </div>
        <PrimaryButton onClick={() => navigate('/buzzle-admin/new')}>
          <IconPlus /> Nouveau workspace
        </PrimaryButton>
      </Header>

      {impersonateError && (
        <ErrorBanner>
          <IconAlert /> Ouverture workspace impossible : {impersonateError.message}
        </ErrorBanner>
      )}

      {applyError && (
        <ErrorBanner>
          <IconAlert /> Application du template impossible : {applyError.message}
        </ErrorBanner>
      )}

      {report && (
        <ReportPanel>
          <ReportHeader>
            <ReportTitle>Template appliqué sur {report.workspaceName}</ReportTitle>
            <ReportCounters>
              <CounterOk>{report.ok} ok</CounterOk>
              <CounterSkip>{report.skipped} skipped</CounterSkip>
              <CounterFail>{report.failed} failed</CounterFail>
              <CloseReport
                onClick={() => setReport(null)}
                aria-label="Fermer le rapport"
              >
                <IconClose />
              </CloseReport>
            </ReportCounters>
          </ReportHeader>
          <ReportBody>{report.body}</ReportBody>
        </ReportPanel>
      )}

      {!error && !loading && workspaces.length > 0 && (
        <StatsBar>
          <StatCard>
            <StatLabel>Clients</StatLabel>
            <StatValue>{workspaces.length}</StatValue>
            <StatSub>
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Users cumulés</StatLabel>
            <StatValue>{totalUsers}</StatValue>
            <StatSub>tous workspaces confondus</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Templatés</StatLabel>
            <StatValue>
              {templatedCount}
              <span
                style={{
                  fontSize: '15px',
                  color: MutedColor,
                  marginLeft: 6,
                }}
              >
                / {workspaces.length}
              </span>
            </StatValue>
            <StatSub>Contact object provisionné</StatSub>
          </StatCard>
          <StatCard>
            <StatLabel>Nouveaux ce mois</StatLabel>
            <StatValue>{createdThisMonth}</StatValue>
            <StatSub>
              {createdThisMonth === 0
                ? 'aucun encore'
                : 'workspace(s) créé(s)'}
            </StatSub>
          </StatCard>
        </StatsBar>
      )}

      {error && (
        <ErrorBanner>
          <IconAlert /> Erreur chargement workspaces : {error.message}
          <IconButton style={{ marginLeft: 'auto' }} onClick={() => refetch()}>
            Réessayer
          </IconButton>
        </ErrorBanner>
      )}

      {!error && !loading && workspaces.length === 0 && (
        <EmptyStateBig>
          <EmptyStateTitle>Aucun workspace client pour l'instant</EmptyStateTitle>
          <EmptyStateSub>
            Chaque workspace correspond à un client Buzzle avec son propre
            sous-domaine et son pipeline de leads. Crée le premier pour
            démarrer.
          </EmptyStateSub>
          <PrimaryButton onClick={() => navigate('/buzzle-admin/new')}>
            <IconPlus /> Créer mon premier workspace
          </PrimaryButton>
        </EmptyStateBig>
      )}

      {!error && (loading || workspaces.length > 0) && (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Nom</Th>
                <Th>Statut</Th>
                <Th>Template</Th>
                <Th>Users</Th>
                <Th>Créé le</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {loading && workspaces.length === 0 && (
                <tr>
                  <Td colSpan={6}>
                    <EmptyStateRow>Chargement des workspaces…</EmptyStateRow>
                  </Td>
                </tr>
              )}
              {workspaces.map((w) => (
                <TableRow key={w.id}>
                  <Td>
                    <NameCell>
                      <NameMain>{w.displayName}</NameMain>
                      <SubdomainLink
                        href={`https://${w.subdomain}.crm.agence-buzzle.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {w.subdomain}.crm.agence-buzzle.com
                      </SubdomainLink>
                    </NameCell>
                  </Td>
                  <Td>
                    {w.activationStatus === 'ACTIVE' ? (
                      <ChipOk tone="ok">
                        <IconCheck /> Active
                      </ChipOk>
                    ) : (
                      <Chip tone="neutral">{w.activationStatus.toLowerCase()}</Chip>
                    )}
                  </Td>
                  <Td>
                    {w.hasContactObject === true ? (
                      <ChipOk tone="ok">
                        <IconCheck /> Contact
                      </ChipOk>
                    ) : (
                      <Chip tone="idle">
                        <IconEmptyDot /> Vide
                      </Chip>
                    )}
                  </Td>
                  <Td>{w.totalUsers}</Td>
                  <Td style={{ color: MutedColor }}>
                    {formatDate(String(w.createdAt))}
                  </Td>
                  <Td>
                    <RowActions>
                      <AccentIconButton
                        onClick={() => handleApply(w.id, w.displayName)}
                        disabled={applyPending !== null}
                        title={
                          w.hasContactObject === true
                            ? 'Réapplique le template (idempotent : les objets/fields existants sont skippés)'
                            : 'Applique le template leads-google-ads'
                        }
                      >
                        <IconTemplate />
                        {applyPending === w.id
                          ? 'Application…'
                          : w.hasContactObject === true
                            ? 'Réappliquer'
                            : 'Appliquer template'}
                      </AccentIconButton>
                      <IconButton
                        onClick={() => openWorkspace(w.id)}
                        disabled={pendingWorkspaceId !== null}
                      >
                        <IconOpen />
                        {pendingWorkspaceId === w.id ? 'Ouverture…' : 'Ouvrir'}
                      </IconButton>
                    </RowActions>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </Container>
  );
};
