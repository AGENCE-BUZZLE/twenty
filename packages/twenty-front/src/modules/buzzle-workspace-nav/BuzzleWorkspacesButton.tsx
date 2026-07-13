import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';
import { AppPath } from 'twenty-shared/types';
import { Avatar } from 'twenty-ui/data-display';
import { IconPlus } from 'twenty-ui/icon';

import { availableWorkspacesState } from '@/auth/states/availableWorkspacesState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { countAvailableWorkspaces } from '@/auth/utils/availableWorkspacesUtils';
import { useBuildWorkspaceUrl } from '@/domain-manager/hooks/useBuildWorkspaceUrl';
import { useRedirectToDefaultDomain } from '@/domain-manager/hooks/useRedirectToDefaultDomain';
import { useRedirectToWorkspaceDomain } from '@/domain-manager/hooks/useRedirectToWorkspaceDomain';
import { DEFAULT_WORKSPACE_LOGO } from '@/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { getWorkspaceUrl } from '~/utils/getWorkspaceUrl';
import { type AvailableWorkspace } from '~/generated-metadata/graphql';

// Buzzle: header trigger that lists workspaces + "Ajouter un workspace"
// only. No Profil / Membres / Langue / Logout — those live in the sidebar
// Paramètres footer.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Wrap = styled.div`
  position: relative;
  display: inline-block;
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
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.14);
  z-index: 40;
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

const AddItem = styled(MenuItem)`
  border-top: 1px solid rgba(20, 20, 28, 0.08);
  margin-top: 6px;
  padding-top: 14px;
  font-weight: 500;
`;

const AddPlus = styled.span`
  display: inline-flex;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(126, 55, 254, 0.16);
  color: #7e37fe;
  align-items: center;
  justify-content: center;
`;

const ActiveTag = styled.span`
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

export const BuzzleWorkspacesButton = () => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const availableWorkspaces = useAtomStateValue(availableWorkspacesState);
  const availableWorkspacesCount =
    countAvailableWorkspaces(availableWorkspaces);
  const { buildWorkspaceUrl } = useBuildWorkspaceUrl();
  const { redirectToWorkspaceDomain } = useRedirectToWorkspaceDomain();
  const { redirectToDefaultDomain } = useRedirectToDefaultDomain();

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
    setOpen(false);
    redirectToWorkspaceDomain(getWorkspaceUrl(target.workspaceUrls));
  };

  const openCreate = () => {
    setOpen(false);
    redirectToDefaultDomain({
      pathname: AppPath.SignInUp,
      searchParams: { action: 'create-new-workspace' },
    });
  };

  const list = [
    ...availableWorkspaces.availableWorkspacesForSignIn,
    ...availableWorkspaces.availableWorkspacesForSignUp,
  ];

  return (
    <Wrap ref={wrapRef}>
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

            return (
              <MenuItem
                key={workspace.id}
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
                {isActive && <ActiveTag>Actif</ActiveTag>}
              </MenuItem>
            );
          })}
          <AddItem onClick={openCreate}>
            <AddPlus>
              <IconPlus size={14} />
            </AddPlus>
            Ajouter un workspace
          </AddItem>
        </Menu>
      )}
    </Wrap>
  );
};
