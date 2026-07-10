import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';

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
  padding: 60px 48px 60px;
  max-width: 1080px;
  margin: 0 auto;
  color: ${InkColor};
`;

const Eyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 10px;
`;

const Title = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.024em;
  margin: 0 0 8px;
`;

const Lede = styled.p`
  margin: 0 0 32px;
  color: ${MutedColor};
  font-size: 15px;
  max-width: 640px;
  line-height: 1.6;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  padding: 18px 20px;
  background: ${SurfaceColor};
`;

const SummaryLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
`;

const Table = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
  overflow: hidden;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid ${HairlineColor};
  background: ${PaperColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr;
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
  paid: { label: 'Payee', bg: '#e3f4ea', fg: '#187a4a' },
  sent: { label: 'Envoyee', bg: '#e3ecff', fg: '#1a3fb0' },
  viewed: { label: 'Vue', bg: '#e3ecff', fg: '#1a3fb0' },
  overdue: { label: 'En retard', bg: '#fbe5e5', fg: '#8a1a1a' },
  draft: { label: 'Brouillon', bg: '#efede6', fg: '#5a5540' },
  partially_paid: { label: 'Partielle', bg: '#fff2d6', fg: '#7a5a10' },
  void: { label: 'Annulee', bg: '#efede6', fg: '#5a5540' },
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
  const { data, loading, error } = useQuery<{ myWorkspaceInvoices: Invoice[] }>(
    MY_WORKSPACE_INVOICES,
    { fetchPolicy: 'cache-and-network' },
  );

  const invoices = data?.myWorkspaceInvoices ?? [];

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((s, i) => s + i.balance, 0);

  const currency = invoices[0]?.currency ?? 'EUR';

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  return (
    <Container>
      <Eyebrow>Espace . Factures</Eyebrow>
      <Title>Factures</Title>
      <Lede>
        Historique des factures emises pour votre entreprise. Les paiements sont
        rapproches automatiquement depuis notre systeme comptable.
      </Lede>

      {error && (
        <ErrorBanner>
          Impossible de charger les factures pour le moment. Reessayez dans
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
            <SummaryLabel>Total paye</SummaryLabel>
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
          <div>N. facture</div>
          <div>Date</div>
          <div>Echeance</div>
          <div>Montant</div>
          <div>Statut</div>
        </TableHead>
        {loading && invoices.length === 0 && (
          <EmptyState>Chargement des factures.</EmptyState>
        )}
        {!loading && invoices.length === 0 && !error && (
          <EmptyState>
            Aucune facture pour le moment.
            <br />
            Les nouvelles factures apparaitront ici automatiquement.
          </EmptyState>
        )}
        {invoices.map((inv) => {
          const meta =
            STATUS_META[inv.status] ??
            { label: inv.status, bg: '#efede6', fg: '#5a5540' };

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
            </TableRow>
          );
        })}
      </Table>
    </Container>
  );
};
