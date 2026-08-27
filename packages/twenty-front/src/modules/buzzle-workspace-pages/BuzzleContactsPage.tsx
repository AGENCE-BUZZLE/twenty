import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';
import { BuzzlePeriodPicker } from '@/buzzle-workspace-pages/BuzzlePeriodPicker';
import { useBuzzleStatusConfig } from '@/buzzle-workspace-config/useBuzzleStatusConfig';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const PAGE_SIZE = 10;

// Buzzle Contacts view, portée sur le pattern de la page Factures :
// en-tête compact avec le period strip et le workspace switcher, une
// VioletCard "À qualifier" toujours visible (statut NEW) et une DarkCard
// avec l'historique de la période, puis la table + un drawer de détail.
// Le contenu de la table combine "always show NEW" (comme les factures
// impayées) et le filtre de période sur les autres statuts.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const VioletColor = '#7e37fe';

// Kept as a lightweight inner wrapper for the max-width alignment of
// the page content inside the shared Ink shell Stage card.
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

// KPI row shared with Vue d'ensemble · 3 tiles à plat (À qualifier en
// accent violet, Reçus, Validés). À qualifier ignore la période et
// reste toujours visible · les deux autres suivent la période active.
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

// ---------- Feed (style Vue d'ensemble) ----------

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

const FeedRow = styled.button`
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 10px;
  border-radius: 12px;
  transition: background 140ms ease;
  background: transparent;
  border: 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font-family: inherit;
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

const FeedEmpty = styled.div`
  padding: 40px 12px;
  text-align: center;
  color: ${MutedColor};
  font-size: 13.5px;
  line-height: 1.6;
`;

const FeedEmptyTitle = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: ${InkColor};
  margin-bottom: 4px;
`;

// ---------- Table ----------

const TableWrap = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

const TableInner = styled.div`
  @media (max-width: 768px) {
    min-width: 640px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 22px;
  border-bottom: 1px solid ${InkColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
  background: ${InkColor};
  &:first-child {
    border-top-left-radius: 11px;
  }
  &:last-child {
    border-top-right-radius: 11px;
  }
`;

const Td = styled.td`
  padding: 16px 22px;
  border-bottom: 1px solid ${HairlineColor};
  font-size: 13.5px;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:last-child ${Td} {
    border-bottom: 0;
  }
  &:hover ${Td} {
    background: rgba(20, 20, 28, 0.04);
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

const ViewButton = styled.button`
  background: transparent;
  color: ${InkColor};
  border: 1px solid ${HairlineColor};
  padding: 7px 14px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition:
    background 0.12s,
    color 0.12s,
    border-color 0.12s;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
    border-color: ${InkColor};
  }
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

const RightAlign = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
`;

const EmptyStateCell = styled.div`
  padding: 60px 22px;
  text-align: center;
  color: ${MutedColor};
`;

const EmptyStateTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 6px;
  color: ${InkColor};
`;

// ---------- Icons ----------

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ---------- Helpers ----------

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
    const time = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
};

const displayPhone = (rawPhone: unknown): string => {
  if (typeof rawPhone === 'string') return rawPhone;
  if (!rawPhone || typeof rawPhone !== 'object') return '';
  const p = rawPhone as {
    primaryPhoneCallingCode?: string;
    primaryPhoneNumber?: string;
  };
  if (!p.primaryPhoneNumber) return '';
  return `${p.primaryPhoneCallingCode ?? ''} ${p.primaryPhoneNumber}`.trim();
};

