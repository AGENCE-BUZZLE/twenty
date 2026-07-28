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

// Floating pill sidebar used on the /overview shell. Each nav item is
// an icon-only pill (56x56) with a tooltip label on hover. Active item
// is Ink filled with white icon. Locked items are dimmed and inert.
// Mobile keeps the drawer + hamburger flow from DefaultLayout — this
// component only shows on desktop.

const Column = styled.nav`
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: start;
  z-index: 2;
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
    transform 160ms ease;
  backdrop-filter: blur(8px);
  padding: 0;

  &:hover {
    color: #14141c;
    transform: translateY(-1px);
  }

  &[data-active='true'] {
    background: #14141c;
    color: #ffffff;
    border-color: #14141c;
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
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

type NavItem = {
  key: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  path: string;
  badge?: boolean;
  locked?: boolean;
};

const items: NavItem[] = [
  { key: 'home', label: "Vue d'ensemble", Icon: IconHome, path: '/overview' },
  { key: 'contacts', label: 'Contacts', Icon: IconUsers, path: '/contacts' },
  {
    key: 'calls',
    label: 'Appels · Beta',
    Icon: IconPhone,
    path: '/calls',
    badge: true,
  },
  { key: 'invoices', label: 'Factures', Icon: IconFileText, path: '/invoices' },
  {
    key: 'rdv',
    label: 'Rendez-vous · Bientôt',
    Icon: IconCalendarEvent,
    path: '/rendez-vous',
    locked: true,
  },
  {
    key: 'seo',
    label: 'Audit SEO/GEO · Bientôt',
    Icon: IconWorldWww,
    path: '/audit-seo-geo',
    locked: true,
  },
];

export const BuzzleFloatingSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === '/overview') {
      return location.pathname === '/overview' || location.pathname === '/';
    }
    return (
      location.pathname.startsWith(path) ||
      (path === '/contacts' && location.pathname.startsWith('/objects/contacts'))
    );
  };

  const handleClick = (item: NavItem) => {
    if (item.locked === true) return;
    navigate(item.path);
  };

  return (
    <Column aria-label="Navigation principale">
      {items.map((item) => {
        const IconCmp = item.Icon;
        const active = isActive(item.path);
        return (
          <Pill
            key={item.key}
            type="button"
            data-active={active}
            data-locked={item.locked === true}
            onClick={() => handleClick(item)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            aria-disabled={item.locked === true}
          >
            <IconCmp size={22} />
            {item.badge && <Dot />}
            {item.locked === true && (
              <LockCorner aria-hidden="true">
                <IconLock size={11} />
              </LockCorner>
            )}
            <Tip>{item.label}</Tip>
          </Pill>
        );
      })}
    </Column>
  );
};
