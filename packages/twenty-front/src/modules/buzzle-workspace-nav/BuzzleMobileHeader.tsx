import { styled } from '@linaria/react';

import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

// Mobile header for the Buzzle CRM. Sticky Ink bar laid out as a
// 3-column grid so the wordmark stays perfectly centred no matter how
// wide the hamburger or the workspace switcher get. Hamburger flips to
// a cross when the drawer is open.

const InkColor = '#14141c';

const Header = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  // Safe-area iOS : barre de statut translucide (le fond Ink remonte
  // derrière) · on décale le contenu sous l'encoche/heure.
  padding: calc(10px + env(safe-area-inset-top)) 14px 10px 14px;
  background: ${InkColor};
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const HamburgerButton = styled.button`
  justify-self: start;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 8px;
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
  justify-self: center;
  display: inline-flex;
  align-items: center;
`;

const LogoImg = styled.img`
  height: 30px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

const WorkspaceSlot = styled.div`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  color: #ffffff;
`;

const IconMenu = () => (
  <svg
    width="18"
    height="18"
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
    width="18"
    height="18"
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
        <BuzzleWorkspacesButton size="lg" />
      </WorkspaceSlot>
    </Header>
  );
};
