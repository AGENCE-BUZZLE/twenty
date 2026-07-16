import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';

const PAGE_SIZE = 10;

// Buzzle Calls view, portée sur le même pattern que la page Factures /
// Contacts : en-tête compact avec period strip et workspace switcher,
// VioletCard "À traiter" (appels NEW toujours visibles) et DarkCard
// historique sur la période active. Les données sont pour l'instant
// mockées, à remplacer par un vrai provider (Aircall / Ringover).

const InkColor = '#14141c';
const HairlineColor = '#d6d2c7';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const VioletColor = '#7e37fe';

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
    contactName: 'Numéro inconnu',
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
  padding: 28px 40px 32px;
  color: ${InkColor};
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

const VioletLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 6px;
`;

const VioletValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.024em;
  line-height: 1.05;
`;

const VioletSub = styled.div`
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  margin-top: 8px;
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

const StatusPill = styled.button<{ bg: string; fg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  border: 0;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  position: relative;
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
  top: calc(100% + 6px);
  right: 0;
  background: ${SurfaceColor};
  border: 1px solid ${HairlineColor};
  border-radius: 8px;
  min-width: 180px;
  box-shadow: 0 6px 20px rgba(20, 20, 28, 0.08);
  z-index: 20;
  padding: 4px;
  display: flex;
  flex-direction: column;
  text-transform: none;
`;

