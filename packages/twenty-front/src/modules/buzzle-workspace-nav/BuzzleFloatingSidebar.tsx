import { styled } from '@linaria/react';
import { useEffect, type ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconCalendarEvent,
  IconFileText,
  IconHome,
  IconPhone,
  IconUsers,
  IconWorldWww,
} from 'twenty-ui/icon';

import { currentUserState } from '@/auth/states/currentUserState';
import { BuzzleFloatingSettingsPill } from '@/buzzle-workspace-nav/BuzzleFloatingSettingsPill';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { buzzleSidebarExpandedState } from '@/buzzle-workspace-nav/states/buzzleSidebarExpandedState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

import { useBuzzleWorkspacePages } from './useBuzzleWorkspacePages';

// Floating pill sidebar used on the /overview shell. Each nav item is
// an icon-only pill (56x56) with a tooltip label on hover. Active item
// is Ink filled with white icon. Locked items are dimmed and inert.
// Mobile keeps the drawer + hamburger flow from DefaultLayout · this
// component only shows on desktop.

const Column = styled.nav`
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: stretch;
  z-index: 2;

  &[data-expanded='true'] {
    width: 100%;
  }

  // Sur mobile la sidebar devient un drawer overlay full-height ·
  // slide-in depuis la gauche quand data-expanded est true, sinon
  // masquée complètement.
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    padding: 72px 14px 24px 14px;
    gap: 4px;
    background: #14141c;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 12px 0 32px rgba(0, 0, 0, 0.24);
    z-index: 60;
    transform: translateX(-100%);
    transition: transform 220ms ease;
    overflow-y: auto;

    &[data-expanded='true'] {
      transform: translateX(0);
    }
  }
`;

const Spacer = styled.div`
  flex: 1 1 auto;
  min-height: 12px;
`;

// Footer row · sur mobile on aligne le workspace switcher (à gauche,
// pill étirée) et la settings pill (à droite, carrée) sur la même
// ligne en bas du drawer. Sur desktop, seule la settings pill est
// visible (le workspace vit dans le top bar Ink).
const FooterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MobileWorkspaceSlot = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    flex: 1 1 auto;
    min-width: 0;

    button {
      width: 100%;
      justify-content: flex-start;
    }
  }
`;

const Pill = styled.button`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: rgba(20, 20, 28, 0.6);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease,
    width 200ms ease;
  backdrop-filter: blur(8px);
  padding: 0;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-align: left;

  &:hover {
    color: #14141c;
    transform: translateY(-1px);
  }

  &[data-active='true'] {
    background: #ffffff;
    color: #7e37fe;
    border-color: rgba(126, 55, 254, 0.35);
    box-shadow: 0 6px 22px rgba(126, 55, 254, 0.28);
  }

  &[data-locked='true'] {
    background: rgba(255, 255, 255, 0.5);
    color: rgba(20, 20, 28, 0.35);
    cursor: not-allowed;
  }
  &[data-locked='true']:hover {
    transform: none;
    color: rgba(20, 20, 28, 0.35);
  }

  // When the sidebar is expanded (data-expanded='true' on the parent
  // Column), the pill turns into a horizontal row that fills the
  // widened column with an icon-slot + label. Height stays 56px so the
  // vertical rhythm matches the icon-only state.
  &[data-expanded='true'] {
    width: 100%;
    height: 56px;
    border-radius: 16px;
    display: grid;
    grid-template-columns: 32px 1fr auto;
    gap: 12px;
    place-items: center start;
    padding: 0 14px;
  }

  // Sur mobile (drawer noir), plus de fond blanc / bordure / shadow ·
  // juste l'icon + le label alignés à gauche, en blanc, avec un léger
  // hover à peine visible. L'item actif reste en violet léger.
  @media (max-width: 768px) {
    background: transparent;
    border: 0;
    box-shadow: none;
    color: rgba(255, 255, 255, 0.85);
    height: 48px;
    border-radius: 12px;
    padding: 0 12px;
    backdrop-filter: none;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      transform: none;
    }

    &[data-active='true'] {
      background: rgba(126, 55, 254, 0.16);
      color: #ffffff;
      border-color: transparent;
      box-shadow: none;
    }

    &[data-locked='true'] {
      background: transparent;
      color: rgba(255, 255, 255, 0.35);
    }
    &[data-locked='true']:hover {
      background: transparent;
      color: rgba(255, 255, 255, 0.35);
    }
  }
