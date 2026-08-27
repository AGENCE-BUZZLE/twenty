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

// Quelques appels "Test" en dur en attendant un vrai provider (Aircall
// / Ringover / autre). Les noms sont volontairement labellés Test pour
// qu'on ne les prenne jamais pour de vrais leads en production.
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 3600 * 1000).toISOString();

const MOCK_CALLS: Call[] = [
  {
    id: 'test-1',
    startedAt: hoursAgo(1),
    contactName: 'Test Alpha',
    phoneNumber: '+33 6 11 11 11 11',
    durationSec: 187,
    status: 'NEW',
  },
  {
    id: 'test-2',
    startedAt: hoursAgo(4),
    contactName: 'Test Bravo',
    phoneNumber: '+33 6 22 22 22 22',
    durationSec: 62,
    status: 'NEW',
  },
  {
    id: 'test-3',
    startedAt: daysAgo(1),
    contactName: 'Test Charlie',
    phoneNumber: '+33 6 33 33 33 33',
    durationSec: 415,
    status: 'CONTACTED',
  },
  {
    id: 'test-4',
    startedAt: daysAgo(2),
    contactName: 'Test Delta',
    phoneNumber: '+33 6 44 44 44 44',
    durationSec: 28,
    status: 'NOT_INTERESTED',
  },
  {
    id: 'test-5',
    startedAt: daysAgo(3),
    contactName: 'Test Echo',
    phoneNumber: '+33 6 55 55 55 55',
    durationSec: 302,
    status: 'WON',
  },
];

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

// KPI row shared with Vue d'ensemble · 3 tiles à plat (À traiter en
// accent violet, Nombre d'appels, Durée totale). À traiter reste sur
// l'ensemble des appels non qualifiés · les autres suivent la période.
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

// ---------- Feed (style Formulaires / Vue d'ensemble) ----------

const FeedCard = styled.div`
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  padding: 20px 22px;
  color: ${InkColor};
`;

const FeedDayLabel = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(20, 20, 28, 0.4);
  text-transform: uppercase;
  padding: 14px 4px 8px;
  &:first-of-type {
    padding-top: 0;
  }
`;

const FeedRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 10px;
  border-radius: 12px;
  transition: background 140ms ease;
  &:hover {
    background: rgba(20, 20, 28, 0.03);
  }
`;

const FeedAvatar = styled.span`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
`;

const FeedName = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: ${InkColor};
`;

const FeedMeta = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: ${MutedColor};
  margin-top: 2px;
`;

const FeedRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const FeedTime = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: ${MutedColor};
`;

const FeedDuration = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${InkColor};
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(20, 20, 28, 0.05);
`;

const FeedEmpty = styled.div`
  padding: 40px 12px;
  text-align: center;
  color: ${MutedColor};
  font-size: 13.5px;
  line-height: 1.6;
`;

// Même palette + hashing que la LeadsCard de Vue d'ensemble ·
// garantit que le même nom donne le même dégradé et les mêmes initiales
// des deux côtés.
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7e37fe 0%, #4b1fb0 100%)',
  'linear-gradient(135deg, #16a34a 0%, #065f46 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
] as const;

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
};

const avatarGradient = (name: string): string =>
  AVATAR_GRADIENTS[hashName(name || '?') % AVATAR_GRADIENTS.length];

const buildInitials = (name: string): string => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const feedGroupLabel = (iso?: string | null): string => {
  if (!iso) return 'Sans date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sans date';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const feedTimeLabel = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

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

  // Badge court reflétant la période active · aligne les tiles de droite
  // avec le picker en haut de page.
  const shortDate = (raw?: string | null) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
      return raw ?? '';
    }
  };
  const periodLabel = (() => {
    if (period === 'today') return "Aujourd'hui";
    if (period === 'week') return 'Cette semaine';
    if (period === 'month') return 'Ce mois';
    return `${shortDate(customStart)} → ${shortDate(customEnd)}`;
  })();

  const handleStatusChange = (id: string, status: CallStatus) => {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setOpenMenuId(null);
  };

  return (
    <BuzzleWorkspaceShell>
      <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Appels</PageTitle>
          <TitleBadge>Beta</TitleBadge>
        </HeaderText>
        <BuzzlePeriodPicker
          period={period}
          onPeriodChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      </HeaderRow>

      <KpiRow>
        <Tile data-accent="true">
          <TileLabel>À traiter</TileLabel>
          <TileValue>{unqualifiedCount}</TileValue>
          <TileFooter>
            <TileBadge data-tone={unqualifiedTrend}>
              {unqualifiedSummary}
            </TileBadge>
            <span>
              {unqualifiedCount > 0
                ? 'en attente de qualification, toutes périodes'
                : 'tout est à jour'}
            </span>
          </TileFooter>
        </Tile>

        <Tile>
          <TileLabel>Nombre d'appels</TileLabel>
          <TileValue>{totalInPeriod}</TileValue>
          <TileFooter>
            <TileBadge>{periodLabel}</TileBadge>
          </TileFooter>
        </Tile>

        <Tile>
          <TileLabel>Durée totale</TileLabel>
          <TileValue>{formatDurationLabel(totalDurationInPeriod)}</TileValue>
          <TileFooter>
            <TileBadge>{periodLabel}</TileBadge>
          </TileFooter>
        </Tile>
      </KpiRow>

      <FeedCard>
        {visibleCalls.length === 0 && (
          <FeedEmpty>
            Aucun appel sur cette période.
            <br />
            Ajustez le filtre en haut à droite pour élargir la vue.
          </FeedEmpty>
        )}

        {pagedCalls.length > 0 && (() => {
          const groups: Array<[string, typeof pagedCalls]> = [];
          for (const call of pagedCalls) {
            const key = feedGroupLabel(call.startedAt);
            const last = groups[groups.length - 1];
            if (last && last[0] === key) {
              last[1].push(call);
            } else {
              groups.push([key, [call]]);
            }
          }
          return groups.map(([day, rows]) => (
            <div key={day}>
              <FeedDayLabel>{day}</FeedDayLabel>
              {rows.map((call) => {
                const meta = getStatusMeta(call.status);
                const isMenuOpen = openMenuId === call.id;
                return (
                  <FeedRow key={call.id}>
                    <FeedAvatar
                      aria-hidden="true"
                      style={{ background: avatarGradient(call.contactName) }}
                    >
                      {buildInitials(call.contactName)}
                    </FeedAvatar>
                    <div>
                      <FeedName>{call.contactName}</FeedName>
                      <FeedMeta>{call.phoneNumber}</FeedMeta>
                    </div>
                    <FeedRight onClick={(e) => e.stopPropagation()}>
                      <FeedTime>{feedTimeLabel(call.startedAt)}</FeedTime>
                      <FeedDuration>
                        {formatDuration(call.durationSec)}
                      </FeedDuration>
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
                                  onClick={() =>
                                    handleStatusChange(call.id, s)
                                  }
                                >
                                  <StatusDot color={m.dot} />
                                  {m.label}
                                </StatusMenuItem>
                              );
                            })}
                          </StatusMenu>
                        )}
                      </StatusPill>
                    </FeedRight>
                  </FeedRow>
                );
              })}
            </div>
          ));
        })()}
      </FeedCard>

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
