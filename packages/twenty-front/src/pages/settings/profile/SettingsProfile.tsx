import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { BuzzleSettingsShell } from '@/buzzle-workspace-nav/BuzzleSettingsShell';
import { SettingsCard } from '@/settings/components/SettingsCard';
import { SetOrChangePassword } from '@/settings/profile/components/SetOrChangePassword';
import { DeleteAccount } from '@/settings/profile/components/DeleteAccount';
import { EmailField } from '@/settings/profile/components/EmailField';
import { NameFields } from '@/settings/profile/components/NameFields';
import { WorkspaceMemberPictureUploader } from '@/settings/workspace-member/components/WorkspaceMemberPictureUploader';
import { useCanChangePassword } from '@/settings/profile/hooks/useCanChangePassword';
import { useCurrentUserWorkspaceTwoFactorAuthentication } from '@/settings/two-factor-authentication/hooks/useCurrentUserWorkspaceTwoFactorAuthentication';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Status } from 'twenty-ui/data-display';
import { IconShield } from 'twenty-ui/icon';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { UndecoratedLink } from 'twenty-ui/navigation';

// Card sections stacked inside the Ink shell Stage · même traitement
// visuel que les autres pages du CRM (radius 22, bordures soft, fond
// blanc, padding généreux).
const Card = styled.div`
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  padding: 26px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SettingsProfile = () => {
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { currentUserWorkspaceTwoFactorAuthenticationMethods } =
    useCurrentUserWorkspaceTwoFactorAuthentication();

  const has2FAMethod =
    currentUserWorkspaceTwoFactorAuthenticationMethods['TOTP']?.status ===
    'VERIFIED';

  const { canChangePassword } = useCanChangePassword();

  if (!currentWorkspaceMember?.id) {
    return null;
  }

  return (
    <BuzzleSettingsShell title={t`Profil`}>
      <Stack>
        <Card>
          <Section>
            <H2Title title={t`Photo`} />
            <WorkspaceMemberPictureUploader
              workspaceMemberId={currentWorkspaceMember.id}
            />
          </Section>
          <Section>
            <H2Title
              title={t`Nom`}
              description={t`Votre nom tel qu'il s'affichera`}
            />
            <NameFields key={currentWorkspaceMember.id} />
          </Section>
          <Section>
            <H2Title
              title={t`Email`}
              description={t`L'email associé à votre compte`}
            />
            <EmailField />
          </Section>
        </Card>

        <Card>
          <Section>
            <H2Title
              title={t`Double authentification`}
              description={t`Sécurise votre compte avec un code en plus du mot de passe`}
            />
            <UndecoratedLink
              to={getSettingsPath(
                SettingsPath.TwoFactorAuthenticationStrategyConfig,
                { twoFactorAuthenticationStrategy: 'TOTP' },
              )}
            >
              <SettingsCard
                title={t`Application d'authentification`}
                Icon={<IconShield />}
                Status={
                  has2FAMethod ? (
                    <Status text={t`Activée`} color="turquoise" />
                  ) : (
                    <Status text={t`Désactivée`} color="gray" />
                  )
                }
              />
            </UndecoratedLink>
          </Section>
          {canChangePassword && (
            <Section>
              <SetOrChangePassword />
            </Section>
          )}
        </Card>

        <Card>
          <Section>
            <DeleteAccount />
          </Section>
        </Card>
      </Stack>
    </BuzzleSettingsShell>
  );
};
