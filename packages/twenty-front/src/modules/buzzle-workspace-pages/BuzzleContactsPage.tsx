import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
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

const STATUS_META: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  NEW: { label: 'Nouveau', bg: '#e3ecff', fg: '#1a3fb0' },
  QUOTED: { label: 'Devis envoyé', bg: '#ede4ff', fg: '#4a2fb8' },
  VALIDATED: { label: 'Validé', bg: '#e0f3e5', fg: '#136d34' },
  CANCELLED: { label: 'Annulé', bg: '#efede6', fg: '#57574f' },
};
const STATUS_ORDER = ['NEW', 'QUOTED', 'VALIDATED', 'CANCELLED'];

const STATUS_DOT_COLOR: Record<string, string> = {
  NEW: '#3d5efc',
  QUOTED: '#5b4bff',
  VALIDATED: '#187a4a',
  CANCELLED: '#8a8b91',
};

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

const TableWrap = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
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

// ---------- Drawer ----------

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 28, 0.35);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Drawer = styled.div`
  width: 460px;
  max-width: 100vw;
  height: 100%;
  background: ${SurfaceColor};
  border-left: 1px solid ${HairlineColor};
  padding: 28px 32px 32px;
  overflow-y: auto;
`;

const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const DrawerTitle = styled.h2`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: 1px solid ${HairlineColor};
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  color: ${InkColor};
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
    border-color: ${InkColor};
  }
`;

const FieldRow = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${HairlineColor};
  &:last-child {
    border-bottom: 0;
  }
`;

const FieldLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 4px;
`;

const FieldValue = styled.div`
  color: ${InkColor};
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
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

  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'contact',
    orderBy: [{ createdAt: 'DescNullsLast' }],
    skip: !contactObject,
  });

  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: 'contact',
  });

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
          r.status === 'VALIDATED' &&
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
        idToUpdate: recordId,
        updateOneRecordInput: { status: next },
      });
    } catch {
      // no-op; toast handled globally
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
                    <CustomPopoverLabel htmlFor="buzzle-contacts-range-start">
                      Du
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-contacts-range-start"
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </CustomPopoverRow>
                  <CustomPopoverRow>
                    <CustomPopoverLabel htmlFor="buzzle-contacts-range-end">
                      Au
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-contacts-range-end"
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
        <Table>
          <thead>
            <tr>
              <Th style={{ width: 200 }}>Date</Th>
              <Th>Nom complet</Th>
              <Th style={{ width: 200 }}>Téléphone</Th>
              <Th style={{ width: 240, textAlign: 'right' }}>Détail</Th>
              <Th style={{ width: 160, textAlign: 'right' }}>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {notInitialised && (
              <TableRow>
                <Td colSpan={5}>
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
                <Td colSpan={5}>
                  <EmptyStateCell>Chargement des contacts.</EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {!notInitialised && !loading && visibleContacts.length === 0 && (
              <TableRow>
                <Td colSpan={5}>
                  <EmptyStateCell>
                    <EmptyStateTitle>Aucun contact sur cette période</EmptyStateTitle>
                    Ajustez le filtre en haut à droite pour élargir la vue.
                  </EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {pagedRows.map((row) => {
              const status = typeof row.status === 'string' ? row.status : 'NEW';
              const meta = STATUS_META[status] ?? STATUS_META.NEW;
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
                    <PhoneCell>{displayPhone(row.phone)}</PhoneCell>
                  </Td>
                  <Td>
                    <RightAlign>
                      <ViewButton onClick={() => setDetailRecord(row)}>
                        <IconEye /> Voir les informations
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
                                  <StatusDot color={STATUS_DOT_COLOR[s]} />
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
      </TableWrap>

      <BuzzlePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={visibleContacts.length}
        onPageChange={setPage}
      />

      {detailRecord && (
        <Backdrop onClick={() => setDetailRecord(null)}>
          <Drawer onClick={(e) => e.stopPropagation()}>
            <DrawerHead>
              <DrawerTitle>
                {(typeof detailRecord.name === 'string' && detailRecord.name) ||
                  'Détail du contact'}
              </DrawerTitle>
              <CloseButton onClick={() => setDetailRecord(null)}>
                <IconClose /> Fermer
              </CloseButton>
            </DrawerHead>
            <FieldRow>
              <FieldLabel>Reçu le</FieldLabel>
              <FieldValue>{formatDateTime(detailRecord.createdAt)}</FieldValue>
            </FieldRow>
            {DETAIL_FIELDS.map(({ key, label, render }) => {
              const value = render(detailRecord[key]);
              if (!value) return null;
              return (
                <FieldRow key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <FieldValue>{value}</FieldValue>
                </FieldRow>
              );
            })}
          </Drawer>
        </Backdrop>
      )}
    </Container>
  );
};
