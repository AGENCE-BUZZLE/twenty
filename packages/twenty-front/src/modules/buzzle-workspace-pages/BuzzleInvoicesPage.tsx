import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { getTokenPair } from '@/apollo/utils/getTokenPair';

const PAGE_SIZE = 10;

// Real /invoices page: pulls Zoho-backed invoices for the current workspace
// through the myWorkspaceInvoices query, laid out in the same visual system
// as the Vue d'ensemble dashboard: compact header with the period strip
// and workspace switcher, a violet "Solde à régler" card, an Ink activity
// card, and the table wrapped in a light surface underneath.

const InkColor = '#14141c';
const HairlineColor = '#d6d2c7';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const VioletColor = '#7e37fe';

const MY_WORKSPACE_INVOICES = gql`
  query MyWorkspaceInvoices {
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

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 28px 40px 32px;
  color: ${InkColor};
  background: #efede6;
  overflow-y: auto;
  > * {
    max-width: 1320px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 20px;
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: ${InkColor};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const HeaderPeriodStrip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 999px;
  padding: 4px;
`;

const HeaderPeriodPill = styled.button<{ active?: boolean }>`
  padding: 7px 14px;
  border-radius: 999px;
  border: 0;
  background: ${({ active }) => (active ? InkColor : 'transparent')};
  color: ${({ active }) => (active ? SurfaceColor : InkColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover:not(:disabled) {
    background: ${({ active }) =>
      active ? InkColor : 'rgba(20, 20, 28, 0.06)'};
  }
`;

const CustomWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const CustomPopover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.16);
  padding: 14px 16px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 260px;
