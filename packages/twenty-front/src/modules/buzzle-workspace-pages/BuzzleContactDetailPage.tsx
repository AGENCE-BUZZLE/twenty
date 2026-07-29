import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { currentUserState } from '@/auth/states/currentUserState';
import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';
import { useBuzzleUnreadLeads } from '@/buzzle-workspace-nav/useBuzzleUnreadLeads';
import { useBuzzleStatusConfig } from '@/buzzle-workspace-config/useBuzzleStatusConfig';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle: dedicated lead detail page. One unified card with two columns
// (identity + context on the left, map + attribution on the right). The
// map pins the postal code parsed from the lead's message via France's
// free public geocoder (api-adresse.data.gouv.fr · no API key needed).

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

// Kept as a lightweight inner wrapper for max-width alignment inside
// the shared Ink shell Stage card.
const Container = styled.div`
  width: 100%;
  color: ${InkColor};
  > * {
    max-width: 1120px;
    margin-left: auto;
    margin-right: auto;
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
  border: 0;
  padding: 4px 2px;
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.12s;
  &:hover {
    opacity: 0.7;
  }
`;

const Card = styled.div`
  background: ${SurfaceColor};
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  overflow: hidden;
`;

// Two-column body: left identity + info, right map + attribution.
const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const LeftCol = styled.div`
  padding: 26px 30px 28px;
  min-width: 0;
`;

const RightCol = styled.div`
  background: #fafaf7;
  border-left: 1px solid rgba(20, 20, 28, 0.08);
  padding: 26px 26px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 900px) {
    border-left: 0;
    border-top: 1px solid rgba(20, 20, 28, 0.08);
  }
`;

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
`;

const HeaderIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const HeaderAvatar = styled.span`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  flex-shrink: 0;
`;

const HeaderText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ContactName = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${InkColor};
  margin: 0;
  line-height: 1.15;

  @media (max-width: 768px) {
    font-size: 20px;
    letter-spacing: -0.016em;
  }
`;

const ReceivedAt = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: ${MutedColor};
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
  flex-shrink: 0;
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

// Info rows · clean, tight, no bordered cards.
const Section = styled.section`
  padding-top: 18px;
  border-top: 1px solid rgba(20, 20, 28, 0.08);
  margin-top: 18px;

  &:first-of-type {
    border-top: 0;
    padding-top: 0;
    margin-top: 0;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${InkColor};
  margin: 0 0 12px;
`;

const KVGrid = styled.dl`
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  row-gap: 10px;
  column-gap: 16px;
  margin: 0;

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 4px;
  }
`;

const KVLabel = styled.dt`
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: ${MutedColor};
  padding-top: 2px;
`;

const KVValue = styled.dd`
  color: ${InkColor};
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(20, 20, 28, 0.35);
  }
`;

const LongBlock = styled.div`
  color: ${InkColor};
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

// Map card
const MapFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  overflow: hidden;
  background: #efede6;
  border: 1px solid rgba(20, 20, 28, 0.08);

  /* OSM's embed iframe injects its own attribution strip at the very
     bottom ("Signaler un problème · © Contributeurs OpenStreetMap · Faire
     un don"). We can't style cross-origin iframe content, so we extend
     the iframe past the container and clip that strip via overflow. */
  iframe {
    position: absolute;
    inset: 0 0 -40px 0;
    width: 100%;
    height: calc(100% + 40px);
    border: 0;
    display: block;
  }
`;

const MapCaption = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: ${MutedColor};
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MapPlaceholder = styled.div`
  padding: 30px 16px;
  text-align: center;
  color: ${MutedColor};
  font-size: 13px;
  line-height: 1.5;
`;

// External search button · surfaces the plate in a Google search that
// often reveals the vehicle model via LeBonCoin/Argus/AutoScout listings.
const PlateSearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const PlateChip = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  background: #14141c;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  border: 2px solid #14141c;
  box-shadow: inset 0 0 0 2px #ffffff;
`;

const PlateSearchLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid ${HairlineColor};
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${InkColor};
  background: transparent;
  cursor: pointer;
  text-decoration: none;
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

// Super-admin only drawer at the bottom of the fiche lead · hides
// technical attribution data (gclid, UTMs, OCT push) from clients.
const AdminDrawerCard = styled.div`
  background: ${SurfaceColor};
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  margin-top: 16px;
  overflow: hidden;
