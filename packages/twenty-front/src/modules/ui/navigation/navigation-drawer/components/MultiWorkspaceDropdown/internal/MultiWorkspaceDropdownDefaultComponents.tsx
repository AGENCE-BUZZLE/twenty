import { DEFAULT_WORKSPACE_LOGO } from '@/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo';

import { useAuth } from '@/auth/hooks/useAuth';
import { availableWorkspacesState } from '@/auth/states/availableWorkspacesState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { countAvailableWorkspaces } from '@/auth/utils/availableWorkspacesUtils';
import { useBuildWorkspaceUrl } from '@/domain-manager/hooks/useBuildWorkspaceUrl';
import { useRedirectToDefaultDomain } from '@/domain-manager/hooks/useRedirectToDefaultDomain';
import { useRedirectToWorkspaceDomain } from '@/domain-manager/hooks/useRedirectToWorkspaceDomain';
import { useOpenSettingsMenu } from '@/navigation/hooks/useOpenSettings';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { MULTI_WORKSPACE_DROPDOWN_ID } from '@/ui/navigation/navigation-drawer/constants/MultiWorkspaceDropdownId';
import { multiWorkspaceDropdownState } from '@/ui/navigation/navigation-drawer/states/multiWorkspaceDropdownState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { APP_LOCALES } from 'twenty-shared/translations';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/data-display';
import {
  IconLogout,
  IconPlus,
  IconSettings,
  IconSwitchHorizontal,
  IconUserPlus,
  IconWorldWww,
} from 'twenty-ui/icon';
import {
  MenuItem,
  MenuItemSelectAvatar,
  UndecoratedLink,
} from 'twenty-ui/navigation';
import { type AvailableWorkspace } from '~/generated-metadata/graphql';
import { getWorkspaceUrl } from '~/utils/getWorkspaceUrl';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

const buildLocaleLabel = (locale: string): string => {
  try {
    const inSelf = new Intl.DisplayNames([locale], { type: 'language' }).of(
      locale,
    );
    return inSelf ? `${inSelf[0].toUpperCase()}${inSelf.slice(1)}` : locale;
  } catch {
    return locale;
  }
};

// Buzzle: workspace dropdown menu. Anchored to the bottom pill in the
// sidebar. Renders inside a FloatingPortal so it lives outside the dark
// drawer wrapper — the palette here is our Schemata Light (paper
// background, ink text) regardless of what the drawer looks like.
//
// Top-level items:
//   - Connecter un autre workspace     (creates / joins another)
//   - Ajouter un utilisateur           (workspace members > invite)
//   - Paramètres                       (profile settings)
//   - Français / English toggle
//   - separator
//   - Déconnexion

const ForceLightSurface = styled.div`
  background: #ffffff;
  color: #14141c;
  border-radius: 8px;
  overflow: hidden;

  --t-background-primary: #ffffff;
  --t-background-secondary: #ffffff;
  --t-background-tertiary: #efede6;
  --t-background-transparent-light: rgba(20, 20, 28, 0.04);
  --t-background-transparent-lighter: rgba(20, 20, 28, 0.02);
  --t-background-transparent-medium: rgba(20, 20, 28, 0.06);
  --t-background-transparent-strong: rgba(20, 20, 28, 0.1);

  --t-gray-scale-gray2: #efede6;
  --t-color-gray2: #efede6;
  --t-gray-scale-gray3: #f5f2ea;
  --t-color-gray3: #f5f2ea;

  --t-font-color-primary: #14141c;
  --t-font-color-secondary: rgba(20, 20, 28, 0.72);
  --t-font-color-tertiary: rgba(20, 20, 28, 0.55);
  --t-font-color-light: rgba(20, 20, 28, 0.6);
  --t-font-color-extra-light: rgba(20, 20, 28, 0.42);

  --t-border-color-light: rgba(20, 20, 28, 0.08);
  --t-border-color-medium: rgba(20, 20, 28, 0.14);
  --t-border-color-strong: rgba(20, 20, 28, 0.2);
`;