`;

const Dot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7e37fe;
  box-shadow: 0 0 0 2px #ffffff;
`;

const Tip = styled.span`
  position: absolute;
  left: 66px;
  top: 50%;
  transform: translateY(-50%);
  background: #14141c;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
  z-index: 4;

  ${Pill}:hover & {
    opacity: 1;
    transform: translateY(-50%) translateX(2px);
  }
`;

const InlineLabel = styled.span`
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export type BuzzleNavItem = {
  key: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  path: string;
  badge?: boolean;
  locked?: boolean;
};

type NavItem = BuzzleNavItem;

export const BUZZLE_NAV_ITEMS: BuzzleNavItem[] = [
  { key: 'home', label: "Vue d'ensemble", Icon: IconHome, path: '/overview' },
  { key: 'contacts', label: 'Formulaires', Icon: IconUsers, path: '/contacts' },
  {
    key: 'calls',
    label: 'Appels',
    Icon: IconPhone,
    path: '/calls',
    locked: true,
  },
  { key: 'invoices', label: 'Factures', Icon: IconFileText, path: '/invoices' },
  {
    key: 'rdv',
    label: 'Rendez-vous',
    Icon: IconCalendarEvent,
    path: '/rendez-vous',
    locked: true,
  },
  {
    key: 'seo',
    label: 'Audit SEO/GEO',
    Icon: IconWorldWww,
    path: '/audit-seo-geo',
    locked: true,
  },
];

const items = BUZZLE_NAV_ITEMS;

const isMobileMatch = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(max-width: 768px)').matches;
};

export const BuzzleFloatingSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Super admins have access to every locked destination · the lock is
  // only there to hide the WIP pages from client users.
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel === true;
  // Pages ouvertes pour cet espace, decidees dans Buzzle Copilot.
  const openedPages = useBuzzleWorkspacePages();
  const [expanded, setExpanded] = useAtomState(buzzleSidebarExpandedState);

  // Sur mobile, le drawer se ferme après chaque navigation pour laisser
  // la place au contenu de la page. Sur desktop on garde l'état choisi.
  useEffect(() => {
    if (isMobileMatch() && expanded) {
      setExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Les labels doivent toujours s'afficher dans le drawer mobile ·
  // desktop conserve le toggle icon-only / label.
  const showLabels = expanded || isMobileMatch();

  const isActive = (path: string): boolean => {
    if (path === '/overview') {
      return location.pathname === '/overview' || location.pathname === '/';
    }
    return (
      location.pathname.startsWith(path) ||
      (path === '/contacts' && location.pathname.startsWith('/objects/contacts'))
    );
  };

  // Une page fermee disparait du menu : un cadenas dit au client qu'il existe
  // quelque chose qu'on lui refuse, ce qui appelle la question. La decision
  // prise dans Copilot vaut pour tout le monde, super admin compris. Le
  // drapeau compile ne sert que de repli, quand le cockpit n'a rien dit.
  const estVisible = (item: NavItem): boolean => {
    const opened = openedPages?.[item.key];
    return opened === undefined ? item.locked !== true || isSuperAdmin : opened;
  };

  const visibles = items.filter(estVisible);

  const handleClick = (item: NavItem) => {
    navigate(item.path);
  };

  return (
    <Column aria-label="Navigation principale" data-expanded={expanded}>
      {visibles.map((item) => {
        const IconCmp = item.Icon;
        const active = isActive(item.path);
        return (
          <Pill
            key={item.key}
            type="button"
            data-active={active}
            data-expanded={showLabels}
            onClick={() => handleClick(item)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <IconCmp size={22} />
            {showLabels && <InlineLabel>{item.label}</InlineLabel>}
            {!showLabels && item.badge && <Dot />}
            {!showLabels && <Tip>{item.label}</Tip>}
          </Pill>
        );
      })}
      <Spacer />
      <FooterRow>
        <MobileWorkspaceSlot>
          <BuzzleWorkspacesButton variant="pill" />
        </MobileWorkspaceSlot>
        <BuzzleFloatingSettingsPill />
      </FooterRow>
    </Column>
  );
};
