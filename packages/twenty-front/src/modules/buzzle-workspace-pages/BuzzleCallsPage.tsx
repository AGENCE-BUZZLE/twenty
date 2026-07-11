import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';

const PAGE_SIZE = 10;

// Mocked call log page mirroring the invoices UI. Once we wire a real
// call recording provider (Aircall / Ringover / other), swap the MOCK_CALLS
// array for a query + resolver returning the same Call shape.

const InkColor = '#14141c';
const HairlineColor = '#d6d2c7';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

type CallStatus = 'NEW' | 'QUOTED' | 'VALIDATED' | 'CANCELLED';

type Call = {
  id: string;
  startedAt: string;
  contactName: string;
  phoneNumber: string;
  durationSec: number;
  status: CallStatus;
  recordingUrl?: string;
};

const MOCK_CALLS: Call[] = [
  {
    id: 'mock-1',
    startedAt: '2026-07-11T09:32:00Z',
    contactName: 'Sylvie Vartan',
    phoneNumber: '+33 6 87 65 43 21',
    durationSec: 194,
    status: 'VALIDATED',
    recordingUrl: undefined,
  },
  {
    id: 'mock-2',
    startedAt: '2026-07-11T08:14:00Z',
    contactName: 'Alexandre Meyer',
    phoneNumber: '+33 6 12 34 56 78',
    durationSec: 341,
    status: 'QUOTED',
    recordingUrl: undefined,
  },
  {
    id: 'mock-3',
    startedAt: '2026-07-10T18:47:00Z',
    contactName: 'Numero inconnu',
    phoneNumber: '+33 4 91 22 33 44',
    durationSec: 42,
    status: 'CANCELLED',
    recordingUrl: undefined,
  },
  {
    id: 'mock-4',
    startedAt: '2026-07-10T15:03:00Z',
    contactName: 'Karim Bakri',
    phoneNumber: '+33 7 82 65 41 09',
    durationSec: 512,
    status: 'NEW',
    recordingUrl: undefined,
  },
];

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
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1.3fr 0.9fr 0.8fr 1.2fr 110px;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid ${InkColor};
  background: ${InkColor};
  border-top-left-radius: 11px;
  border-top-right-radius: 11px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1.3fr 0.9fr 0.8fr 1.2fr 110px;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: 1px solid ${HairlineColor};
  align-items: center;
  font-size: 13.5px;
  &:last-child {
    border-bottom: 0;
  }
`;

const DateCell = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  color: ${MutedColor};
`;

const NameCell = styled.div`
  font-weight: 500;
  color: ${InkColor};
`;

const DurationCell = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  color: ${InkColor};
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

const StatusButton = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
`;

const ActionCell = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const IconButton = styled.button`
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
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const StatusMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: ${SurfaceColor};
  border: 1px solid ${HairlineColor};
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(20, 20, 28, 0.08);
`;

const StatusMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const StatusPillWrap = styled.div`
  position: relative;
  display: inline-block;
