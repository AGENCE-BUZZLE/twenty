import { styled } from '@linaria/react';
import type { ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconCalendarEvent,
  IconFileText,
  IconHome,
  IconLock,
  IconPhone,
  IconUsers,
  IconWorldWww,
} from 'twenty-ui/icon';

import { currentUserState } from '@/auth/states/currentUserState';
import { BuzzleFloatingSettingsPill } from '@/buzzle-workspace-nav/BuzzleFloatingSettingsPill';
import { buzzleSidebarExpandedState } from '@/buzzle-workspace-nav/states/buzzleSidebarExpandedState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

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
`;

const Spacer = styled.div`
  flex: 1 1 auto;
  min-height: 12px;
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

const LockCorner = styled.span`
  position: absolute;
  bottom: 6px;
  right: 6px;
  color: rgba(20, 20, 28, 0.4);
  display: inline-flex;
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

export const BuzzleFloatingSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Super admins have access to every locked destination · the lock is
  // only there to hide the WIP pages from client users.
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel === true;
  const expanded = useAtomStateValue(buzzleSidebarExpandedState);

  const isActive = (path: string): boolean => {
    if (path === '/overview') {
      return location.pathname === '/overview' || location.pathname === '/';
    }
    return (
      location.pathname.startsWith(path) ||
      (path === '/contacts' && location.pathname.startsWith('/objects/contacts'))
    );
  };

  const isReallyLocked = (item: NavItem): boolean =>
    item.locked === true && !isSuperAdmin;

  const handleClick = (item: NavItem) => {
    if (isReallyLocked(item)) return;
    navigate(item.path);
  };

  return (
    <Column aria-label="Navigation principale" data-expanded={expanded}>
      {items.map((item) => {
        const IconCmp = item.Icon;
        const active = isActive(item.path);
        const locked = isReallyLocked(item);
        return (
          <Pill
            key={item.key}
            type="button"
            data-active={active}
            data-locked={locked}
            data-expanded={expanded}
            onClick={() => handleClick(item)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            aria-disabled={locked}
          >
            <IconCmp size={22} />
            {expanded && <InlineLabel>{item.label}</InlineLabel>}
            {expanded && locked && <IconLock size={14} />}
            {!expanded && item.badge && <Dot />}
            {!expanded && locked && (
              <LockCorner aria-hidden="true">
                <IconLock size={11} />
              </LockCorner>
            )}
            {!expanded && <Tip>{item.label}</Tip>}
          </Pill>
        );
      })}
      <Spacer />
      <BuzzleFloatingSettingsPill />
    </Column>
  );
};