// Contact.name arrive soit en string (formulaires legacy Buzzle) soit en
// objet {firstName, lastName} pour les records Twenty · on gère les deux.
const displayName = (rawName: unknown): string => {
  if (typeof rawName === 'string') return rawName.trim();
  if (rawName && typeof rawName === 'object') {
    const n = rawName as { firstName?: string; lastName?: string };
    return `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
  }
  return '';
};

const displayEmail = (rawEmail: unknown): string => {
  if (typeof rawEmail === 'string') return rawEmail;
  if (rawEmail && typeof rawEmail === 'object') {
    const e = rawEmail as { primaryEmail?: string };
    return e.primaryEmail ?? '';
  }
  return '';
};

// Même palette + hashing que la LeadsCard de Vue d'ensemble · garantit
// que Thiérry a la même couleur/initiales des deux côtés.
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


type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleContactsPage = () => {
  const navigate = useNavigate();
  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const contactObject =
    findActiveObjectMetadataItemByNamePlural('contacts') ?? undefined;

  const {
    order: STATUS_ORDER,
    meta: STATUS_META,
    getMeta: getStatusMeta,
  } = useBuzzleStatusConfig();

  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'contact',
    orderBy: [{ createdAt: 'DescNullsLast' }],
    skip: !contactObject,
  });

  const { updateOneRecord } = useUpdateOneRecord();

  const [openStatusMenuFor, setOpenStatusMenuFor] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);

  // Period selector, aligned on the invoices / overview pattern.
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

  const allContacts = records ?? [];

  // Contacts NEW restent visibles quelle que soit la période (comme les
  // factures impayées sur la page Factures). Les autres statuts sont
  // filtrés par la période active.
  const isUnqualified = (r: ObjectRecord) =>
    typeof r.status === 'string' && r.status === 'NEW';

  const visibleContacts = useMemo(
    () =>
      allContacts.filter(
        (r) =>
          isUnqualified(r) ||
          inRange(typeof r.createdAt === 'string' ? r.createdAt : null),
      ),
    [allContacts, periodRange],
  );

  const unqualifiedContacts = useMemo(
    () => allContacts.filter(isUnqualified),
    [allContacts],
  );

  const validatedInPeriod = useMemo(
    () =>
      allContacts.filter(
        (r) =>
          typeof r.status === 'string' &&
          r.status === 'WON' &&
          inRange(typeof r.createdAt === 'string' ? r.createdAt : null),
      ),
    [allContacts, periodRange],
  );

  const pagedRows = useMemo(
    () => visibleContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleContacts, page],
  );

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(visibleContacts.length / PAGE_SIZE),
    );
    if (page > totalPages) setPage(totalPages);
  }, [visibleContacts.length, page]);

  useEffect(() => {
    setPage(1);
  }, [period, customStart, customEnd]);

  const handleStatusChange = async (recordId: string, next: string) => {
    setOpenStatusMenuFor(null);
    try {
      await updateOneRecord({
        objectNameSingular: 'contact',
        idToUpdate: recordId,
        updateOneRecordInput: { status: next },
      });
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.error('[BuzzleContacts] status update failed', error);
    }
  };

  const notInitialised = !contactObject;

  const unqualifiedCount = unqualifiedContacts.length;
  const unqualifiedTrend = unqualifiedCount > 0 ? 'down' : 'up';

  // Badge court reflétant la période active · aligne les tiles Reçus /
  // Validés avec le picker en haut de page.
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

  const unqualifiedSummary =
    unqualifiedCount > 0 ? `${unqualifiedCount} à qualifier` : 'Tout est traité';

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

  return (
    <BuzzleWorkspaceShell>
      <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Formulaires</PageTitle>
        </HeaderText>
        {periodPicker}
      </HeaderRow>

      <KpiRow>
        <Tile data-accent="true">
          <TileLabel>À qualifier</TileLabel>
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
          <TileLabel>Reçus</TileLabel>
          <TileValue>
            {
              allContacts.filter((r) =>
                inRange(
                  typeof r.createdAt === 'string' ? r.createdAt : null,
                ),
              ).length
            }
          </TileValue>
          <TileFooter>
            <TileBadge>{periodLabel}</TileBadge>
          </TileFooter>
        </Tile>

        <Tile>
          <TileLabel>Validés</TileLabel>
          <TileValue>{validatedInPeriod.length}</TileValue>
          <TileFooter>
            <TileBadge>{periodLabel}</TileBadge>
          </TileFooter>
        </Tile>
      </KpiRow>

      <FeedCard>
        {notInitialised && (
          <FeedEmpty>
            <FeedEmptyTitle>
              Ce workspace n'est pas encore initialisé
            </FeedEmptyTitle>
            L'objet Formulaire sera provisionné par Buzzle. Vos leads
            arriveront ici automatiquement.
          </FeedEmpty>
        )}

        {!notInitialised && loading && visibleContacts.length === 0 && (
          <FeedEmpty>Chargement des formulaires.</FeedEmpty>
        )}

        {!notInitialised && !loading && visibleContacts.length === 0 && (
          <FeedEmpty>
            <FeedEmptyTitle>Aucun formulaire sur cette période</FeedEmptyTitle>
            Ajustez le filtre en haut à droite pour élargir la vue.
          </FeedEmpty>
        )}

        {pagedRows.length > 0 && (() => {
          const groups: Array<[string, typeof pagedRows]> = [];
          for (const row of pagedRows) {
            const iso =
              typeof row.createdAt === 'string' ? row.createdAt : null;
            const key = feedGroupLabel(iso);
            const last = groups[groups.length - 1];
            if (last && last[0] === key) {
              last[1].push(row);
            } else {
              groups.push([key, [row]]);
            }
          }
          return groups.map(([day, rows]) => (
            <div key={day}>
              <FeedDayLabel>{day}</FeedDayLabel>
              {rows.map((row) => {
                const rawName = displayName(row.name);
                const name = rawName || 'Sans nom';
                const initials = buildInitials(rawName);
                const email = displayEmail(row.email);
                const phone = displayPhone(row.phone);
                const meta = email || phone || '—';
                const status =
                  typeof row.status === 'string' ? row.status : 'NEW';
                const statusMeta = getStatusMeta(status);
                const isMenuOpen = openStatusMenuFor === row.id;
                const iso =
                  typeof row.createdAt === 'string' ? row.createdAt : null;
                return (
                  <FeedRow
                    key={row.id}
                    type="button"
                    onClick={() => navigate(`/contacts/${row.id}`)}
                  >
                    <FeedAvatar
                      aria-hidden="true"
                      style={{ background: avatarGradient(rawName) }}
                    >
                      {initials}
                    </FeedAvatar>
                    <div>
                      <FeedName>{name}</FeedName>
                      <FeedMeta>{meta}</FeedMeta>
                    </div>
                    <FeedRight onClick={(e) => e.stopPropagation()}>
                      <FeedTime>{feedTimeLabel(iso)}</FeedTime>
                      <StatusPill
                        bg={statusMeta.bg}
                        fg={statusMeta.fg}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuFor(isMenuOpen ? null : row.id);
                        }}
                      >
                        {statusMeta.label}
                        <IconChevronDown />
                        {isMenuOpen && (
                          <StatusMenu onClick={(e) => e.stopPropagation()}>
                            {STATUS_ORDER.map((s) => {
                              const m = STATUS_META[s];
                              return (
                                <StatusMenuItem
                                  key={s}
                                  onClick={() =>
                                    handleStatusChange(row.id, s)
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
        totalItems={visibleContacts.length}
        onPageChange={setPage}
      />

      </Container>
    </BuzzleWorkspaceShell>
  );
};
