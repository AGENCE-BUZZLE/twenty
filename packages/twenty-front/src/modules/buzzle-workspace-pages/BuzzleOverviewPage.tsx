import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle workspace overview.
// Two-column dashboard : a violet "Solde à régler" card on the left backed
// by the Zoho invoices query, and an Ink activity strip on the right with
// per-object counters (Contacts, Appels). Period filter and workflow menu
// live in the header.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const VioletColor = '#7e37fe';
const VioletTint = 'rgba(126, 55, 254, 0.16)';

type Invoice = {
  id: string;
  number: string;
  date: string;
  dueDate?: string | null;
  total: number;
  balance: number;
  currency: string;
  status: string;
};

type WorkflowRecord = {
  id: string;
  name?: string | null;
  statuses?: string[] | null;
};

const MY_WORKSPACE_INVOICES = gql`
  query DashboardInvoices {
    myWorkspaceInvoices {
      id
      number
      date
      dueDate
      total
      balance
      currency
      status
    }
  }
`;

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 48px 48px 60px;
  color: ${InkColor};
  overflow-y: auto;
  > * {
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 24px;
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.028em;
  color: ${InkColor};
  margin: 0 0 12px;
`;

const HeaderSub = styled.div`
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.55;
  max-width: 640px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
`;

const WorkflowTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid ${InkColor};
  background: ${SurfaceColor};
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
  }
`;

const WorkflowMenu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 260px;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.14);
  z-index: 30;
`;

const WorkflowMenuHead = styled.div`
  padding: 8px 10px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const WorkflowItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const WorkflowIconChip = styled.span`
  display: inline-flex;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: ${VioletTint};
  color: ${VioletColor};
  align-items: center;
  justify-content: center;
`;

const WorkflowAddItem = styled(WorkflowItem)`
  border-top: 1px solid ${HairlineColor};
  margin-top: 6px;
  padding-top: 14px;
  color: ${InkColor};
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VioletCard = styled.div`
  background: ${VioletColor};
  color: #ffffff;
  border-radius: 20px;
  padding: 26px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 380px;
  position: relative;
  overflow: hidden;
`;

const VioletHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const VioletEyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
`;

const VioletTrend = styled.span<{ tone: 'up' | 'down' | 'flat' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.16);
  color: ${({ tone }) =>
    tone === 'down' ? '#ffdada' : tone === 'up' ? '#e8ffe1' : '#ffffff'};
`;

const VioletStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
`;

const VioletStatValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
`;

const VioletStatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 6px;
`;

const VioletBalanceLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 6px;
`;

const VioletBalanceValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 44px;
  font-weight: 500;
  letter-spacing: -0.024em;
  line-height: 1.05;
`;

const VioletBalanceSub = styled.div`
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const CtaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
`;

const CtaPrimary = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 0;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  &:hover {
    opacity: 0.88;
  }
`;

const CtaSecondary = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: ${SurfaceColor};
  border: 1px solid rgba(255, 255, 255, 0.24);
  padding: 10px 16px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
`;

const PeriodRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 4px;
  margin-top: 16px;
`;

const PeriodPill = styled.button<{ active?: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  border: 0;
  background: ${({ active }) => (active ? SurfaceColor : 'transparent')};
  color: ${({ active }) => (active ? InkColor : SurfaceColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? SurfaceColor : 'rgba(255,255,255,0.14)')};
  }
`;

const CustomDate = styled.input`
  background: transparent;
  border: 0;
  color: ${SurfaceColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 4px 6px;
  color-scheme: dark;
  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
`;

const DarkCard = styled.div`
  background: ${InkColor};
  color: ${SurfaceColor};
  border-radius: 20px;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 380px;
`;

const DarkCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const DarkCardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 18px;
  font-weight: 500;
`;

const DarkCardSub = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin-top: 4px;
`;

const GoToLink = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: ${SurfaceColor};
  padding: 8px 14px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const AssetCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AssetHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AssetIcon = styled.span<{ tint: string; color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ tint }) => tint};
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const AssetName = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 15px;
  font-weight: 500;
