import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';
import { BuzzlePeriodPicker } from '@/buzzle-workspace-pages/BuzzlePeriodPicker';
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

// Inner wrapper: aligns page content inside the shared Ink shell Stage
// with a shared max-width.
const Container = styled.div`
  width: 100%;
  color: ${InkColor};
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
  @media (max-width: 768px) {
    align-items: center;
    gap: 12px;
  }
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${InkColor};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
    letter-spacing: -0.016em;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

// KPI row shared with Vue d'ensemble · 3 tiles à plat (Solde à régler
// en accent violet, Total payé, Factures count). Solde à régler reste
// toujours sur l'ensemble des impayés · les autres suivent la période.
const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Tile = styled.div`
  --tile-label: ${MutedColor};
  --tile-value: ${InkColor};
  --tile-footer: ${MutedColor};
  --tile-badge-color: #16a34a;
  --tile-badge-bg: rgba(22, 163, 74, 0.08);
  --tile-badge-color-down: #dc2626;
  --tile-badge-bg-down: rgba(220, 38, 38, 0.08);

  border-radius: 22px;
  padding: 22px;
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 172px;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(20, 20, 28, 0.06);
  }

  &[data-accent='true'] {
    --tile-label: rgba(255, 255, 255, 0.72);
    --tile-value: #ffffff;
    --tile-footer: rgba(255, 255, 255, 0.78);
    --tile-badge-color: #ffffff;
    --tile-badge-bg: rgba(255, 255, 255, 0.16);
    --tile-badge-color-down: #ffffff;
    --tile-badge-bg-down: rgba(255, 255, 255, 0.16);

    background: linear-gradient(160deg, #7e37fe 0%, #5b25c7 100%);
    color: #ffffff;
    border: none;
    position: relative;
    overflow: hidden;
  }
  &[data-accent='true']::after {
    content: '';
    position: absolute;
    right: -40px;
    top: -40px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const TileLabel = styled.div`
  font-size: 13px;
  color: var(--tile-label);
  font-weight: 500;
`;

const TileValue = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 14px 0 10px 0;
  color: var(--tile-value);
  position: relative;
  z-index: 1;
`;

const TileFooter = styled.div`
  font-size: 12.5px;
  color: var(--tile-footer);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const TileBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--tile-badge-color);
  background: var(--tile-badge-bg);
  &[data-tone='down'] {
    color: var(--tile-badge-color-down);
    background: var(--tile-badge-bg-down);
  }
`;

const TileCtaRow = styled.div`
  margin-top: 14px;
  display: flex;
  position: relative;
  z-index: 1;
`;

const CtaPrimary = styled.button`
  background: #ffffff;
  color: ${VioletColor};
  border: 0;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 140ms ease;
  &:hover {
    transform: translateY(-1px);
  }
`;

// ---------- Table ----------

const Table = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
  overflow: hidden;
  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

const TableInner = styled.div`
  @media (max-width: 768px) {
    min-width: 720px;
  }
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

  // Badge court reflétant la période active · évite les textes vagues
  // "sur la période" sur les tiles chiffrées à côté du picker.
  const periodLabel = (() => {
    if (period === 'today') return "Aujourd'hui";
    if (period === 'week') return 'Cette semaine';
    if (period === 'month') return 'Ce mois';
    return `${formatShortDate(customStart)} → ${formatShortDate(customEnd)}`;
  })();

  // First-load state: nothing to display yet. Show only the animated
  // loader so the summary cards and the empty header rows don't flash.
  const periodPicker = (
    <BuzzlePeriodPicker
      period={period}
      onPeriodChange={setPeriod}
      customStart={customStart}
      customEnd={customEnd}
      onCustomStartChange={setCustomStart}
      onCustomEndChange={setCustomEnd}
    />
  );

  if (loading && !data && !error) {
    return (
      <BuzzleWorkspaceShell>
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
      </BuzzleWorkspaceShell>
    );
  }

  return (
    <BuzzleWorkspaceShell>
      <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Factures</PageTitle>
        </HeaderText>
        {periodPicker}
      </HeaderRow>

      {error && (
        <ErrorBanner>
          Impossible de charger les factures pour le moment. Réessayez dans
          quelques instants ou contactez contact@agence-buzzle.com.
        </ErrorBanner>
      )}

      <KpiRow>
        <Tile data-accent="true">
          <TileLabel>Solde à régler</TileLabel>
          <TileValue>{formatCurrency(pendingBalance, currency)}</TileValue>
          <TileFooter>
            <TileBadge data-tone={overdueTrend}>
              {overdueSummary}
            </TileBadge>
            <span>
              {lastOverdue
                ? `dernière ${lastOverdue.number} du ${formatShortDate(lastOverdue.date)}`
                : pendingCount > 0
                  ? `${pendingCount} facture${pendingCount > 1 ? 's' : ''} en attente`
                  : 'tout est à jour'}
            </span>
          </TileFooter>
          {pendingBalance > 0 && (
            <TileCtaRow>
              <CtaPrimary onClick={() => navigate('/invoices/pay')}>
                Effectuer un règlement <IconArrowRight />
              </CtaPrimary>
            </TileCtaRow>
          )}
        </Tile>

        <Tile>
          <TileLabel>Total payé</TileLabel>
          <TileValue>{formatCurrency(totalPaid, currency)}</TileValue>
          <TileFooter>
            <TileBadge>{periodLabel}</TileBadge>
          </TileFooter>
        </Tile>

        <Tile>
          <TileLabel>Factures</TileLabel>
          <TileValue>{totalInvoices}</TileValue>
          <TileFooter>
            <TileBadge>{periodLabel}</TileBadge>
          </TileFooter>
        </Tile>
      </KpiRow>

      <Table>
        <TableInner>
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
        </TableInner>
      </Table>

      <BuzzlePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={invoices.length}
        onPageChange={setPage}
      />
      </Container>
    </BuzzleWorkspaceShell>
  );
};