`;

const EmptyState = styled.div`
  padding: 60px 22px;
  text-align: center;
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.6;
`;

const STATUS_META: Record<CallStatus, { label: string; bg: string; fg: string }> = {
  NEW: { label: 'Nouveau', bg: '#e3ecff', fg: '#1a3fb0' },
  QUOTED: { label: 'Devis envoye', bg: '#efe4ff', fg: '#4a1d99' },
  VALIDATED: { label: 'Valide', bg: '#e3f4ea', fg: '#187a4a' },
  CANCELLED: { label: 'Annule', bg: '#efede6', fg: '#5a5540' },
};

const STATUS_ORDER: CallStatus[] = ['NEW', 'QUOTED', 'VALIDATED', 'CANCELLED'];

const IconPlay = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

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

const IconChevron = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ marginLeft: 4 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const formatDate = (raw: string): string => {
  const d = new Date(raw);
  const date = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date} . ${time}`;
};

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const BuzzleCallsPage = () => {
  const [calls, setCalls] = useState<Call[]>(MOCK_CALLS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pagedCalls = useMemo(
    () => calls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [calls, page],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(calls.length / PAGE_SIZE));

    if (page > totalPages) setPage(totalPages);
  }, [calls.length, page]);

  const total = calls.length;
  const totalDurationSec = calls.reduce((s, c) => s + c.durationSec, 0);
  const qualifiedCount = calls.filter((c) => c.status === 'VALIDATED').length;
  const pendingCount = calls.filter((c) => c.status === 'NEW').length;

  const totalDurationLabel = (() => {
    const h = Math.floor(totalDurationSec / 3600);
    const m = Math.floor((totalDurationSec % 3600) / 60);

    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  })();

  const handleStatusChange = (id: string, status: CallStatus) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
    setOpenMenuId(null);
  };

  return (
    <Container>
      <Eyebrow>Espace . Appels</Eyebrow>
      <Title>Appels</Title>
      <Lede>
        Historique des appels entrants qualifies pour vos campagnes. Chaque
        enregistrement peut etre ecoute, telecharge et qualifie comme un lead
        formulaire.
      </Lede>

      <SummaryRow>
        <SummaryCard>
          <SummaryLabel>Nombre d appels</SummaryLabel>
          <SummaryValue>{total}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Duree totale</SummaryLabel>
          <SummaryValue>{totalDurationLabel}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Qualifies</SummaryLabel>
          <SummaryValue>{qualifiedCount}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Nouveaux</SummaryLabel>
          <SummaryValue>{pendingCount}</SummaryValue>
        </SummaryCard>
      </SummaryRow>

      <Table>
        <TableHead>
          <div>Date</div>
          <div>Contact</div>
          <div>Numero</div>
          <div>Duree</div>
          <div>Statut</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </TableHead>

        {calls.length === 0 && (
          <EmptyState>
            Aucun appel enregistre pour le moment.
            <br />
            Les nouveaux appels apparaitront ici automatiquement.
          </EmptyState>
        )}

        {pagedCalls.map((call) => {
          const meta = STATUS_META[call.status];
          const isMenuOpen = openMenuId === call.id;

          return (
            <TableRow key={call.id}>
              <DateCell>{formatDate(call.startedAt)}</DateCell>
              <NameCell>{call.contactName}</NameCell>
              <DateCell>{call.phoneNumber}</DateCell>
              <DurationCell>{formatDuration(call.durationSec)}</DurationCell>
              <div>
                <StatusPillWrap>
                  <StatusButton
                    onClick={() =>
                      setOpenMenuId(isMenuOpen ? null : call.id)
                    }
                  >
                    <StatusPill
                      style={{ background: meta.bg, color: meta.fg }}
                    >
                      {meta.label}
                      <IconChevron />
                    </StatusPill>
                  </StatusButton>
                  {isMenuOpen && (
                    <StatusMenu>
                      {STATUS_ORDER.map((s) => (
                        <StatusMenuItem
                          key={s}
                          onClick={() => handleStatusChange(call.id, s)}
                        >
                          <StatusPill
                            style={{
                              background: STATUS_META[s].bg,
                              color: STATUS_META[s].fg,
                            }}
                          >
                            {STATUS_META[s].label}
                          </StatusPill>
                        </StatusMenuItem>
                      ))}
                    </StatusMenu>
                  )}
                </StatusPillWrap>
              </div>
              <ActionCell>
                <IconButton
                  aria-label={`Ecouter ${call.contactName}`}
                  title="Ecouter l enregistrement"
                  disabled={!call.recordingUrl}
                >
                  <IconPlay />
                </IconButton>
                <IconButton
                  aria-label={`Telecharger ${call.contactName}`}
                  title="Telecharger l enregistrement"
                  disabled={!call.recordingUrl}
                >
                  <IconDownload />
                </IconButton>
              </ActionCell>
            </TableRow>
          );
        })}
      </Table>

      <BuzzlePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={calls.length}
        onPageChange={setPage}
      />
    </Container>
  );
};
