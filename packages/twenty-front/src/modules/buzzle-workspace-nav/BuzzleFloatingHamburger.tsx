import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconLayoutList, IconLock } from 'twenty-ui/icon';

import { currentUserState } from '@/auth/states/currentUserState';
import {
  BUZZLE_NAV_ITEMS,
  type BuzzleNavItem,
} from '@/buzzle-workspace-nav/BuzzleFloatingSidebar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Hamburger control living in the top-left of the Ink shell (grid col 1
// row 1). Click pops a floating drawer to the right listing every nav
// destination with its full label so a user can navigate without
// hovering the icon-only pills to read the tooltip.

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  justify-self: start;
  z-index: 3;
`;

const Pill = styled.button`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  &[data-open='true'] {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.28);
  }
`;

const Menu = styled.div`
  position: absolute;
  top: 0;
  left: calc(100% + 12px);
  min-width: 260px;
  background: #ffffff;
  color: #14141c;
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.2);
  z-index: 40;
  border: 1px solid rgba(20, 20, 28, 0.08);
  display: flex;
  flex-direction: column;
`;

const MenuHeader = styled.div`
  padding: 10px 12px 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(20, 20, 28, 0.55);
`;

const MenuItem = styled.button`
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: #14141c;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  transition: background 120ms ease;

  &:hover {
    background: rgba(20, 20, 28, 0.05);
  }
  &[data-active='true'] {
    background: rgba(126, 55, 254, 0.08);
    color: #7e37fe;
  }
  &[data-locked='true'] {
    color: rgba(20, 20, 28, 0.4);
    cursor: not-allowed;
  }
  &[data-locked='true']:hover {
    background: transparent;
  }
`;

const MenuLock = styled.span`
  display: inline-flex;
  color: rgba(20, 20, 28, 0.4);
`;

export const BuzzleFloatingHamburger = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel === true;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isActive = (path: string): boolean => {
    if (path === '/overview') {
      return location.pathname === '/overview' || location.pathname === '/';
    }
    return (
      location.pathname.startsWith(path) ||
      (path === '/contacts' && location.pathname.startsWith('/objects/contacts'))
    );
  };

  const isReallyLocked = (item: BuzzleNavItem): boolean =>
    item.locked === true && !isSuperAdmin;

  const handleClick = (item: BuzzleNavItem) => {
    if (isReallyLocked(item)) return;
    setOpen(false);
    navigate(item.path);
  };

  return (
    <Wrap ref={ref}>
      <Pill
        type="button"
        data-open={open}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
      >
        <IconLayoutList size={22} />
      </Pill>
      {open && (
        <Menu role="menu">
          <MenuHeader>Navigation</MenuHeader>
          {BUZZLE_NAV_ITEMS.map((item) => {
            const IconCmp = item.Icon;
            const active = isActive(item.path);
            const locked = isReallyLocked(item);
            return (
              <MenuItem
                key={item.key}
                type="button"
                data-active={active}
                data-locked={locked}
                onClick={() => handleClick(item)}
                aria-disabled={locked}
              >
                <IconCmp size={17} />
                <span>{item.label}</span>
                {locked ? (
                  <MenuLock aria-hidden="true">
                    <IconLock size={14} />
                  </MenuLock>
                ) : (
                  <span />
                )}
              </MenuItem>
            );
          })}
        </Menu>
      )}
    </Wrap>
  );
};
