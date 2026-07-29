import { styled } from '@linaria/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBell } from 'twenty-ui/icon';

import { BuzzleFloatingSidebar } from '@/buzzle-workspace-nav/BuzzleFloatingSidebar';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { useBuzzleUnreadLeads } from '@/buzzle-workspace-nav/useBuzzleUnreadLeads';

// Shared Ink shell wrapper: renders the pill sidebar + logo top-bar +
// notifications dropdown + workspace switcher pill around a white Stage
// card. Any workspace page can drop its own content in the Stage by
// wrapping its return with <BuzzleWorkspaceShell>...</BuzzleWorkspaceShell>.
// The DefaultLayout activates the Ink background + hides the default
// drawer nav for the routes that render this shell.

const InkColor = '#14141c';

const ShellGrid = styled.div`
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  height: 100dvh;
  display: grid;
  grid-template-columns: 76px 1fr;
  grid-template-rows: auto 1fr;
  column-gap: 16px;
  row-gap: 14px;
  padding: 20px;
  align-items: stretch;
  overflow: hidden;
  color: ${InkColor};
  box-sizing: border-box;

  @media (max-width: 768px) {
    height: auto;
    min-height: 100dvh;
    overflow-y: auto;
  }
`;

const LogoBlock = styled.div`
  grid-column: 1;
  grid-row: 1;
  height: 64px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  width: max-content;
  z-index: 3;
`;

const LogoImg = styled.img`
  height: 44px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;

  @media (max-width: 768px) {
    height: 34px;
  }
`;

const Actions = styled.div`
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 64px;
  z-index: 2;

  > button,
  > div > button {
    height: 40px !important;
  }
  > button:hover,
  > div > button:hover {
    background: #ffffff !important;
  }
`;

const NotifWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const NotifChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid #14141c;
  background: #ffffff;
  color: #14141c;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
`;

const NotifCount = styled.span`
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #7e37fe;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
  padding: 0 5px;
  margin-left: 2px;

  &[data-empty='true'] {
    background: rgba(20, 20, 28, 0.14);
    color: rgba(20, 20, 28, 0.55);
  }
`;

const NotifMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 320px;
  max-width: 380px;
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.12);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.16);
  padding: 6px;
  z-index: 40;
  display: flex;
  flex-direction: column;
`;

const NotifMenuHead = styled.div`
  padding: 10px 12px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const NotifMenuTitle = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: #14141c;
`;

const NotifMenuAction = styled.button`
  background: transparent;
  border: 0;
  color: #7e37fe;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  &:hover:not(:disabled) {
    background: rgba(126, 55, 254, 0.08);
  }
  &:disabled {
    color: rgba(20, 20, 28, 0.35);
    cursor: not-allowed;
  }
`;

const NotifList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
  padding: 4px 4px 6px;
  gap: 2px;
`;

const NotifItem = styled.button`
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
  &:hover {
    background: rgba(20, 20, 28, 0.04);
  }
`;

const NotifAvatar = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
`;

const NotifName = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: #14141c;
`;

const NotifTime = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  color: rgba(20, 20, 28, 0.55);
  white-space: nowrap;
`;

const NotifEmpty = styled.div`
  padding: 22px 12px;
  text-align: center;
  color: rgba(20, 20, 28, 0.55);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
`;

const WorkspaceWrap = styled.div`
  --t-gray-scale-gray3: #ffffff;
  --t-color-gray3: #ffffff;
  --t-gray-scale-gray2: #f6f6fb;
  --t-color-gray2: #f6f6fb;
  --t-gray-scale-gray4: #f0f0f6;
  --t-color-gray4: #f0f0f6;
  --t-font-color-primary: #14141c;
  --t-font-color-secondary: rgba(20, 20, 28, 0.72);
  --t-font-color-tertiary: rgba(20, 20, 28, 0.5);
  --t-background-primary: #ffffff;
  --t-background-secondary: #f6f6fb;
  --t-background-tertiary: #f0f0f6;
  --t-background-transparent-light: rgba(20, 20, 28, 0.04);
  --t-background-transparent-medium: rgba(20, 20, 28, 0.08);
  --t-border-color-light: rgba(20, 20, 28, 0.08);
  --t-border-color-medium: rgba(20, 20, 28, 0.14);
`;

const Stage = styled.main`
  grid-column: 2;
  grid-row: 2;
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  border-radius: 28px;
  padding: 26px 30px 36px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  color: ${InkColor};

  @media (max-width: 768px) {
    overflow-y: visible;
  }
`;

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7e37fe 0%, #4b1fb0 100%)',
  'linear-gradient(135deg, #16a34a 0%, #065f46 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
];

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
};

const avatarGradient = (name: string): string =>
  AVATAR_GRADIENTS[hashName(name || '?') % AVATAR_GRADIENTS.length];

const avatarInitials = (name: string): string => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatRelative = (iso: string): string => {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "à l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
};

type BuzzleWorkspaceShellProps = {
  topExtras?: ReactNode;
  children: ReactNode;
};

export const BuzzleWorkspaceShell = ({
  topExtras,
  children,
}: BuzzleWorkspaceShellProps) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { unread, count, markAllRead, markOneRead } = useBuzzleUnreadLeads();

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (event: MouseEvent) => {
      if (
        notifRef.current !== null &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  return (
    <ShellGrid>
      <LogoBlock aria-label="Buzzle CRM">
        <LogoImg src="/images/buzzle-crm-white.png" alt="Buzzle CRM" />
      </LogoBlock>
      <Actions>
        {topExtras}
        <NotifWrap ref={notifRef}>
          <NotifChip
            type="button"
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <IconBell size={16} />
            <span>Notifications</span>
            <NotifCount data-empty={count === 0}>{count}</NotifCount>
          </NotifChip>
          {notifOpen && (
            <NotifMenu role="menu">
              <NotifMenuHead>
                <NotifMenuTitle>Nouveaux leads</NotifMenuTitle>
                <NotifMenuAction
                  type="button"
                  disabled={count === 0}
                  onClick={() => markAllRead()}
                >
                  Tout marquer comme lu
                </NotifMenuAction>
              </NotifMenuHead>
              {count === 0 ? (
                <NotifEmpty>Aucun nouveau lead pour le moment.</NotifEmpty>
              ) : (
                <NotifList>
                  {unread.map((lead) => (
                    <NotifItem
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        markOneRead(lead.createdAt);
                        setNotifOpen(false);
                        navigate(`/contacts/${lead.id}`);
                      }}
                    >
                      <NotifAvatar
                        style={{ background: avatarGradient(lead.name) }}
                      >
                        {avatarInitials(lead.name)}
                      </NotifAvatar>
                      <NotifName>{lead.name}</NotifName>
                      <NotifTime>{formatRelative(lead.createdAt)}</NotifTime>
                    </NotifItem>
                  ))}
                </NotifList>
              )}
            </NotifMenu>
          )}
        </NotifWrap>
        <WorkspaceWrap>
          <BuzzleWorkspacesButton hideOnMobile variant="pill" />
        </WorkspaceWrap>
      </Actions>
      <BuzzleFloatingSidebar />
      <Stage>{children}</Stage>
    </ShellGrid>
  );
};
