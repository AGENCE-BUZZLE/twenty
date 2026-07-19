import { FooterNote } from '@/auth/sign-in-up/components/FooterNote';
import { WorkspaceSelectionFooter } from '@/auth/sign-in-up/components/WorkspaceSelectionFooter';
import { SignInUpStep } from '@/auth/states/signInUpStepState';
import { styled } from '@linaria/react';
import { type JSX } from 'react';
import { type PublicWorkspaceData } from '~/generated-metadata/graphql';

// Buzzle: sign-in shell — Ink cells background is rendered behind by the
// SignInUp page; this component only lays out the centred white card with
// the wordmark, title, subtitle, form and footer.

const Wrap = styled.div`
  position: relative;
  z-index: 10;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  box-sizing: border-box;
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px 32px 28px;
  box-shadow:
    0 24px 48px rgba(20, 20, 28, 0.28),
    0 4px 12px rgba(20, 20, 28, 0.16);
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 480px) {
    padding: 26px 22px 22px;
    border-radius: 14px;
  }
`;

const LogoRow = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: 4px;
`;

const LogoImg = styled.img`
  height: 34px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

const Heading = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HeadingTitle = styled.h1`
  margin: 0;
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.014em;
  color: #14141c;
`;

const HeadingSubtitle = styled.p`
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  color: rgba(20, 20, 28, 0.6);
  line-height: 1.45;
`;

const FormSlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
`;

const FooterSlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
`;

type SignInUpStandardContentProps = {
  workspacePublicData: PublicWorkspaceData | null;
  signInUpForm: JSX.Element | null;
  signInUpStep: SignInUpStep;
  title: string;
  onClickOnLogo: () => void;
};

const subtitleFor = (step: SignInUpStep): string | null => {
  switch (step) {
    case SignInUpStep.Init:
    case SignInUpStep.Email:
      return 'Content de vous revoir, connectez-vous pour continuer.';
    case SignInUpStep.Password:
      return 'Saisissez votre mot de passe pour vous connecter.';
    case SignInUpStep.WorkspaceSelection:
      return 'Choisissez l’espace de travail à ouvrir.';
    default:
      return null;
  }
};

export const SignInUpStandardContent = ({
  workspacePublicData,
  signInUpForm,
  signInUpStep,
  title,
  onClickOnLogo,
}: SignInUpStandardContentProps) => {
  const workspaceLogo = workspacePublicData?.logo ?? null;
  const workspaceDisplayName = workspacePublicData?.displayName ?? null;
  const subtitle = subtitleFor(signInUpStep);

  return (
    <Wrap>
      <Card>
        <LogoRow onClick={onClickOnLogo} role="presentation">
          <LogoImg
            src={workspaceLogo ?? '/images/buzzle-dark.png'}
            alt={workspaceDisplayName ?? 'Buzzle'}
          />
        </LogoRow>
        <Heading>
          <HeadingTitle>{title}</HeadingTitle>
          {subtitle !== null && (
            <HeadingSubtitle>{subtitle}</HeadingSubtitle>
          )}
        </Heading>
        <FormSlot>{signInUpForm}</FormSlot>
        {signInUpStep === SignInUpStep.WorkspaceSelection && (
          <FooterSlot>
            <WorkspaceSelectionFooter />
          </FooterSlot>
        )}
        {![
          SignInUpStep.Password,
          SignInUpStep.TwoFactorAuthenticationProvision,
          SignInUpStep.TwoFactorAuthenticationVerification,
          SignInUpStep.WorkspaceSelection,
          SignInUpStep.WorkspaceCreation,
        ].includes(signInUpStep) && (
          <FooterSlot>
            <FooterNote secondaryAgreement="dataProcessingAgreement" />
          </FooterSlot>
        )}
      </Card>
    </Wrap>
  );
};
