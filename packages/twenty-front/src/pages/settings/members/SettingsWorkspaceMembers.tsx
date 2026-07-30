import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconLock, IconUserPlus, IconUsers } from 'twenty-ui/icon';

import { BuzzleSettingsShell } from '@/buzzle-workspace-nav/BuzzleSettingsShell';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { useSettingsActiveTabId } from '@/settings/components/layout/useSettingsActiveTabId';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { SettingsWorkspaceMembersInviteTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersInviteTab';
import { SettingsWorkspaceMembersRolesTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersRolesTab';
import { SettingsWorkspaceMembersTeamTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersTeamTab';

const MEMBERS_TAB_LIST_ID = 'members-tab-list';

const MEMBERS_TAB_TEAM_ID = 'team';
const MEMBERS_TAB_INVITE_ID = 'invite';
const MEMBERS_TAB_ROLES_ID = 'roles';

// Card wrapper aligné sur le design général du CRM (radius 22, borders
// soft, fond blanc, padding généreux). Le SettingsTabBar Twenty est
// intégré tel quel dans les slots de BuzzleSettingsShell.
const Card = styled.div`
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  padding: 26px 28px 28px;
`;

export const SettingsWorkspaceMembers = () => {
  const { t } = useLingui();

  const hasRolesPermission = useHasPermissionFlag(PermissionFlagType.ROLES);

  const tabs = [
    { id: MEMBERS_TAB_TEAM_ID, title: t`Équipe`, Icon: IconUsers },
    { id: MEMBERS_TAB_INVITE_ID, title: t`Inviter`, Icon: IconUserPlus },
    ...(hasRolesPermission
      ? [{ id: MEMBERS_TAB_ROLES_ID, title: t`Rôles`, Icon: IconLock }]
      : []),
  ];

  const activeTabId = useSettingsActiveTabId(
    MEMBERS_TAB_LIST_ID,
    tabs.map((tab) => tab.id),
  );

  const renderActiveTabContent = () => {
    switch (activeTabId) {
      case MEMBERS_TAB_INVITE_ID:
        return <SettingsWorkspaceMembersInviteTab />;
      case MEMBERS_TAB_ROLES_ID:
        return hasRolesPermission ? (
          <SettingsWorkspaceMembersRolesTab />
        ) : (
          <SettingsWorkspaceMembersTeamTab />
        );
      default:
        return <SettingsWorkspaceMembersTeamTab />;
    }
  };

  return (
    <BuzzleSettingsShell
      title={t`Membres`}
      tabs={
        <SettingsTabBar
          tabs={tabs}
          componentInstanceId={MEMBERS_TAB_LIST_ID}
        />
      }
    >
      <Card>{renderActiveTabContent()}</Card>
    </BuzzleSettingsShell>
  );
};
