import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { useBuzzleStatusConfig } from '@/buzzle-workspace-config/useBuzzleStatusConfig';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

// Buzzle: detail page for a single lead. Replaces the previous inline
// popup/drawer with a dedicated route so each lead has its own URL,
// browser history entry, share-able link. Same design language as the
// rest of the CRM.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 28px 40px 32px;
  color: ${InkColor};
  background: #efede6;
  overflow-y: auto;
  > * {
    max-width: 1120px;
    margin-left: auto;
    margin-right: auto;
  }
  @media (max-width: 768px) {
    padding: 16px 12px 24px;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: transparent;
  color: ${InkColor};
  border: 1px solid ${HairlineColor};
  padding: 8px 14px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
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

const HeaderCard = styled.div`
  background: ${SurfaceColor};
  border: 1px solid ${HairlineColor};
  border-radius: 14px;
  padding: 22px 26px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const ReceivedAt = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const ContactName = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${InkColor};
  margin: 0;
  line-height: 1.15;

  @media (max-width: 768px) {
    font-size: 22px;
    letter-spacing: -0.014em;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const StatusPill = styled.button<{ bg: string; fg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  border: 0;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
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
  min-width: 200px;
  box-shadow: 0 6px 20px rgba(20, 20, 28, 0.12);
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

const Card = styled.div`
  background: ${SurfaceColor};
  border: 1px solid ${HairlineColor};
  border-radius: 14px;
  padding: 22px 26px;
  margin-bottom: 16px;
`;

const CardTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin: 0 0 14px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 26px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  padding: 12px 0;
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
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.5;
`;

const IconArrowLeft = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconChevronDown = () => (
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
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const formatDateTime = (iso?: string | null) => {
  if (iso === null || iso === undefined || iso === '') return '';
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
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

const displayPhone = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw === null || raw === undefined || typeof raw !== 'object') return '';
  const p = raw as {
    primaryPhoneCallingCode?: string;
    primaryPhoneNumber?: string;
  };
  return `${p.primaryPhoneCallingCode ?? ''} ${p.primaryPhoneNumber ?? ''}`.trim();
};

const displayEmail = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw === null || raw === undefined || typeof raw !== 'object') return '';
  const e = raw as { primaryEmail?: string };
  return e.primaryEmail ?? '';
};

