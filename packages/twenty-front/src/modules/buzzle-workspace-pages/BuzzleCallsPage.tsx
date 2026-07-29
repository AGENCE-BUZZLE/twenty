import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';
import { BuzzlePeriodPicker } from '@/buzzle-workspace-pages/BuzzlePeriodPicker';
import { useBuzzleStatusConfig } from '@/buzzle-workspace-config/useBuzzleStatusConfig';

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

type CallStatus = string;

type Call = {
  id: string;
  startedAt: string;
  contactName: string;
  phoneNumber: string;
  durationSec: number;
  status: CallStatus;
  recordingUrl?: string;
};

// Empty by default. Once a real call provider (Aircall / Ringover /
// autre) est wired, remplacer par la query GraphQL correspondante.
const MOCK_CALLS: Call[] = [];

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

const HeaderText = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: ${InkColor};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 22px;
    letter-spacing: -0.018em;
  }
`;

const TitleBadge = styled.span`
  background: ${VioletColor};
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
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

// KPI cards restyled to match the Vue d'ensemble tiles.
const VioletCard = styled.div`
  background: linear-gradient(160deg, #7e37fe 0%, #5b25c7 100%);
  color: #ffffff;
  border-radius: 22px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 172px;
  position: relative;
  overflow: hidden;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &::after {
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(20, 20, 28, 0.06);
  }
`;

const VioletHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
`;

const VioletTrend = styled.span<{ tone: 'up' | 'down' | 'flat' }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
`;

const VioletLabel = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 4px;
`;

const VioletValue = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 14px 0 10px 0;
  color: #ffffff;
`;

const VioletSub = styled.div`
  font-family: 'Inter', sans-serif;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12.5px;
`;

const DarkCard = styled.div`
  background: #ffffff;
  color: ${InkColor};
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 172px;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(20, 20, 28, 0.06);
  }
`;

const DarkCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const DarkCardTitle = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${InkColor};
`;

const DarkCardSub = styled.div`
  font-family: 'Inter', sans-serif;
  color: ${MutedColor};
  font-size: 12.5px;
  margin-top: 3px;
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
`;

const AssetCard = styled.div`
  background: rgba(20, 20, 28, 0.03);
  border-radius: 14px;
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
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: ${MutedColor};
`;

const AssetValue = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${InkColor};
`;

// ---------- Table ----------

const Table = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
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

const EmptyState = styled.div`
  padding: 60px 22px;
  text-align: center;
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.6;
`;

// ---------- Beta modal ----------

const BETA_MODAL_KEY = 'buzzle-calls-beta-notice-seen-v1';

const BetaBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 28, 0.48);
  backdrop-filter: blur(2px);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: buzzle-beta-fade 0.14s ease-out;

  @keyframes buzzle-beta-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const BetaModal = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${SurfaceColor};
  border-radius: 14px;
  box-shadow:
    0 24px 48px rgba(20, 20, 28, 0.28),
    0 4px 12px rgba(20, 20, 28, 0.14);
  padding: 28px 30px 24px;
  animation: buzzle-beta-rise 0.18s ease-out;

  @keyframes buzzle-beta-rise {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const BetaKicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ede4ff;
  color: #4a2fb8;
  border-radius: 999px;
  padding: 4px 12px 4px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 14px;
`;

const BetaKickerDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${VioletColor};
`;

const BetaTitle = styled.h2`
  margin: 0 0 10px;
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.014em;
  color: ${InkColor};
  line-height: 1.2;
`;

const BetaBody = styled.div`
  color: rgba(20, 20, 28, 0.72);
  font-size: 14px;
  line-height: 1.55;
  margin-bottom: 20px;

  p { margin: 0 0 10px; }
  p:last-child { margin-bottom: 0; }
`;

const BetaActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const BetaButton = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 0;
  padding: 11px 18px;
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.12s;
  &:hover { opacity: 0.85; }
`;

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

const formatDurationLabel = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleCallsPage = () => {
  const {
    order: STATUS_ORDER,
    meta: STATUS_META,
    getMeta: getStatusMeta,
  } = useBuzzleStatusConfig();

  const [calls, setCalls] = useState<Call[]>(MOCK_CALLS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // One-shot beta notice: shows on first visit per browser, then remembers
  // the dismiss in localStorage so we never bother the user again.
  const [showBetaNotice, setShowBetaNotice] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(BETA_MODAL_KEY) !== '1') {
        setShowBetaNotice(true);
      }
    } catch {
      setShowBetaNotice(true);
    }
  }, []);
  const dismissBetaNotice = () => {
    try {
      localStorage.setItem(BETA_MODAL_KEY, '1');
    } catch {
      // ignore quota errors
    }
    setShowBetaNotice(false);
  };

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
    <BuzzleWorkspaceShell
      topExtras={
        <BuzzlePeriodPicker
          period={period}
          onPeriodChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      }
    >
      <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Appels</PageTitle>
          <TitleBadge>Beta</TitleBadge>
        </HeaderText>
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
        <TableInner>
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
          const meta = getStatusMeta(call.status);
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
                            <StatusDot color={m.dot} />
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
        </TableInner>
      </Table>

      <BuzzlePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={visibleCalls.length}
        onPageChange={setPage}
      />

      {showBetaNotice && (
        <BetaBackdrop onClick={dismissBetaNotice}>
          <BetaModal onClick={(e) => e.stopPropagation()}>
            <BetaKicker>
              <BetaKickerDot />
              Bêta
            </BetaKicker>
            <BetaTitle>Le suivi des appels arrive bientôt</BetaTitle>
            <BetaBody>
              <p>
                Cette section est encore en cours de finalisation. Aucun
                appel affiché ici n'est réel pour le moment · vous
                verrez apparaître vos vrais appels dès que la connexion
                à votre standard téléphonique sera activée.
              </p>
              <p>
                On vous préviendra directement dans le CRM au moment du
                déploiement. Merci de votre patience.
              </p>
            </BetaBody>
            <BetaActions>
              <BetaButton onClick={dismissBetaNotice}>Compris</BetaButton>
            </BetaActions>
          </BetaModal>
        </BetaBackdrop>
      )}
      </Container>
    </BuzzleWorkspaceShell>
  );
};