export const MultiWorkspaceDropdownDefaultComponents = () => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { t } = useLingui();
  const { redirectToWorkspaceDomain } = useRedirectToWorkspaceDomain();
  const availableWorkspaces = useAtomStateValue(availableWorkspacesState);
  const availableWorkspacesCount =
    countAvailableWorkspaces(availableWorkspaces);
  const { buildWorkspaceUrl } = useBuildWorkspaceUrl();
  const { redirectToDefaultDomain } = useRedirectToDefaultDomain();
  const { closeDropdown } = useCloseDropdown();
  const { signOut } = useAuth();

  const setMultiWorkspaceDropdown = useSetAtomState(
    multiWorkspaceDropdownState,
  );

  const { openSettingsMenu } = useOpenSettingsMenu();

  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const currentLocale = currentWorkspaceMember?.locale ?? APP_LOCALES.en;
  const currentLocaleLabel = buildLocaleLabel(currentLocale);

  const handleChange = async (availableWorkspace: AvailableWorkspace) => {
    redirectToWorkspaceDomain(
      getWorkspaceUrl(availableWorkspace.workspaceUrls),
    );
  };

  const createWorkspace = () => {
    redirectToDefaultDomain({
      pathname: AppPath.SignInUp,
      searchParams: { action: 'create-new-workspace' },
    });
  };

  return (
    <ForceLightSurface>
      <DropdownContent>
        <DropdownMenuHeader
          StartComponent={
            <DropdownMenuHeaderLeftComponent
              Avatar={
                <Avatar
                  placeholder={currentWorkspace?.displayName || ''}
                  avatarUrl={getAbsoluteImageUrl(
                    currentWorkspace?.logo ?? DEFAULT_WORKSPACE_LOGO,
                  )}
                />
              }
            />
          }
        >
          {currentWorkspace?.displayName}
        </DropdownMenuHeader>

        {availableWorkspacesCount > 1 && (
          <>
            <DropdownMenuItemsContainer>
              {[
                ...availableWorkspaces.availableWorkspacesForSignIn,
                ...availableWorkspaces.availableWorkspacesForSignUp,
              ]
                .filter(({ id }) => id !== currentWorkspace?.id)
                .slice(0, 3)
                .map((availableWorkspace) => (
                  <UndecoratedLink
                    key={availableWorkspace.id}
                    to={buildWorkspaceUrl(
                      getWorkspaceUrl(availableWorkspace.workspaceUrls),
                    )}
                    onClick={(event) => {
                      event?.preventDefault();
                      handleChange(availableWorkspace);
                    }}
                  >
                    <MenuItemSelectAvatar
                      text={availableWorkspace.displayName ?? t`(No name)`}
                      avatar={
                        <Avatar
                          placeholder={availableWorkspace.displayName || ''}
                          avatarUrl={getAbsoluteImageUrl(
                            availableWorkspace.logo ?? DEFAULT_WORKSPACE_LOGO,
                          )}
                        />
                      }
                      selected={false}
                    />
                  </UndecoratedLink>
                ))}
              {availableWorkspacesCount > 4 && (
                <MenuItem
                  LeftIcon={IconSwitchHorizontal}
                  text={t`Autres workspaces`}
                  onClick={() => setMultiWorkspaceDropdown('workspaces-list')}
                  hasSubMenu={true}
                />
              )}
            </DropdownMenuItemsContainer>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItemsContainer>
          <MenuItem
            LeftIcon={IconPlus}
            text={t`Connecter un autre workspace`}
            onClick={createWorkspace}
          />
          <UndecoratedLink
            to={`${getSettingsPath(SettingsPath.WorkspaceMembersPage)}#invite`}
            onClick={() => {
              closeDropdown(MULTI_WORKSPACE_DROPDOWN_ID);
            }}
          >
            <MenuItem LeftIcon={IconUserPlus} text={t`Ajouter un utilisateur`} />
          </UndecoratedLink>
          <UndecoratedLink
            to={getSettingsPath(SettingsPath.ProfilePage)}
            onClick={() => {
              openSettingsMenu();
              closeDropdown(MULTI_WORKSPACE_DROPDOWN_ID);
            }}
          >
            <MenuItem LeftIcon={IconSettings} text={t`Paramètres`} />
          </UndecoratedLink>
          <MenuItem
            LeftIcon={IconWorldWww}
            text={`${t`Langue`} · ${currentLocaleLabel}`}
            hasSubMenu={true}
            onClick={() => setMultiWorkspaceDropdown('languages')}
          />
        </DropdownMenuItemsContainer>

        <DropdownMenuSeparator />

        <DropdownMenuItemsContainer>
          <MenuItem
            LeftIcon={IconLogout}
            text={t`Déconnexion`}
            onClick={signOut}
          />
        </DropdownMenuItemsContainer>
      </DropdownContent>
    </ForceLightSurface>
  );
};
