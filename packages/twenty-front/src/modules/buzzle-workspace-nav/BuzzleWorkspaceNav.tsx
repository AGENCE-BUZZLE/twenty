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
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

import { useBuzzleWorkspacePages } from './useBuzzleWorkspacePages';

// Fixed Buzzle drawer nav (client-side). Pipeline and Mon profil are
// intentionally absent: the pipeline lives inside the Contacts view via
// status filtering, and profile settings live under the workspace
// dropdown "Parametres" entry.

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
  margin-bottom: 20px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.82);
  transition: background 0.1s, color 0.1s;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
  }
`;

const LockedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.35);
  cursor: not-allowed;
  user-select: none;
`;

const IconWrap = styled.span`
  opacity: 0.72;
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
`;

type NavItem = {
  label: string;
  Icon: ComponentType<{ size?: number }>;
  path: string;
  badge?: string;
  locked?: boolean;
  // Key used by Buzzle Copilot to open or close that page per workspace.
  key: string;
};

const items: NavItem[] = [
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

const LockBadge = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.45);
`;

const NavBadge = styled.span`
  margin-left: auto;
  background: #7e37fe;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 999px;
`;

const activeStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#ffffff',
  fontWeight: 500,
};

const activeIconStyle: React.CSSProperties = {
  opacity: 1,
  color: '#ffffff',
};

export const BuzzleWorkspaceNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const setIsDrawerExpanded = useSetAtomState(isNavigationDrawerExpandedState);
  // Super admins bypass every "locked" flag · those pages are only
  // hidden to protect the client-facing view.
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel === true;
  // Per-workspace decision, taken in Buzzle Copilot. Null while loading or
  // when the cockpit is unreachable: the compiled `locked` flags then apply.
  const openedPages = useBuzzleWorkspacePages();

  const handleClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsDrawerExpanded(false);
    }
  };

  const renderItem = (item: NavItem) => {
    const IconCmp = item.Icon;
    // A decision taken in Copilot applies to everyone, super admins included:
    // hiding a page must show what the client actually sees. Only the compiled
    // fallback keeps the admin bypass, so nobody is locked out by a network
    // hiccup.
    const opened = openedPages?.[item.key];
    const locked =
      opened === undefined ? item.locked === true && !isSuperAdmin : !opened;

    if (locked) {
      return (
        <LockedItem
          key={item.path}
          aria-disabled="true"
          title="Bientôt disponible"
        >
          <IconWrap>
            <IconCmp size={15} />
          </IconWrap>
          {item.label}
          <LockBadge aria-hidden="true">
            <IconLock size={13} />
          </LockBadge>
        </LockedItem>
      );
    }

    // Consider a nav item active when the current path starts with it,
    // so /objects/contacts still keeps "Contacts" highlighted when the
    // scaffold redirects to the native record index (temporary during
    // the migration to the custom BuzzleContactsPage).
    const isActive =
      item.path === '/overview'
        ? location.pathname === '/overview' || location.pathname === '/'
        : location.pathname.startsWith(item.path) ||
          (item.path === '/contacts' &&
            location.pathname.startsWith('/objects/contacts'));

    return (
      <Item
        key={item.path}
        style={isActive ? activeStyle : undefined}
        onClick={() => handleClick(item.path)}
      >
        <IconWrap style={isActive ? activeIconStyle : undefined}>
          <IconCmp size={15} />
        </IconWrap>
        {item.label}
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
      </Item>
    );
  };

  return (
    <Section>{items.map(renderItem)}</Section>
  );
};
