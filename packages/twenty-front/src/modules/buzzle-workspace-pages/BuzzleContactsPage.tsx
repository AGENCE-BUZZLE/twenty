import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
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
  @media (max-width: 768px) {
    padding: 16px 12px 24px;
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

const PhoneCell = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  color: ${InkColor};
`;

const ViewButton = styled.button`
  background: transparent;
  color: ${InkColor};
  border: 1px solid ${HairlineColor};
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
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

// ---------- Modal (centered detail view) ----------

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 28, 0.48);
  backdrop-filter: blur(2px);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: buzzle-modal-fade 0.14s ease-out;

  @keyframes buzzle-modal-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  width: 100%;
  max-width: 640px;
  max-height: min(85vh, 720px);
  background: ${SurfaceColor};
  border-radius: 14px;
  box-shadow:
    0 24px 48px rgba(20, 20, 28, 0.28),
    0 4px 12px rgba(20, 20, 28, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: buzzle-modal-rise 0.18s ease-out;

  @keyframes buzzle-modal-rise {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ModalHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px 18px;
  border-bottom: 1px solid ${HairlineColor};
`;

const ModalTitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const ModalTitle = styled.h2`
  font-family: 'Inter Tight', sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.014em;
  color: ${InkColor};
  margin: 0;
  line-height: 1.15;
`;

const ModalSubtitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${MutedColor};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
    color: ${InkColor};
  }
`;

const ModalBody = styled.div`
  padding: 8px 26px 22px;
  overflow-y: auto;
  flex: 1 1 auto;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 22px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const FieldRow = styled.div`
  padding: 14px 0;
  border-bottom: 1px solid ${HairlineColor};

  &[data-full] {
    grid-column: 1 / -1;
  }
  &:last-child {
    border-bottom: 0;
  }
`;

const FieldLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 6px;
`;

const FieldValue = styled.div`
  color: ${InkColor};
  font-size: 13.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

// ---------- Icons ----------

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconArrowUp = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 11 12 6 7 11" />
    <line x1="12" y1="18" x2="12" y2="6" />
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

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
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

const displayEmail = (rawEmail: unknown): string => {
  if (typeof rawEmail === 'string') return rawEmail;
  if (!rawEmail || typeof rawEmail !== 'object') return '';
  const e = rawEmail as { primaryEmail?: string };
  return e.primaryEmail ?? '';
};

const displayAmount = (rawAmount: unknown): string => {
  if (!rawAmount || typeof rawAmount !== 'object') return '';
  const a = rawAmount as { amountMicros?: number; currencyCode?: string };
  if (typeof a.amountMicros !== 'number') return '';
  const value = a.amountMicros / 1_000_000;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: a.currencyCode ?? 'EUR',
    }).format(value);
  } catch {
    return `${value}`;
  }
};

const DETAIL_FIELDS: Array<{
  key: string;
  label: string;
  render: (raw: unknown) => string;
}> = [
  { key: 'email', label: 'Email', render: displayEmail },
  { key: 'phone', label: 'Téléphone', render: displayPhone },
  { key: 'message', label: 'Message', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'quoteAmount', label: 'Montant du devis', render: displayAmount },
  {
    key: 'notes',
    label: 'Notes internes',
    render: (v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') {
        const blocks = (v as { blocknote?: string }).blocknote;
        return typeof blocks === 'string' ? blocks : '';
      }
      return '';
    },
  },
  { key: 'gclid', label: 'Google Click ID', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'fbclid', label: 'Facebook Click ID', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmSource', label: 'UTM Source', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmMedium', label: 'UTM Medium', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmCampaign', label: 'UTM Campaign', render: (v) => (typeof v === 'string' ? v : '') },
];

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleContactsPage = () => {
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

  const [detailRecord, setDetailRecord] = useState<ObjectRecord | null>(null);
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
  const unqualifiedSummary =
    unqualifiedCount > 0 ? `${unqualifiedCount} à qualifier` : 'Tout est traité';

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Contacts</PageTitle>
        </HeaderText>
        <HeaderActions>
          <BuzzlePeriodPicker
            period={period}
            onPeriodChange={setPeriod}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <BuzzleWorkspacesButton hideOnMobile />
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
            <VioletLabel>À qualifier</VioletLabel>
            <VioletValue>{unqualifiedCount}</VioletValue>
            {unqualifiedCount > 0 ? (
              <VioletSub>
                {unqualifiedCount} lead{unqualifiedCount > 1 ? 's' : ''} en
                attente de qualification, quelle que soit la période.
              </VioletSub>
            ) : (
              <VioletSub>
                Tous les leads reçus ont été qualifiés, bon travail.
              </VioletSub>
            )}
          </div>
        </VioletCard>

        <DarkCard>
          <DarkCardHead>
            <div>
              <DarkCardTitle>Historique</DarkCardTitle>
              <DarkCardSub>
                Contacts reçus et qualifiés sur la période active
              </DarkCardSub>
            </div>
          </DarkCardHead>

          <AssetGrid>
            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(126, 55, 254, 0.28)" color="#c9b7ff">
                  <IconUsers />
                </AssetIcon>
                <div>
                  <AssetName>Reçus</AssetName>
                </div>
              </AssetHead>
              <AssetValue>
                {
                  allContacts.filter((r) =>
                    inRange(
                      typeof r.createdAt === 'string' ? r.createdAt : null,
                    ),
                  ).length
                }
              </AssetValue>
            </AssetCard>

            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(34, 185, 114, 0.24)" color="#a7f4c9">
                  <IconCheck />
                </AssetIcon>
                <div>
                  <AssetName>Validés</AssetName>
                </div>
              </AssetHead>
              <AssetValue>{validatedInPeriod.length}</AssetValue>
            </AssetCard>
          </AssetGrid>
        </DarkCard>
      </Grid>

      <TableWrap>
        <TableInner>
        <Table>
          <thead>
            <tr>
              <Th style={{ width: 200 }}>Date</Th>
              <Th>Nom complet</Th>
              <Th style={{ width: 240, textAlign: 'right' }}>Informations</Th>
              <Th style={{ width: 160, textAlign: 'right' }}>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {notInitialised && (
              <TableRow>
                <Td colSpan={4}>
                  <EmptyStateCell>
                    <EmptyStateTitle>
                      Ce workspace n'est pas encore initialisé
                    </EmptyStateTitle>
                    L'objet Contact sera provisionné par Buzzle. Vos leads
                    arriveront ici automatiquement.
                  </EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {!notInitialised && loading && visibleContacts.length === 0 && (
              <TableRow>
                <Td colSpan={4}>
                  <EmptyStateCell>Chargement des contacts.</EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {!notInitialised && !loading && visibleContacts.length === 0 && (
              <TableRow>
                <Td colSpan={4}>
                  <EmptyStateCell>
                    <EmptyStateTitle>Aucun contact sur cette période</EmptyStateTitle>
                    Ajustez le filtre en haut à droite pour élargir la vue.
                  </EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {pagedRows.map((row) => {
              const status = typeof row.status === 'string' ? row.status : 'NEW';
              const meta = getStatusMeta(status);
              const isMenuOpen = openStatusMenuFor === row.id;
              return (
                <TableRow key={row.id}>
                  <Td>
                    <DateCell>{formatDateTime(row.createdAt)}</DateCell>
                  </Td>
                  <Td>
                    <NameCell>
                      {typeof row.name === 'string'
                        ? row.name || '(Sans nom)'
                        : '(Sans nom)'}
                    </NameCell>
                  </Td>
                  <Td>
                    <RightAlign>
                      <ViewButton onClick={() => setDetailRecord(row)}>
                        <IconEye /> Voir les infos
                      </ViewButton>
                    </RightAlign>
                  </Td>
                  <Td>
                    <RightAlign>
                      <StatusPill
                        bg={meta.bg}
                        fg={meta.fg}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuFor(isMenuOpen ? null : row.id);
                        }}
                      >
                        {meta.label}
                        <IconChevronDown />
                        {isMenuOpen && (
                          <StatusMenu onClick={(e) => e.stopPropagation()}>
                            {STATUS_ORDER.map((s) => {
                              const m = STATUS_META[s];
                              return (
                                <StatusMenuItem
                                  key={s}
                                  onClick={() => handleStatusChange(row.id, s)}
                                >
                                  <StatusDot color={m.dot} />
                                  {m.label}
                                </StatusMenuItem>
                              );
                            })}
                          </StatusMenu>
                        )}
                      </StatusPill>
                    </RightAlign>
                  </Td>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        </TableInner>
      </TableWrap>

      <BuzzlePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={visibleContacts.length}
        onPageChange={setPage}
      />

      {detailRecord &&
        (() => {
          const detailStatus =
            typeof detailRecord.status === 'string' ? detailRecord.status : 'NEW';
          const detailStatusMeta = getStatusMeta(detailStatus);
          const isDetailMenuOpen = openStatusMenuFor === `detail-${detailRecord.id}`;
          const activeFields = DETAIL_FIELDS.map(({ key, label, render }) => ({
            key,
            label,
            value: render(detailRecord[key]),
          })).filter((f) => f.value !== '');
          return (
            <Backdrop onClick={() => setDetailRecord(null)}>
              <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHead>
                  <ModalTitleWrap>
                    <ModalSubtitle>
                      Reçu le {formatDateTime(detailRecord.createdAt)}
                    </ModalSubtitle>
                    <ModalTitle>
                      {(typeof detailRecord.name === 'string' &&
                        detailRecord.name) ||
                        'Détail du contact'}
                    </ModalTitle>
                    <div>
                      <StatusPill
                        bg={detailStatusMeta.bg}
                        fg={detailStatusMeta.fg}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuFor(
                            isDetailMenuOpen ? null : `detail-${detailRecord.id}`,
                          );
                        }}
                      >
                        {detailStatusMeta.label}
                        <IconChevronDown />
                        {isDetailMenuOpen && (
                          <StatusMenu onClick={(e) => e.stopPropagation()}>
                            {STATUS_ORDER.map((s) => {
                              const m = STATUS_META[s];
                              return (
                                <StatusMenuItem
                                  key={s}
                                  onClick={() =>
                                    handleStatusChange(detailRecord.id, s)
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
                    </div>
                  </ModalTitleWrap>
                  <CloseButton
                    onClick={() => setDetailRecord(null)}
                    aria-label="Fermer"
                  >
                    <IconClose />
                  </CloseButton>
                </ModalHead>
                <ModalBody>
                  <FieldGrid>
                    {activeFields.map(({ key, label, value }) => {
                      const isLong = value.length > 60 || key === 'message' || key === 'notes';
                      return (
                        <FieldRow key={key} data-full={isLong ? '' : undefined}>
                          <FieldLabel>{label}</FieldLabel>
                          <FieldValue>{value}</FieldValue>
                        </FieldRow>
                      );
                    })}
                    {activeFields.length === 0 && (
                      <FieldRow data-full>
                        <FieldValue>
                          Aucune information supplémentaire pour ce contact.
                        </FieldValue>
                      </FieldRow>
                    )}
                  </FieldGrid>
                </ModalBody>
              </Modal>
            </Backdrop>
          );
        })()}
    </Container>
  );
};