const StatusMenuItem = styled.div`
  padding: 8px 10px;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: ${InkColor};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const StatusDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

const STATUS_DOT_COLOR: Record<CallStatus, string> = {
  NEW: '#3d5efc',
  QUOTED: '#5b4bff',
  VALIDATED: '#187a4a',
  CANCELLED: '#8a8b91',
};

const EmptyState = styled.div`
  padding: 60px 22px;
  text-align: center;
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.6;
`;

const STATUS_META: Record<CallStatus, { label: string; bg: string; fg: string }> = {
  NEW: { label: 'Nouveau', bg: '#e3ecff', fg: '#1a3fb0' },
  QUOTED: { label: 'Devis envoyé', bg: '#efe4ff', fg: '#4a1d99' },
  VALIDATED: { label: 'Validé', bg: '#e3f4ea', fg: '#187a4a' },
  CANCELLED: { label: 'Annulé', bg: '#efede6', fg: '#5a5540' },
};

const STATUS_ORDER: CallStatus[] = ['NEW', 'QUOTED', 'VALIDATED', 'CANCELLED'];

// ---------- Icons ----------

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

const IconPhone = () => (
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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

// ---------- Helpers ----------

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
  return `${date} · ${time}`;
};

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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

const formatDurationLabel = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleCallsPage = () => {
  const [calls, setCalls] = useState<Call[]>(MOCK_CALLS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Period selector, aligné sur les autres pages.
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
    const now = Date.now();
    if (period === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return { start: d.getTime(), end: now };
    }
    if (period === 'week') {
      return { start: now - 7 * 86400000, end: now };
    }
    if (period === 'month') {
      return { start: now - 30 * 86400000, end: now };
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

  // Appels NEW toujours visibles (comme les factures impayées), les
  // autres statuts sont filtrés par la période active.
  const unqualifiedCalls = useMemo(
    () => calls.filter((c) => c.status === 'NEW'),
    [calls],
  );

  const visibleCalls = useMemo(
    () =>
      calls.filter((c) => c.status === 'NEW' || inRange(c.startedAt)),
    [calls, periodRange],
  );

  const inPeriodCalls = useMemo(
    () => calls.filter((c) => inRange(c.startedAt)),
    [calls, periodRange],
  );

  const pagedCalls = useMemo(
    () => visibleCalls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleCalls, page],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(visibleCalls.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [visibleCalls.length, page]);

  useEffect(() => {
    setPage(1);
  }, [period, customStart, customEnd]);

  const totalInPeriod = inPeriodCalls.length;
  const totalDurationInPeriod = inPeriodCalls.reduce(
    (s, c) => s + c.durationSec,
    0,
  );
  const unqualifiedCount = unqualifiedCalls.length;
  const unqualifiedTrend = unqualifiedCount > 0 ? 'down' : 'up';
  const unqualifiedSummary =
    unqualifiedCount > 0 ? `${unqualifiedCount} à traiter` : 'Tout est traité';

  const handleStatusChange = (id: string, status: CallStatus) => {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setOpenMenuId(null);
  };

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Appels</PageTitle>
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
                    <CustomPopoverLabel htmlFor="buzzle-calls-range-start">
                      Du
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-calls-range-start"
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </CustomPopoverRow>
                  <CustomPopoverRow>
                    <CustomPopoverLabel htmlFor="buzzle-calls-range-end">
                      Au
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-calls-range-end"
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

      <Grid>
        <VioletCard>
          <VioletHead>
            <VioletTrend tone={unqualifiedTrend}>
              <IconArrowUp /> {unqualifiedSummary}
            </VioletTrend>
          </VioletHead>

          <div>
            <VioletLabel>À traiter</VioletLabel>
            <VioletValue>{unqualifiedCount}</VioletValue>
            {unqualifiedCount > 0 ? (
              <VioletSub>
                {unqualifiedCount} appel{unqualifiedCount > 1 ? 's' : ''} en
                attente de qualification, quelle que soit la période.
              </VioletSub>
            ) : (
              <VioletSub>
                Tous les appels ont été qualifiés, aucune action requise.
              </VioletSub>
            )}
          </div>
        </VioletCard>

        <DarkCard>
          <DarkCardHead>
            <div>
              <DarkCardTitle>Historique</DarkCardTitle>
              <DarkCardSub>
                Appels reçus sur la période active
              </DarkCardSub>
            </div>
          </DarkCardHead>

          <AssetGrid>
            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(34, 185, 114, 0.24)" color="#a7f4c9">
                  <IconPhone />
                </AssetIcon>
                <div>
                  <AssetName>Nombre d'appels</AssetName>
                </div>
              </AssetHead>
              <AssetValue>{totalInPeriod}</AssetValue>
            </AssetCard>

            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(126, 55, 254, 0.28)" color="#c9b7ff">
                  <IconClock />
                </AssetIcon>
                <div>
                  <AssetName>Durée totale</AssetName>
                </div>
              </AssetHead>
              <AssetValue>
                {formatDurationLabel(totalDurationInPeriod)}
              </AssetValue>
            </AssetCard>
          </AssetGrid>
        </DarkCard>
      </Grid>

      <Table>
        <TableHead>
          <div>Date</div>
          <div>Contact</div>
          <div>Numéro</div>
          <div>Durée</div>
          <div>Statut</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </TableHead>

        {visibleCalls.length === 0 && (
          <EmptyState>
            Aucun appel sur cette période.
            <br />
            Ajustez le filtre en haut à droite pour élargir la vue.
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
                <StatusPill
                  bg={meta.bg}
                  fg={meta.fg}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(isMenuOpen ? null : call.id);
                  }}
                >
                  {meta.label}
                  <IconChevron />
                  {isMenuOpen && (
                    <StatusMenu onClick={(e) => e.stopPropagation()}>
                      {STATUS_ORDER.map((s) => {
                        const m = STATUS_META[s];
                        return (
                          <StatusMenuItem
                            key={s}
                            onClick={() => handleStatusChange(call.id, s)}
                          >
                            <StatusDot color={STATUS_DOT_COLOR[s]} />
                            {m.label}
                          </StatusMenuItem>
                        );
                      })}
                    </StatusMenu>
                  )}
                </StatusPill>
              </div>
              <ActionCell>
                <IconButton
                  aria-label={`Écouter ${call.contactName}`}
                  title="Écouter l'enregistrement"
                  disabled={!call.recordingUrl}
                >
                  <IconPlay />
                </IconButton>
                <IconButton
                  aria-label={`Télécharger ${call.contactName}`}
                  title="Télécharger l'enregistrement"
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
        totalItems={visibleCalls.length}
        onPageChange={setPage}
      />
    </Container>
  );
};
