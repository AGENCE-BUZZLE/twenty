import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { FormatPreferencesSettings } from '@/settings/experience/components/FormatPreferencesSettings';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { LocalePicker } from '~/pages/settings/profile/appearance/components/LocalePicker';

// Buzzle: the ColorSchemePicker (Light/Dark/System) is removed because
// the app renders in a single Schemata theme. The workspaceMember
// colorScheme column still exists but is ignored by BaseThemeProvider.
export const SettingsExperience = () => {
  const { t } = useLingui();

  return (
    <SettingsPageLayout
      title={t`Experience`}
      links={[
        {
          children: <Trans>User</Trans>,
          href: getSettingsPath(SettingsPath.ProfilePage),
        },
        { children: <Trans>Experience</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Language`}
            description={t`Select your preferred language`}
          />
          <LocalePicker />
        </Section>

        <Section>
          <H2Title
            title={t`Formats`}
            description={t`Configure date, time, number, timezone, and calendar start day`}
          />
          <FormatPreferencesSettings />
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