`;

const AssetType = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.55);
`;

const AssetValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const AssetSub = styled.div<{ tone?: 'up' | 'down' | 'flat' }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: ${({ tone }) =>
    tone === 'down'
      ? '#ffb0b0'
      : tone === 'up'
        ? '#c6f1c1'
        : 'rgba(255,255,255,0.6)'};
`;

const DistributionRow = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
`;

const DistributionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const DistributionLabel = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 14px;
`;

const DistributionSub = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
`;

const DistributionBar = styled.div`
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  display: flex;
`;

const DistributionSeg = styled.div<{ pct: number; color: string }>`
  flex: 0 0 ${({ pct }) => `${pct}%`};
  background: ${({ color }) => color};
`;

const DistributionLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
`;

const LegendDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

const IconArrowUp = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 11 12 6 7 11" />
    <line x1="12" y1="18" x2="12" y2="6" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconWorkflow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5" cy="6" r="2.2" />
    <circle cx="19" cy="6" r="2.2" />
    <circle cx="12" cy="18" r="2.2" />
    <path d="M6.8 7.6 10.4 16" />
    <path d="M17.2 7.6 13.6 16" />
    <path d="M7 6h10" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const formatEuro = (amount: number): string => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
};

const formatShortDate = (raw?: string | null): string => {
  if (!raw) return '';

  try {
    return new Date(raw).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const monthLabel = (): string => {
  return new Date()
    .toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' })
    .toUpperCase();
};

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleOverviewPage = () => {
  const navigate = useNavigate();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const displayName = currentUser?.firstName ?? '';
  const workspaceName = currentWorkspace?.displayName ?? 'votre workspace';

  const apolloCoreClient = useApolloCoreClient();

  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const contactObject = findActiveObjectMetadataItemByNamePlural('contacts');
  const workflowObject = findActiveObjectMetadataItemByNamePlural('workflows');

  const { records: contactRecords } = useFindManyRecords({
    objectNameSingular: 'contact',
    skip: !contactObject,
    limit: 200,
  });

  const { records: workflowRecords } = useFindManyRecords({
    objectNameSingular: 'workflow',
    skip: !workflowObject,
    limit: 20,
  });

  const { data: invoicesData } = useQuery<{ myWorkspaceInvoices: Invoice[] }>(
    MY_WORKSPACE_INVOICES,
    { client: apolloCoreClient, fetchPolicy: 'cache-and-network' },
  );
  const invoices = invoicesData?.myWorkspaceInvoices ?? [];

  const pendingBalance = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((s, i) => s + i.balance, 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const lastOverdue = overdueInvoices
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const pendingCount = totalInvoices - paidCount;

  const contacts = contactRecords ?? [];
  const contactTotal = contacts.length;
  const contactByStatus = useMemo(() => {
    const buckets: Record<string, number> = {
      NEW: 0,
      QUOTED: 0,
      VALIDATED: 0,
      CANCELLED: 0,
    };
    for (const c of contacts) {
      const s = typeof c.status === 'string' ? c.status : 'NEW';

      if (buckets[s] !== undefined) buckets[s] += 1;
    }

    return buckets;
  }, [contacts]);
  const contactNewCount = contactByStatus.NEW;
  const contactValidatedCount = contactByStatus.VALIDATED;

  // Calls are still mocked (waiting on a real provider) — mirror the count
  // that BuzzleCallsPage displays so the dashboard stays in sync.
  const MOCK_CALLS_TOTAL = 4;
  const MOCK_CALLS_QUALIFIED = 1;

  const [period, setPeriod] = useState<Period>('week');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();

    return d.toISOString().slice(0, 10);
  });

  const [workflowOpen, setWorkflowOpen] = useState(false);
  const workflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workflowOpen) return;
    const handler = (event: MouseEvent) => {
      if (
        workflowRef.current &&
        !workflowRef.current.contains(event.target as Node)
      ) {
        setWorkflowOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [workflowOpen]);

  const workflows: WorkflowRecord[] = (workflowRecords ?? []) as WorkflowRecord[];

  const totalContactsForBar = Math.max(1, contactTotal);
  const seg = (label: string, count: number, color: string) => ({
    label,
    count,
    pct: (count / totalContactsForBar) * 100,
    color,
  });
  const distribution = [
    seg('Nouveaux', contactByStatus.NEW, '#f2b400'),
    seg('Devis envoyés', contactByStatus.QUOTED, VioletColor),
    seg('Validés', contactByStatus.VALIDATED, '#22b972'),
    seg('Annulés', contactByStatus.CANCELLED, '#8a8b91'),
  ];

  const overdueTrend = overdueInvoices.length > 0 ? 'down' : 'up';
  const overdueSummary =
    overdueInvoices.length > 0
      ? `${overdueInvoices.length} en retard`
      : 'À jour';

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Espace · Vue d'ensemble</PageTitle>
          <HeaderSub>
            Bonjour{displayName ? ` ${displayName}` : ''}, voici votre espace{' '}
            <b>{workspaceName}</b>. Suivez ici votre solde à régler, votre
            activité leads et vos appels qualifiés.
          </HeaderSub>
        </HeaderText>
        <HeaderActions ref={workflowRef}>
          <WorkflowTrigger
            onClick={() => setWorkflowOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={workflowOpen}
          >
            <IconWorkflow /> Workflows
          </WorkflowTrigger>
          {workflowOpen && (
            <WorkflowMenu role="menu">
              <WorkflowMenuHead>Vos automatisations</WorkflowMenuHead>
              {workflows.length === 0 && (
                <WorkflowItem
                  onClick={() => {
                    setWorkflowOpen(false);
                    navigate('/objects/workflows');
                  }}
                >
                  <WorkflowIconChip>
                    <IconWorkflow />
                  </WorkflowIconChip>
                  <div>
                    Aucun workflow pour le moment
                    <div style={{ color: MutedColor, fontSize: 11.5 }}>
                      Créez-en un pour automatiser vos actions.
                    </div>
                  </div>
                </WorkflowItem>
              )}
              {workflows.slice(0, 6).map((wf) => (
                <WorkflowItem
                  key={wf.id}
                  onClick={() => {
                    setWorkflowOpen(false);
                    navigate(`/object/workflow/${wf.id}`);
                  }}
                >
                  <WorkflowIconChip>
                    <IconWorkflow />
                  </WorkflowIconChip>
                  <div>{wf.name || 'Workflow sans nom'}</div>
                </WorkflowItem>
              ))}
              <WorkflowAddItem
                onClick={() => {
                  setWorkflowOpen(false);
                  navigate('/objects/workflows');
                }}
              >
                <WorkflowIconChip>
                  <IconPlus />
                </WorkflowIconChip>
                Ajouter un workflow
              </WorkflowAddItem>
            </WorkflowMenu>
          )}
        </HeaderActions>
      </HeaderRow>

      <Grid>
        <VioletCard>
          <VioletHead>
            <div>
              <VioletEyebrow>Overview · {monthLabel()}</VioletEyebrow>
            </div>
            <VioletTrend tone={overdueTrend}>
              <IconArrowUp /> {overdueSummary}
            </VioletTrend>
          </VioletHead>

          <VioletStats>
            <div>
              <VioletStatValue>{totalInvoices}</VioletStatValue>
              <VioletStatLabel>Factures</VioletStatLabel>
            </div>
            <div>
              <VioletStatValue>{pendingCount}</VioletStatValue>
              <VioletStatLabel>En attente</VioletStatLabel>
            </div>
          </VioletStats>

          <div>
            <VioletBalanceLabel>Solde à régler</VioletBalanceLabel>
            <VioletBalanceValue>{formatEuro(pendingBalance)}</VioletBalanceValue>
            {lastOverdue ? (
              <VioletBalanceSub>
                Dernière en retard · <b>{lastOverdue.number}</b> émise le{' '}
                {formatShortDate(lastOverdue.date)}
              </VioletBalanceSub>
            ) : pendingCount > 0 ? (
              <VioletBalanceSub>
                {pendingCount} facture{pendingCount > 1 ? 's' : ''} en attente de règlement
              </VioletBalanceSub>
            ) : (
              <VioletBalanceSub>Aucune facture en retard, tout est à jour.</VioletBalanceSub>
            )}
          </div>

          <CtaRow>
            <CtaPrimary onClick={() => navigate('/invoices')}>
              Voir les factures <IconArrowRight />
            </CtaPrimary>
            <CtaSecondary onClick={() => navigate('/contacts')}>
              Contacts
            </CtaSecondary>
          </CtaRow>

          <PeriodRow>
            <PeriodPill
              active={period === 'today'}
              onClick={() => setPeriod('today')}
            >
              Aujourd'hui
            </PeriodPill>
            <PeriodPill
              active={period === 'week'}
              onClick={() => setPeriod('week')}
            >
              Cette semaine
            </PeriodPill>
            <PeriodPill
              active={period === 'month'}
              onClick={() => setPeriod('month')}
            >
              Ce mois-ci
            </PeriodPill>
            <PeriodPill
              active={period === 'custom'}
              onClick={() => setPeriod('custom')}
            >
              Personnaliser
              {period === 'custom' && (
                <CustomDate
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </PeriodPill>
          </PeriodRow>
        </VioletCard>

        <DarkCard>
          <DarkCardHead>
            <div>
              <DarkCardTitle>Mon activité</DarkCardTitle>
              <DarkCardSub>
                {contactTotal + MOCK_CALLS_TOTAL} entrées · actualisé à
                l'instant
              </DarkCardSub>
            </div>
            <GoToLink onClick={() => navigate('/contacts')}>
              Voir tout <IconArrowRight />
            </GoToLink>
          </DarkCardHead>

          <AssetGrid>
            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(126, 55, 254, 0.28)" color="#c9b7ff">
                  <IconUsers />
                </AssetIcon>
                <div>
                  <AssetName>Contacts</AssetName>
                  <AssetType>LEADS</AssetType>
                </div>
              </AssetHead>
              <div>
                <AssetValue>{contactTotal}</AssetValue>
                <AssetSub tone={contactNewCount > 0 ? 'up' : 'flat'}>
                  {contactNewCount > 0
                    ? `+${contactNewCount} nouveaux · ${contactValidatedCount} validés`
                    : `${contactValidatedCount} validés`}
                </AssetSub>
              </div>
            </AssetCard>

            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(34, 185, 114, 0.24)" color="#a7f4c9">
                  <IconPhone />
                </AssetIcon>
                <div>
                  <AssetName>Appels</AssetName>
                  <AssetType>QUALIFIES</AssetType>
                </div>
              </AssetHead>
              <div>
                <AssetValue>{MOCK_CALLS_TOTAL}</AssetValue>
                <AssetSub tone={MOCK_CALLS_QUALIFIED > 0 ? 'up' : 'flat'}>
                  {MOCK_CALLS_QUALIFIED > 0
                    ? `${MOCK_CALLS_QUALIFIED} qualifié${MOCK_CALLS_QUALIFIED > 1 ? 's' : ''}`
                    : 'aucun qualifié'}
                </AssetSub>
              </div>
            </AssetCard>
          </AssetGrid>

          <DistributionRow>
            <DistributionHead>
              <DistributionLabel>Répartition des leads</DistributionLabel>
              <DistributionSub>Par statut</DistributionSub>
            </DistributionHead>
            <DistributionBar>
              {distribution.map((d) => (
                <DistributionSeg key={d.label} pct={d.pct} color={d.color} />
              ))}
            </DistributionBar>
            <DistributionLegend>
              {distribution.map((d) => (
                <LegendItem key={d.label}>
                  <LegendDot color={d.color} /> {d.label} · {d.count}
                </LegendItem>
              ))}
            </DistributionLegend>
          </DistributionRow>
        </DarkCard>
      </Grid>
    </Container>
  );
};