`;

const AdminDrawerToggle = styled.button`
  width: 100%;
  background: transparent;
  color: ${InkColor};
  border: 0;
  padding: 16px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${InkColor};
  transition: background 0.12s;
  &:hover {
    background: rgba(20, 20, 28, 0.04);
  }
`;

const AdminDrawerToggleLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const AdminDrawerBadge = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: ${InkColor};
  color: ${SurfaceColor};
  padding: 3px 8px;
  border-radius: 999px;
`;

const AdminDrawerChevron = styled.span<{ open: boolean }>`
  display: inline-flex;
  transition: transform 0.2s;
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const AdminDrawerBody = styled.div`
  padding: 4px 22px 20px;
  border-top: 1px solid rgba(20, 20, 28, 0.08);
`;

const AttributionMono = styled.code`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: ${InkColor};
  background: rgba(20, 20, 28, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
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

const IconSearch = () => (
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
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

const IconPin = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
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

// Même palette + hashing que la LeadsCard de Vue d'ensemble · garantit
// que le nom aura les mêmes initiales et le même dégradé sur la fiche
// et sur les listes Formulaires / Appels.
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

// Extract a French 5-digit postal code from arbitrary text. Falls back
// to any 5-digit run if the "Code postal :" prefix is absent.
const extractPostalCode = (text: unknown): string | null => {
  if (typeof text !== 'string' || text.length === 0) return null;
  const labelled = text.match(/code\s*postal\s*[:\-]?\s*(\d{5})/i);
  if (labelled !== null) return labelled[1];
  const any = text.match(/\b(\d{5})\b/);
  return any !== null ? any[1] : null;
};

// Extract a French license plate from the "Vehicule :" line of the lead
// message. Supports both SIV format (AB-123-CD / AB 123 CD / AB123CD)
// and pre-2009 FNI format (0000 ABC 00). Returns a canonical dashed
// representation ready for a search URL.
const extractPlate = (text: unknown): string | null => {
  if (typeof text !== 'string' || text.length === 0) return null;
  const up = text.toUpperCase();
  const siv = up.match(/\b([A-Z]{2})[\s-]?(\d{3})[\s-]?([A-Z]{2})\b/);
  if (siv !== null) return `${siv[1]}-${siv[2]}-${siv[3]}`;
  const fni = up.match(/\b(\d{1,4})[\s-]?([A-Z]{1,3})[\s-]?(\d{1,3})\b/);
  if (fni !== null) return `${fni[1]} ${fni[2]} ${fni[3]}`;
  return null;
};

type GeoResult = { lat: number; lon: number; city: string };

// Look up a French postal code via api-adresse.data.gouv.fr (free, no key,
// government service, no CORS restriction).
const geocodePostal = async (postal: string): Promise<GeoResult | null> => {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(postal)}&type=municipality&limit=1`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { city?: string; name?: string; label?: string };
      }>;
    };
    const feat = data.features?.[0];
    const coords = feat?.geometry?.coordinates;
    if (!coords) return null;
    const [lon, lat] = coords;
    const city = feat?.properties?.city ?? feat?.properties?.name ?? feat?.properties?.label ?? postal;
    return { lat, lon, city };
  } catch {
    return null;
  }
};

const useGeocodedPostal = (postal: string | null) => {
  const [state, setState] = useState<{
    loading: boolean;
    result: GeoResult | null;
  }>({ loading: postal !== null, result: null });

  useEffect(() => {
    let cancelled = false;
    if (postal === null) {
      setState({ loading: false, result: null });
      return;
    }
    setState({ loading: true, result: null });
    void geocodePostal(postal).then((result) => {
      if (!cancelled) setState({ loading: false, result });
    });
    return () => {
      cancelled = true;
    };
  }, [postal]);

  return state;
};

const osmEmbedUrl = ({ lat, lon }: GeoResult) => {
  // Small bounding box around the pin for a city-level zoom.
  const d = 0.04;
  const left = lon - d;
  const right = lon + d;
  const top = lat + d * 0.7;
  const bottom = lat - d * 0.7;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
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
  const [attributionOpen, setAttributionOpen] = useState(false);

  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel === true;

  const { record, loading, refetch } = useFindOneRecord({
    objectNameSingular: 'contact',
    objectRecordId: contactId,
    skip: contactId === undefined,
  });

  const { updateOneRecord } = useUpdateOneRecord();

  // Opening a lead's detail page counts as reading it · bump the
  // notifications cursor so this lead disappears from the top-bar bell.
  const { markOneRead } = useBuzzleUnreadLeads();
  useEffect(() => {
    if (record !== undefined && typeof record.createdAt === 'string') {
      markOneRead(record.createdAt);
    }
  }, [record, markOneRead]);

  useEffect(() => {
    if (!openStatusMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenStatusMenu(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openStatusMenu]);

  const messageText =
    record !== undefined && typeof record.message === 'string'
      ? record.message
      : '';
  const postal = useMemo(() => extractPostalCode(messageText), [messageText]);
  const plate = useMemo(() => extractPlate(messageText), [messageText]);
  const geo = useGeocodedPostal(postal);

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
      <BuzzleWorkspaceShell>
        <Container>
          <TopRow>
            <BackButton onClick={() => navigate('/contacts')}>
              <IconArrowLeft />
              Retour
            </BackButton>
          </TopRow>
          <Card>
            <EmptyState>Chargement du contact…</EmptyState>
          </Card>
        </Container>
      </BuzzleWorkspaceShell>
    );
  }

  if (record === undefined) {
    return (
      <BuzzleWorkspaceShell>
        <Container>
          <TopRow>
            <BackButton onClick={() => navigate('/contacts')}>
              <IconArrowLeft />
              Retour
            </BackButton>
          </TopRow>
          <Card>
            <EmptyState>
              Ce contact est introuvable · il a peut-être été supprimé ou
              vous n'y avez pas accès depuis cet espace.
            </EmptyState>
          </Card>
        </Container>
      </BuzzleWorkspaceShell>
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

  const email = displayEmail(record.email);
  const phone = displayPhone(record.phone);
  const amount = displayAmount(record.quoteAmount);
  const notes = displayNotes(record.notes);
  const gclid = typeof record.gclid === 'string' ? record.gclid : '';
  const fbclid = typeof record.fbclid === 'string' ? record.fbclid : '';
  const utmSource = typeof record.utmSource === 'string' ? record.utmSource : '';
  const utmMedium = typeof record.utmMedium === 'string' ? record.utmMedium : '';
  const utmCampaign =
    typeof record.utmCampaign === 'string' ? record.utmCampaign : '';
  const octPushedAt =
    typeof record.octPushedAt === 'string' ? record.octPushedAt : '';

  const hasAttribution =
    gclid !== '' ||
    fbclid !== '' ||
    utmSource !== '' ||
    utmMedium !== '' ||
    utmCampaign !== '' ||
    octPushedAt !== '';

  return (
    <BuzzleWorkspaceShell>
      <Container>
      <TopRow>
        <BackButton onClick={() => navigate('/contacts')}>
          <IconArrowLeft />
          Retour aux formulaires
        </BackButton>
      </TopRow>

      <Card>
        <Body>
          <LeftCol>
            <HeaderBlock>
              <HeaderIdentity>
                <HeaderAvatar
                  aria-hidden="true"
                  style={{ background: avatarGradient(contactName) }}
                >
                  {buildInitials(contactName)}
                </HeaderAvatar>
                <HeaderText>
                  <ContactName>{contactName}</ContactName>
                  <ReceivedAt>
                    Reçu le {formatDateTime(record.createdAt as string | null)}
                  </ReceivedAt>
                </HeaderText>
              </HeaderIdentity>
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
            </HeaderBlock>

            <Section>
              <SectionTitle>Coordonnées</SectionTitle>
              <KVGrid>
                {email !== '' && (
                  <>
                    <KVLabel>Email</KVLabel>
                    <KVValue>
                      <a href={`mailto:${email}`}>{email}</a>
                    </KVValue>
                  </>
                )}
                {phone !== '' && (
                  <>
                    <KVLabel>Téléphone</KVLabel>
                    <KVValue>
                      <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                    </KVValue>
                  </>
                )}
                {postal !== null && (
                  <>
                    <KVLabel>Code postal</KVLabel>
                    <KVValue>
                      {postal}
                      {geo.result !== null && ` · ${geo.result.city}`}
                    </KVValue>
                  </>
                )}
                {email === '' && phone === '' && postal === null && (
                  <KVValue>Aucune coordonnée renseignée.</KVValue>
                )}
              </KVGrid>
            </Section>

            {messageText !== '' && (
              <Section>
                <SectionTitle>Message reçu</SectionTitle>
                <LongBlock>{messageText}</LongBlock>
              </Section>
            )}

            {(notes !== '' || amount !== '') && (
              <Section>
                <SectionTitle>Contexte commercial</SectionTitle>
                <KVGrid>
                  {amount !== '' && (
                    <>
                      <KVLabel>Montant devis</KVLabel>
                      <KVValue>{amount}</KVValue>
                    </>
                  )}
                  {notes !== '' && (
                    <>
                      <KVLabel>Notes internes</KVLabel>
                      <KVValue>{notes}</KVValue>
                    </>
                  )}
                </KVGrid>
              </Section>
            )}
          </LeftCol>

          <RightCol>
            {postal !== null ? (
              <div>
                <SectionTitle>Localisation</SectionTitle>
                {geo.loading && (
                  <MapFrame>
                    <MapPlaceholder>Chargement de la carte…</MapPlaceholder>
                  </MapFrame>
                )}
                {!geo.loading && geo.result !== null && (
                  <>
                    <MapFrame>
                      <iframe
                        title={`Carte ${geo.result.city}`}
                        src={osmEmbedUrl(geo.result)}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </MapFrame>
                    <MapCaption>
                      <IconPin />
                      {geo.result.city} · {postal}
                    </MapCaption>
                  </>
                )}
                {!geo.loading && geo.result === null && (
                  <MapFrame>
                    <MapPlaceholder>
                      Impossible de localiser le code postal {postal}.
                    </MapPlaceholder>
                  </MapFrame>
                )}
              </div>
            ) : (
              <div>
                <SectionTitle>Localisation</SectionTitle>
                <MapFrame>
                  <MapPlaceholder>
                    Aucun code postal renseigné dans le message.
                  </MapPlaceholder>
                </MapFrame>
              </div>
            )}

          </RightCol>
        </Body>
      </Card>

      {isSuperAdmin && hasAttribution && (
        <AdminDrawerCard>
          <AdminDrawerToggle
            onClick={() => setAttributionOpen((prev) => !prev)}
            aria-expanded={attributionOpen}
          >
            <AdminDrawerToggleLeft>
              <AdminDrawerBadge>Admin</AdminDrawerBadge>
              Attribution
            </AdminDrawerToggleLeft>
            <AdminDrawerChevron open={attributionOpen}>
              <IconChevronDown />
            </AdminDrawerChevron>
          </AdminDrawerToggle>
          {attributionOpen && (
            <AdminDrawerBody>
              <KVGrid>
                {gclid !== '' && (
                  <>
                    <KVLabel>gclid</KVLabel>
                    <KVValue>
                      <AttributionMono>{gclid.slice(0, 32)}…</AttributionMono>
                    </KVValue>
                  </>
                )}
                {fbclid !== '' && (
                  <>
                    <KVLabel>fbclid</KVLabel>
                    <KVValue>
                      <AttributionMono>{fbclid.slice(0, 32)}…</AttributionMono>
                    </KVValue>
                  </>
                )}
                {utmSource !== '' && (
                  <>
                    <KVLabel>utm source</KVLabel>
                    <KVValue>{utmSource}</KVValue>
                  </>
                )}
                {utmMedium !== '' && (
                  <>
                    <KVLabel>utm medium</KVLabel>
                    <KVValue>{utmMedium}</KVValue>
                  </>
                )}
                {utmCampaign !== '' && (
                  <>
                    <KVLabel>utm campaign</KVLabel>
                    <KVValue>{utmCampaign}</KVValue>
                  </>
                )}
                {octPushedAt !== '' && (
                  <>
                    <KVLabel>Google Ads</KVLabel>
                    <KVValue>{formatDateTime(octPushedAt)}</KVValue>
                  </>
                )}
              </KVGrid>
            </AdminDrawerBody>
          )}
        </AdminDrawerCard>
      )}
      </Container>
    </BuzzleWorkspaceShell>
  );
};