`;

const CustomPopoverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CustomPopoverLabel = styled.label`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  width: 32px;
`;

const CustomPopoverInput = styled.input`
  flex: 1 1 auto;
  padding: 8px 10px;
  border: 1px solid rgba(20, 20, 28, 0.14);
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: ${InkColor};
  background: ${SurfaceColor};
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const CustomPopoverActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
`;

const CustomPopoverButton = styled.button<{ primary?: boolean }>`
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid ${InkColor};
  background: ${({ primary }) => (primary ? InkColor : 'transparent')};
  color: ${({ primary }) => (primary ? SurfaceColor : InkColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VioletCard = styled.div`
  background: ${VioletColor};
  color: #ffffff;
  border-radius: 18px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  height: 260px;
`;

const VioletHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
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
  font-size: 34px;
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

const DarkCard = styled.div`
  background: ${InkColor};
  color: ${SurfaceColor};
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 260px;
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

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
`;

const AssetCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  height: 100%;
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

const AssetValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

// ---------- Table ----------

const Table = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
  overflow: hidden;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr 90px;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid ${InkColor};
  background: ${InkColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr 90px;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: 1px solid ${HairlineColor};
  align-items: center;
  font-size: 13.5px;
  &:last-child {
    border-bottom: 0;
  }
`;

const InvoiceNumber = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  color: ${InkColor};
`;

const Amount = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-weight: 500;
`;

const StatusPill = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const EmptyState = styled.div`
  padding: 60px 22px;
  text-align: center;
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.6;
`;

const DownloadCell = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const DownloadButton = styled.button`
  background: transparent;
  color: ${InkColor};
  border: 1px solid ${HairlineColor};
  padding: 7px 9px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: ${InkColor};
    border-color: ${InkColor};
    color: ${SurfaceColor};
  }
  &:disabled {
    opacity: 0.4;
    cursor: wait;
  }
`;

const IconDownload = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconSpin = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ animation: 'buzzleBtnSpin 0.9s linear infinite' }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconArrowUp = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="17 11 12 6 7 11" />
    <line x1="12" y1="18" x2="12" y2="6" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconWallet = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconClock = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// 4-circle spinner shown alone while the Zoho fetch is in flight, so the
// user does not see empty header rows and stale skeletons.
const LoaderStage = styled.div`
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
`;

const Loader = styled.div`
  --dim: 3rem;
  width: var(--dim);
  height: var(--dim);
  position: relative;
  animation: buzzleInvoiceSpin 2s linear infinite;

  .circle {
    --dim: 1.2rem;
    width: var(--dim);
    height: var(--dim);
    background-color: ${InkColor};
    border-radius: 50%;
    position: absolute;
  }
  .circle:nth-child(1) { top: 0; left: 0; }
  .circle:nth-child(2) { top: 0; right: 0; }
  .circle:nth-child(3) { bottom: 0; left: 0; }
  .circle:nth-child(4) { bottom: 0; right: 0; }

  @keyframes buzzleInvoiceSpin {
    0% { transform: scale(1) rotate(0); }
    20%, 25% { transform: scale(1.3) rotate(90deg); }
    45%, 50% { transform: scale(1) rotate(180deg); }
    70%, 75% { transform: scale(1.3) rotate(270deg); }
    95%, 100% { transform: scale(1) rotate(360deg); }
  }
`;

const ErrorBanner = styled.div`
  padding: 18px 22px;
  border-radius: 12px;
  border: 1px solid #c94a4a;
  background: #fbe5e5;
  color: #5a1010;
  font-size: 13px;
  margin-bottom: 24px;
`;

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  paid: { label: 'Payée', bg: '#e3f4ea', fg: '#187a4a' },
  sent: { label: 'Envoyée', bg: '#e3ecff', fg: '#1a3fb0' },
  viewed: { label: 'Vue', bg: '#e3ecff', fg: '#1a3fb0' },
  overdue: { label: 'En retard', bg: '#fbe5e5', fg: '#8a1a1a' },
  draft: { label: 'Brouillon', bg: '#efede6', fg: '#5a5540' },
  partially_paid: { label: 'Partielle', bg: '#fff2d6', fg: '#7a5a10' },
  void: { label: 'Annulée', bg: '#efede6', fg: '#5a5540' },
};

const formatCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const formatDate = (raw: string | null | undefined): string => {
  if (!raw) return '.';

  try {
    const d = new Date(raw);

    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return raw;
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

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleInvoicesPage = () => {
  const navigate = useNavigate();
  const apolloCoreClient = useApolloCoreClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<{ myWorkspaceInvoices: Invoice[] }>(
    MY_WORKSPACE_INVOICES,
    { client: apolloCoreClient, fetchPolicy: 'cache-and-network' },
  );

  // Period filter: mirrors the Vue d'ensemble page so the same 4-pill
  // header (Aujourd'hui / Cette semaine / Ce mois-ci / Période à définir)
  // narrows the invoice list, summary values, and CTA copy.
  const [period, setPeriod] = useState<Period>('month');
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const weekAgoIso = () => {
    const d = new Date();

    d.setDate(d.getDate() - 29);

    return d.toISOString().slice(0, 10);
  };
  const [customStart, setCustomStart] = useState<string>(weekAgoIso);
  const [customEnd, setCustomEnd] = useState<string>(todayIso);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const customPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customPickerOpen) return;
    const handler = (event: MouseEvent) => {
      if (
        customPickerRef.current &&
        !customPickerRef.current.contains(event.target as Node)
      ) {
        setCustomPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [customPickerOpen]);

  const periodRange = useMemo(() => {
    const now = new Date();

    if (period === 'today') {
      const start = new Date(now);

      start.setHours(0, 0, 0, 0);

      return { start: start.getTime(), end: now.getTime() };
    }
    if (period === 'week') {
      const dow = now.getDay();
      const daysFromMonday = (dow + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday.getTime(), end: sunday.getTime() };
    }
    if (period === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const last = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return { start: first.getTime(), end: last.getTime() };
    }
    const start = customStart ? new Date(customStart) : new Date();

    start.setHours(0, 0, 0, 0);
    const end = customEnd ? new Date(customEnd) : new Date();

    end.setHours(23, 59, 59, 999);

    if (end.getTime() < start.getTime()) {
      return { start: end.getTime(), end: start.getTime() };
    }

    return { start: start.getTime(), end: end.getTime() };
  }, [period, customStart, customEnd]);

  const inRange = (iso?: string | null): boolean => {
    if (!iso) return false;
    const ts = new Date(iso).getTime();

    if (Number.isNaN(ts)) return false;

    return ts >= periodRange.start && ts <= periodRange.end;
  };

  const allInvoices = data?.myWorkspaceInvoices ?? [];
  // Unpaid invoices stay visible even when they fall outside the active
  // period, so nothing outstanding gets hidden behind a date filter. The
  // period only narrows the paid / void history around them.
  const isUnpaid = (i: Invoice) => i.status !== 'paid' && i.status !== 'void';
  const invoices = useMemo(
    () => allInvoices.filter((i) => isUnpaid(i) || inRange(i.date)),
    [allInvoices, periodRange],
  );

  const handleDownload = async (invoice: Invoice) => {
    if (downloadingId) return;
    setDownloadingId(invoice.id);
    try {
      const tokenPair = getTokenPair();
      const token = tokenPair?.accessOrWorkspaceAgnosticToken?.token;
      const res = await fetch(
        `${REACT_APP_SERVER_BASE_URL}/rest/buzzle/invoices/${invoice.id}/pdf`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Invoice download failed', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const pagedInvoices = useMemo(
    () => invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [invoices, page],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));

    if (page > totalPages) setPage(totalPages);
  }, [invoices.length, page]);

  useEffect(() => {
    setPage(1);
  }, [period, customStart, customEnd]);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0);

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

  const currency = allInvoices[0]?.currency ?? 'EUR';

  const overdueTrend = overdueInvoices.length > 0 ? 'down' : 'up';
  const overdueSummary =
    overdueInvoices.length > 0
      ? `${overdueInvoices.length} en retard`
      : 'À jour';

  // First-load state: nothing to display yet. Show only the animated
  // loader so the summary cards and the empty header rows don't flash.
  if (loading && !data && !error) {
    return (
      <Container>
        <LoaderStage>
          <Loader>
            <span className="circle" />
            <span className="circle" />
            <span className="circle" />
            <span className="circle" />
          </Loader>
        </LoaderStage>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Factures</PageTitle>
        </HeaderText>
        <HeaderActions>
          <HeaderPeriodStrip role="tablist" aria-label="Période active">
            <HeaderPeriodPill
              active={period === 'today'}
              onClick={() => setPeriod('today')}
            >
              Aujourd'hui
            </HeaderPeriodPill>
            <HeaderPeriodPill
              active={period === 'week'}
              onClick={() => setPeriod('week')}
            >
              Cette semaine
            </HeaderPeriodPill>
            <HeaderPeriodPill
              active={period === 'month'}
              onClick={() => setPeriod('month')}
            >
              Ce mois-ci
            </HeaderPeriodPill>
            <CustomWrap ref={customPickerRef}>
              <HeaderPeriodPill
                active={period === 'custom'}
                onClick={() => {
                  setPeriod('custom');
                  setCustomPickerOpen((prev) => !prev);
                }}
              >
                {period === 'custom' && customStart && customEnd
                  ? `${formatShortDate(customStart)} → ${formatShortDate(customEnd)}`
                  : 'Période à définir'}
              </HeaderPeriodPill>
              {customPickerOpen && (
                <CustomPopover onClick={(e) => e.stopPropagation()}>
                  <CustomPopoverRow>
                    <CustomPopoverLabel htmlFor="buzzle-invoice-range-start">
                      Du
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-invoice-range-start"
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </CustomPopoverRow>
                  <CustomPopoverRow>
                    <CustomPopoverLabel htmlFor="buzzle-invoice-range-end">
                      Au
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-invoice-range-end"
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </CustomPopoverRow>
                  <CustomPopoverActions>
                    <CustomPopoverButton
                      onClick={() => setCustomPickerOpen(false)}
                    >
                      Fermer
                    </CustomPopoverButton>
                    <CustomPopoverButton
                      primary
                      onClick={() => setCustomPickerOpen(false)}
                    >
                      Appliquer
                    </CustomPopoverButton>
                  </CustomPopoverActions>
                </CustomPopover>
              )}
            </CustomWrap>
          </HeaderPeriodStrip>
          <BuzzleWorkspacesButton />
        </HeaderActions>
      </HeaderRow>

      {error && (
        <ErrorBanner>
          Impossible de charger les factures pour le moment. Réessayez dans
          quelques instants ou contactez contact@agence-buzzle.com.
        </ErrorBanner>
      )}

      <Grid>
        <VioletCard>
          <VioletHead>
            <VioletTrend tone={overdueTrend}>
              <IconArrowUp /> {overdueSummary}
            </VioletTrend>
          </VioletHead>

          <div>
            <VioletBalanceLabel>Solde à régler</VioletBalanceLabel>
            <VioletBalanceValue>
              {formatCurrency(pendingBalance, currency)}
            </VioletBalanceValue>
            {lastOverdue ? (
              <VioletBalanceSub>
                Dernière en retard · <b>{lastOverdue.number}</b> émise le{' '}
                {formatShortDate(lastOverdue.date)}
              </VioletBalanceSub>
            ) : pendingCount > 0 ? (
              <VioletBalanceSub>
                {pendingCount} facture{pendingCount > 1 ? 's' : ''} en attente
                de règlement sur la période
              </VioletBalanceSub>
            ) : (
              <VioletBalanceSub>
                Aucune facture en retard, tout est à jour.
              </VioletBalanceSub>
            )}
          </div>

          <CtaRow>
            {pendingBalance > 0 && (
              <CtaPrimary onClick={() => navigate('/invoices/pay')}>
                Effectuer un règlement <IconArrowRight />
              </CtaPrimary>
            )}
          </CtaRow>
        </VioletCard>

        <DarkCard>
          <DarkCardHead>
            <div>
              <DarkCardTitle>Historique</DarkCardTitle>
              <DarkCardSub>
                Récapitulatif des factures sur la période active
              </DarkCardSub>
            </div>
          </DarkCardHead>

          <AssetGrid>
            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(34, 185, 114, 0.24)" color="#a7f4c9">
                  <IconWallet />
                </AssetIcon>
                <div>
                  <AssetName>Total payé</AssetName>
                </div>
              </AssetHead>
              <AssetValue>{formatCurrency(totalPaid, currency)}</AssetValue>
            </AssetCard>

            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(126, 55, 254, 0.28)" color="#c9b7ff">
                  <IconClock />
                </AssetIcon>
                <div>
                  <AssetName>Factures</AssetName>
                </div>
              </AssetHead>
              <AssetValue>{totalInvoices}</AssetValue>
            </AssetCard>
          </AssetGrid>
        </DarkCard>
      </Grid>

      <Table>
        <TableHead>
          <div>N° facture</div>
          <div>Date</div>
          <div>Échéance</div>
          <div>Montant</div>
          <div>Statut</div>
          <div style={{ textAlign: 'right' }}>PDF</div>
        </TableHead>
        <style>{`@keyframes buzzleBtnSpin { to { transform: rotate(360deg); } }`}</style>
        {!loading && invoices.length === 0 && !error && (
          <EmptyState>
            Aucune facture sur cette période.
            <br />
            Ajustez le filtre en haut à droite pour élargir la vue.
          </EmptyState>
        )}
        {pagedInvoices.map((inv) => {
          const meta =
            STATUS_META[inv.status] ??
            { label: inv.status, bg: '#efede6', fg: '#5a5540' };

          const isDownloading = downloadingId === inv.id;

          return (
            <TableRow key={inv.id}>
              <InvoiceNumber>{inv.number}</InvoiceNumber>
              <div>{formatDate(inv.date)}</div>
              <div>{formatDate(inv.dueDate)}</div>
              <Amount>{formatCurrency(inv.total, inv.currency)}</Amount>
              <div>
                <StatusPill style={{ background: meta.bg, color: meta.fg }}>
                  {meta.label}
                </StatusPill>
              </div>
              <DownloadCell>
                <DownloadButton
                  aria-label={`Télécharger ${inv.number}`}
                  title={`Télécharger ${inv.number}`}
                  onClick={() => handleDownload(inv)}
                  disabled={isDownloading}
                >
                  {isDownloading ? <IconSpin /> : <IconDownload />}
                </DownloadButton>
              </DownloadCell>
            </TableRow>
          );
        })}
      </Table>

      <BuzzlePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={invoices.length}
        onPageChange={setPage}
      />
    </Container>
  );
};
