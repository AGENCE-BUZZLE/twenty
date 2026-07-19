import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from 'twenty-ui/data-display';

import { availableWorkspacesState } from '@/auth/states/availableWorkspacesState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useBuzzleImpersonateWorkspace } from '@/buzzle-admin/hooks/useBuzzleImpersonateWorkspace';
import { DEFAULT_WORKSPACE_LOGO } from '@/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { type AvailableWorkspace } from '~/generated-metadata/graphql';

// Buzzle: header trigger listing only the workspaces available to the
// current super admin. Workspace creation is handled from Claude / the
// backend cockpit, not from this menu. No Profil / Membres / Langue —
// those live in the sidebar Paramètres footer.
// Paramètres footer.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Wrap = styled.div<{ hideOnMobile?: boolean }>`
  position: relative;
  display: inline-block;

  ${({ hideOnMobile }) =>
    hideOnMobile === true
      ? `@media (max-width: 768px) { display: none; }`
      : ''}
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: ${InkColor};
  cursor: pointer;
  padding: 0;
  transition: opacity 0.12s;
  &:hover {
    opacity: 0.75;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 260px;
  max-width: min(320px, calc(100vw - 24px));
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.14);
  z-index: 40;

  @media (max-width: 480px) {
    min-width: 240px;
  }
`;

const MenuHead = styled.div`
  padding: 8px 10px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  background: transparent;
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const ActiveTag = styled.span`
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

type BuzzleWorkspacesButtonProps = {
  hideOnMobile?: boolean;
};

export const BuzzleWorkspacesButton = ({
  hideOnMobile = false,
}: BuzzleWorkspacesButtonProps = {}) => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const availableWorkspaces = useAtomStateValue(availableWorkspacesState);
  const { openWorkspace, pendingWorkspaceId } = useBuzzleImpersonateWorkspace();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const goTo = (target: AvailableWorkspace) => {
    // Impersonation path: mints a fresh loginToken scoped to the target
    // workspace and lands on `<target>/verify?loginToken=…`, which is
    // what actually rewrites the local tokenPair. A plain redirect here
    // leaked data across tenants (browser reused the source workspace
    // JWT when localStorage had none for the target subdomain).
    setOpen(false);
    void openWorkspace(target.id);
  };

  const list = [
    ...availableWorkspaces.availableWorkspacesForSignIn,
    ...availableWorkspaces.availableWorkspacesForSignUp,
  ];

  return (
    <Wrap ref={wrapRef} hideOnMobile={hideOnMobile}>
      <Trigger
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={currentWorkspace?.displayName || 'Workspace'}
        title={currentWorkspace?.displayName || 'Workspace'}
      >
        <Avatar
          placeholder={currentWorkspace?.displayName || ''}
          avatarUrl={getAbsoluteImageUrl(
            currentWorkspace?.logo ?? DEFAULT_WORKSPACE_LOGO,
          )}
          size="md"
        />
      </Trigger>
      {open && (
        <Menu role="menu">
          <MenuHead>Workspaces disponibles</MenuHead>
          {list.length === 0 && (
            <MenuItem disabled>
              <div>
                Aucun autre workspace pour le moment.
              </div>
            </MenuItem>
          )}
          {list.map((workspace) => {
            const isActive = workspace.id === currentWorkspace?.id;
            const isSwitching = pendingWorkspaceId === workspace.id;

            return (
              <MenuItem
                key={workspace.id}
                disabled={pendingWorkspaceId !== null}
                onClick={() => (isActive ? setOpen(false) : goTo(workspace))}
              >
                <Avatar
                  placeholder={workspace.displayName || ''}
                  avatarUrl={getAbsoluteImageUrl(
                    workspace.logo ?? DEFAULT_WORKSPACE_LOGO,
                  )}
                  size="sm"
                />
                {workspace.displayName ?? '(Sans nom)'}
                {isSwitching && <ActiveTag>…</ActiveTag>}
                {!isSwitching && isActive && <ActiveTag>Actif</ActiveTag>}
              </MenuItem>
            );
          })}
        </Menu>
      )}
    </Wrap>
  );
};