const displayAmount = (raw: unknown): string => {
  if (raw === null || raw === undefined || typeof raw !== 'object') return '';
  const q = raw as { amountMicros?: number | null; currencyCode?: string | null };
  if (q.amountMicros === null || q.amountMicros === undefined) return '';
  const amount = q.amountMicros / 1_000_000;
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${q.currencyCode ?? 'EUR'}`;
};

const displayNotes = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw !== null && typeof raw === 'object') {
    const blocks = (raw as { blocknote?: string }).blocknote;
    return typeof blocks === 'string' ? blocks : '';
  }
  return '';
};

type DetailField = {
  key: string;
  label: string;
  full?: boolean;
  render: (raw: unknown) => string;
};

const COORDINATES_FIELDS: DetailField[] = [
  { key: 'email', label: 'Email', render: displayEmail },
  { key: 'phone', label: 'Téléphone', render: displayPhone },
];

const CONTEXT_FIELDS: DetailField[] = [
  {
    key: 'message',
    label: 'Message reçu',
    full: true,
    render: (v) => (typeof v === 'string' ? v : ''),
  },
  {
    key: 'notes',
    label: 'Notes internes',
    full: true,
    render: displayNotes,
  },
  {
    key: 'quoteAmount',
    label: 'Montant du devis',
    render: displayAmount,
  },
];

const ATTRIBUTION_FIELDS: DetailField[] = [
  { key: 'gclid', label: 'Google Click ID', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'fbclid', label: 'Facebook Click ID', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmSource', label: 'UTM Source', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmMedium', label: 'UTM Medium', render: (v) => (typeof v === 'string' ? v : '') },
  { key: 'utmCampaign', label: 'UTM Campaign', render: (v) => (typeof v === 'string' ? v : '') },
  {
    key: 'octPushedAt',
    label: 'Conversion Google Ads',
    render: (v) => (typeof v === 'string' && v.length > 0 ? formatDateTime(v) : ''),
  },
];

const renderCard = (
  title: string,
  fields: DetailField[],
  record: Record<string, unknown>,
) => {
  const rows = fields
    .map((f) => ({ ...f, value: f.render(record[f.key]) }))
    .filter((f) => f.value !== '');
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <FieldGrid>
        {rows.map(({ key, label, value, full }) => (
          <Field key={key} data-full={full === true ? '' : undefined}>
            <FieldLabel>{label}</FieldLabel>
            <FieldValue>{value}</FieldValue>
          </Field>
        ))}
      </FieldGrid>
    </Card>
  );
};

export const BuzzleContactDetailPage = () => {
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  const {
    order: STATUS_ORDER,
    meta: STATUS_META,
    getMeta: getStatusMeta,
  } = useBuzzleStatusConfig();

  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const { record, loading, refetch } = useFindOneRecord({
    objectNameSingular: 'contact',
    objectRecordId: contactId,
    skip: contactId === undefined,
  });

  const { updateOneRecord } = useUpdateOneRecord();

  // Close the status menu on outside click / Escape for a proper feel.
  useEffect(() => {
    if (!openStatusMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenStatusMenu(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openStatusMenu]);

  const handleStatusChange = async (next: string) => {
    if (contactId === undefined) return;
    setOpenStatusMenu(false);
    setPendingStatus(next);
    try {
      await updateOneRecord({
        objectNameSingular: 'contact',
        idToUpdate: contactId,
        updateOneRecordInput: { status: next },
      });
      await refetch();
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.error('[BuzzleContactDetail] status update failed', error);
    } finally {
      setPendingStatus(null);
    }
  };

  if (loading && record === undefined) {
    return (
      <Container>
        <TopRow>
          <BackButton onClick={() => navigate('/contacts')}>
            <IconArrowLeft />
            Retour
          </BackButton>
          <BuzzleWorkspacesButton hideOnMobile />
        </TopRow>
        <Card>
          <EmptyState>Chargement du contact…</EmptyState>
        </Card>
      </Container>
    );
  }

  if (record === undefined) {
    return (
      <Container>
        <TopRow>
          <BackButton onClick={() => navigate('/contacts')}>
            <IconArrowLeft />
            Retour
          </BackButton>
          <BuzzleWorkspacesButton hideOnMobile />
        </TopRow>
        <Card>
          <EmptyState>
            Ce contact est introuvable — il a peut-être été supprimé ou vous
            n'y avez pas accès depuis cet espace.
          </EmptyState>
        </Card>
      </Container>
    );
  }

  const statusValue =
    (pendingStatus ??
      (typeof record.status === 'string' ? record.status : 'NEW')) as string;
  const statusMeta = getStatusMeta(statusValue);
  const contactName =
    typeof record.name === 'string' && record.name.trim() !== ''
      ? record.name
      : 'Contact sans nom';

  return (
    <Container>
      <TopRow>
        <BackButton onClick={() => navigate('/contacts')}>
          <IconArrowLeft />
          Retour aux contacts
        </BackButton>
        <BuzzleWorkspacesButton hideOnMobile />
      </TopRow>

      <HeaderCard>
        <HeaderText>
          <ReceivedAt>
            Reçu le {formatDateTime(record.createdAt as string | null)}
          </ReceivedAt>
          <ContactName>{contactName}</ContactName>
        </HeaderText>
        <HeaderActions>
          <StatusPill
            bg={statusMeta.bg}
            fg={statusMeta.fg}
            onClick={(e) => {
              e.stopPropagation();
              setOpenStatusMenu((prev) => !prev);
            }}
          >
            {statusMeta.label}
            <IconChevronDown />
            {openStatusMenu && (
              <StatusMenu onClick={(e) => e.stopPropagation()}>
                {STATUS_ORDER.map((s) => {
                  const m = STATUS_META[s];
                  return (
                    <StatusMenuItem
                      key={s}
                      onClick={() => handleStatusChange(s)}
                    >
                      <StatusDot color={m.dot} />
                      {m.label}
                    </StatusMenuItem>
                  );
                })}
              </StatusMenu>
            )}
          </StatusPill>
        </HeaderActions>
      </HeaderCard>

      {renderCard('Coordonnées', COORDINATES_FIELDS, record)}
      {renderCard('Contexte du lead', CONTEXT_FIELDS, record)}
      {renderCard('Attribution', ATTRIBUTION_FIELDS, record)}
    </Container>
  );
};
