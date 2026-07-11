import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';

import { BuzzlePagination } from '@/buzzle-workspace-pages/BuzzlePagination';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const PAGE_SIZE = 10;

// Buzzle Contacts view. Replaces Twenty's native record index with a
// tighter table: date, full name, phone, "voir" button, status pill.
// The right-side modal opens on "voir" and shows every non-empty field
// stored on the contact.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

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

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 40px 48px 60px;
  color: ${InkColor};
  overflow-y: auto;
  > * {
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const Head = styled.div`
  margin-bottom: 28px;
`;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.028em;
  color: ${InkColor};
  margin: 0 0 12px;
  text-transform: none;
`;

const Lede = styled.p`
  margin: 0;
  color: ${MutedColor};
  font-size: 14px;
  max-width: 560px;
  line-height: 1.55;
`;

const TableWrap = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 10px;
  background: ${SurfaceColor};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid ${InkColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
  background: ${InkColor};
  &:first-child {
    border-top-left-radius: 9px;
  }
  &:last-child {
    border-top-right-radius: 9px;
  }
`;

const Td = styled.td`
  padding: 14px 16px;
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
  border-radius: 6px;
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
  padding: 4px 10px 4px 10px;
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
  padding: 64px 16px;
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

const STATUS_DOT_COLOR: Record<string, string> = {
  NEW: '#3d5efc',
  QUOTED: '#5b4bff',
  VALIDATED: '#187a4a',
  CANCELLED: '#8a8b91',
};

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

// Twenty stores PHONE fields as { primaryPhoneNumber, primaryPhoneCountryCode, primaryPhoneCallingCode }.
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
  { key: 'notes', label: 'Notes internes', render: (v) => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const blocks = (v as { blocknote?: string }).blocknote;
      return typeof blocks === 'string' ? blocks : '';
    }
    return '';
  } },
  { key: 'gclid', label: 'Google Click ID', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'fbclid', label: 'Facebook Click ID', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmSource', label: 'UTM Source', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmMedium', label: 'UTM Medium', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmCampaign', label: 'UTM Campaign', render: (v) => (typeof v === 'string' ? v : '') },
];

const InitialState = () => (
  <TableRow>
    <Td colSpan={5}>
      <EmptyStateCell>
        <EmptyStateTitle>Aucun contact pour le moment</EmptyStateTitle>
        Vos futurs leads arriveront ici automatiquement.
      </EmptyStateCell>
    </Td>
  </TableRow>
);

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

  const rows = useMemo(() => records ?? [], [records]);
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

    if (page > totalPages) setPage(totalPages);
  }, [rows.length, page]);

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

  return (
    <Container>
      <Head>
        <PageTitle>Espace · Contacts</PageTitle>
        <Lede>
          Chaque lead recu par vos campagnes apparait ici. Cliquez sur
          l'oeil pour voir le detail du formulaire.
        </Lede>
      </Head>

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
                      Ce workspace n'est pas encore initialise
                    </EmptyStateTitle>
                    L'objet Contact sera provisionne par Buzzle. Vos leads
                    arriveront ici automatiquement.
                  </EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {!notInitialised && loading && rows.length === 0 && (
              <TableRow>
                <Td colSpan={5}>
                  <EmptyStateCell>Chargement des contacts…</EmptyStateCell>
                </Td>
              </TableRow>
            )}

            {!notInitialised && !loading && rows.length === 0 && (
              <InitialState />
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
                          <StatusMenu
                            onClick={(e) => e.stopPropagation()}
                          >
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
        totalItems={rows.length}
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
