import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { enUS } from 'date-fns/locale';
import { useStore } from 'jotai';
import { IconCheck, IconChevronLeft } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';
import { APP_LOCALES } from 'twenty-shared/translations';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { useUpdateWorkspaceMemberSettings } from '@/settings/profile/hooks/useUpdateWorkspaceMemberSettings';
import { getDateFnsLocale } from '@/ui/field/display/utils/getDateFnsLocale';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { MULTI_WORKSPACE_DROPDOWN_ID } from '@/ui/navigation/navigation-drawer/constants/MultiWorkspaceDropdownId';
import { multiWorkspaceDropdownState } from '@/ui/navigation/navigation-drawer/states/multiWorkspaceDropdownState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';
import { logError } from '~/utils/logError';

// Buzzle: language submenu inside the workspace dropdown. Shows every
// APP_LOCALE with the currently selected one checkmarked. Selection
// persists via updateWorkspaceMemberSettings + dynamicActivate.

const ForceLightSurface = styled.div`
  background: #ffffff;
  color: #14141c;
  border-radius: 8px;
  overflow: hidden;
  max-height: 420px;

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

const ScrollArea = styled.div`
  overflow-y: auto;
  max-height: 340px;
`;

const buildLocaleLabel = (locale: string): string => {
  try {
    const inSelfLanguage = new Intl.DisplayNames([locale], {
      type: 'language',
    }).of(locale);
    return inSelfLanguage ? `${inSelfLanguage[0].toUpperCase()}${inSelfLanguage.slice(1)}` : locale;
  } catch {
    return locale;
  }
};

export const MultiWorkspaceDropdownLanguagesComponents = () => {
  const { t } = useLingui();
  const setMultiWorkspaceDropdown = useSetAtomState(
    multiWorkspaceDropdownState,
  );
  const [currentWorkspaceMember, setCurrentWorkspaceMember] = useAtomState(
    currentWorkspaceMemberState,
  );
  const { updateWorkspaceMemberSettings } = useUpdateWorkspaceMemberSettings();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const { closeDropdown } = useCloseDropdown();
  const store = useStore();

  const currentLocale = currentWorkspaceMember?.locale ?? APP_LOCALES.en;

  const handleSelect = async (locale: keyof typeof APP_LOCALES) => {
    if (!currentWorkspaceMember?.id) return;
    try {
      setCurrentWorkspaceMember({ ...currentWorkspaceMember, locale });
      await updateWorkspaceMemberSettings({
        workspaceMemberId: currentWorkspaceMember.id,
        update: { locale },
      });
      const dateFnsLocale = await getDateFnsLocale(locale);
      store.set(dateLocaleState.atom, {
        locale,
        localeCatalog: dateFnsLocale || enUS,
      });
      await dynamicActivate(locale);
      try {
        localStorage.setItem('locale', locale);
      } catch {
        // ignore
      }
      invalidateMetadataStore();
    } catch (error) {
      logError(error);
    }
    setMultiWorkspaceDropdown('default');
    closeDropdown(MULTI_WORKSPACE_DROPDOWN_ID);
  };

  const options = Object.values(APP_LOCALES)
    .map((locale) => ({
      value: locale as keyof typeof APP_LOCALES,
      label: buildLocaleLabel(locale),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <ForceLightSurface>
      <DropdownContent>
        <DropdownMenuHeader
          StartComponent={
            <DropdownMenuHeaderLeftComponent
              onClick={() => setMultiWorkspaceDropdown('default')}
              Icon={IconChevronLeft}
            />
          }
        >
          {t`Langue`}
        </DropdownMenuHeader>
        <ScrollArea>
          <DropdownMenuItemsContainer>
            {options.map(({ value, label }) => (
              <MenuItem
                key={value}
                LeftIcon={value === currentLocale ? IconCheck : undefined}
                text={label}
                onClick={() => handleSelect(value)}
              />
            ))}
          </DropdownMenuItemsContainer>
        </ScrollArea>
      </DropdownContent>
    </ForceLightSurface>
  );
};
