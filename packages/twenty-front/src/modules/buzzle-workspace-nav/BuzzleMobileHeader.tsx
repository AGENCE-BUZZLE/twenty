import { styled } from '@linaria/react';
import { atom, useAtom } from 'jotai';
import { Avatar } from 'twenty-ui/data-display';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { DEFAULT_WORKSPACE_LOGO } from '@/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

// Mobile header for the Buzzle CRM. Replaces Twenty's bottom
// MobileNavigationBar with an Ink header on top: hamburger left, Buzzle
// wordmark centered, workspace avatar right. Tapping the hamburger
// toggles the drawer via `buzzleMobileDrawerOpenState`, which the
// DefaultLayout listens to so it can slide the drawer in as an overlay.

export const buzzleMobileDrawerOpenState = atom<boolean>(false);

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
  justify-content: center;
  min-width: 0;
`;

const LogoImg = styled.img`
  height: 22px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

const WorkspaceButton = styled.div`
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  overflow: hidden;
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
  const [isOpen, setIsOpen] = useAtom(buzzleMobileDrawerOpenState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  return (
    <Header>
      <HamburgerButton
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IconMenu />
      </HamburgerButton>
      <LogoWrap>
        <LogoImg src="/images/buzzle-white.png" alt="Buzzle" />
      </LogoWrap>
      <WorkspaceButton
        aria-label={currentWorkspace?.displayName ?? 'Workspace'}
        title={currentWorkspace?.displayName ?? 'Workspace'}
      >
        <Avatar
          placeholder={currentWorkspace?.displayName ?? ''}
          avatarUrl={getAbsoluteImageUrl(
            currentWorkspace?.logo ?? DEFAULT_WORKSPACE_LOGO,
          )}
          size="md"
        />
      </WorkspaceButton>
    </Header>
  );
};
