import { styled } from '@linaria/react';

import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

// Mobile header for the Buzzle CRM. Replaces Twenty's bottom
// MobileNavigationBar with an Ink header on top: hamburger left, Buzzle
// wordmark centered. The workspace avatar is intentionally not shown
// here because the same switcher already lives in each page's beige
// header (avoids visual duplication). The hamburger toggles Twenty's
// `isNavigationDrawerExpandedState` so the drawer content is actually
// mounted with the correct width, unlike a custom overlay.

const InkColor = '#14141c';

const Header = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: ${InkColor};
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const HamburgerButton = styled.button`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const LogoWrap = styled.div`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 4px;
  min-width: 0;
`;

const LogoImg = styled.img`
  height: 22px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

const IconMenu = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const BuzzleMobileHeader = () => {
  const [isExpanded, setIsExpanded] = useAtomState(
    isNavigationDrawerExpandedState,
  );

  return (
    <Header>
      <HamburgerButton
        aria-label={isExpanded ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <IconMenu />
      </HamburgerButton>
      <LogoWrap>
        <LogoImg src="/images/buzzle-white.png" alt="Buzzle" />
      </LogoWrap>
    </Header>
  );
};
