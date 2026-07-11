import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { getTokenPair } from '@/apollo/utils/getTokenPair';

const PAGE_SIZE = 10;

// Real /invoices page: pulls Zoho-backed invoices for the current workspace
// through the myWorkspaceInvoices query. When a workspace is not yet linked
// to a Zoho customer, the resolver returns an empty list and we render a
// gentle "aucune facture" state.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const HairlineColor = '#d6d2c7';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

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
  padding: 60px 48px 60px;
  color: ${InkColor};
  overflow-y: auto;
  > * {
    max-width: 1080px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.028em;
  color: ${InkColor};
  margin: 0 0 14px;
`;

const Lede = styled.p`
  margin: 0 0 32px;
  color: ${MutedColor};
  font-size: 15px;
  line-height: 1.6;
  display: block;
`;

const LedeIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: ${InkColor};
  color: ${SurfaceColor};
  margin: 0 4px;
  vertical-align: -6px;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  border: 1px solid ${InkColor};
  border-radius: 12px;
  padding: 18px 20px;
  background: ${InkColor};
  color: ${SurfaceColor};
`;

const SummaryLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  color: ${SurfaceColor};
`;

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

export const BuzzleInvoicesPage = () => {
  const apolloCoreClient = useApolloCoreClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<{ myWorkspaceInvoices: Invoice[] }>(
    MY_WORKSPACE_INVOICES,
    { client: apolloCoreClient, fetchPolicy: 'cache-and-network' },
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

  const invoices = data?.myWorkspaceInvoices ?? [];
  const pagedInvoices = useMemo(
    () => invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [invoices, page],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));

    if (page > totalPages) setPage(totalPages);
  }, [invoices.length, page]);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((s, i) => s + i.balance, 0);

  const currency = invoices[0]?.currency ?? 'EUR';

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

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
      <PageTitle>Espace · Factures</PageTitle>
      <Lede>
        Retrouvez ici l'ensemble de vos factures, aussi bien celles déjà
        réglées que celles en attente de paiement. Pour récupérer une facture
        au format PDF, il vous suffit de cliquer sur
        <LedeIcon aria-hidden="true">
          <IconDownload />
        </LedeIcon>
        à droite de la ligne concernée.
      </Lede>

      {error && (
        <ErrorBanner>
          Impossible de charger les factures pour le moment. Réessayez dans
          quelques instants ou contactez contact@agence-buzzle.com.
        </ErrorBanner>
      )}

      {!error && invoices.length > 0 && (
        <SummaryRow>
          <SummaryCard>
            <SummaryLabel>Nombre de factures</SummaryLabel>
            <SummaryValue>{invoices.length}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Total payé</SummaryLabel>
            <SummaryValue>{formatCurrency(totalPaid, currency)}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Solde restant</SummaryLabel>
            <SummaryValue>
              {formatCurrency(totalOutstanding, currency)}
            </SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>En retard</SummaryLabel>
            <SummaryValue>{overdueCount}</SummaryValue>
          </SummaryCard>
        </SummaryRow>
      )}

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
            Aucune facture pour le moment.
            <br />
            Les nouvelles factures apparaîtront ici automatiquement.
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
