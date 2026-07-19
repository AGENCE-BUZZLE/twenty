import { styled } from '@linaria/react';

import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

// Mobile header for the Buzzle CRM. Sticky Ink bar with hamburger left,
// Buzzle wordmark centered, workspace switcher on the right. The switcher
// lives only here on mobile (pages hide their own copy) so the beige
// header on each page stays clean. Hamburger flips to a cross when the
// drawer is open so the user can close it from the same button.

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

// The switcher trigger is styled for a light background; on the Ink
// header we invert its currentColor so the ring / hover stay legible.
const WorkspaceSlot = styled.div`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  color: #ffffff;
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

const IconClose = () => (
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
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
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
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <IconClose /> : <IconMenu />}
      </HamburgerButton>
      <LogoWrap>
        <LogoImg src="/images/buzzle-white.png" alt="Buzzle" />
      </LogoWrap>
      <WorkspaceSlot>
        <BuzzleWorkspacesButton />
      </WorkspaceSlot>
    </Header>
  );
};
