import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';

import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { ONBOARDING_CONTENT_BLOCK_WIDTH } from '@/onboarding/constants/OnboardingContentBlockWidth';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// Buzzle: legal pages are hosted at the root of agence-buzzle.com. The
// footer copy is French-only to match the rest of the CRM's UI language.
const TERMS_URL = 'https://agence-buzzle.com/conditions-utilisation';
const DPA_URL = 'https://agence-buzzle.com/data-processing-agreement';
const PRIVACY_URL = 'https://agence-buzzle.com/politique-confidentialite';

const StyledCopyContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.4;
  max-width: ${ONBOARDING_CONTENT_BLOCK_WIDTH}px;
  text-align: center;

  & > a {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledLinksContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: nowrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  max-width: 100%;
  text-align: center;
  white-space: nowrap;

  & > a,
  & > button {
    background: none;
    border: none;
    color: ${themeCssVariables.font.color.tertiary};
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledSeparator = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

type FooterNoteProps = {
  secondaryAgreement?: 'privacyPolicy' | 'dataProcessingAgreement';
};

export const FooterNote = ({
  secondaryAgreement = 'privacyPolicy',
}: FooterNoteProps) => {
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();

  const { shouldOfferBypass, shouldUseBypass, enableBypass } =
    useWorkspaceBypass();

  if (!isOnAWorkspace) {
    return (
      <StyledCopyContainer>
        En utilisant Buzzle CRM, vous acceptez nos{' '}
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">
          Conditions d'utilisation
        </a>{' '}
        et notre{' '}
        {secondaryAgreement === 'dataProcessingAgreement' ? (
          <a href={DPA_URL} target="_blank" rel="noopener noreferrer">
            Data Processing Agreement
          </a>
        ) : (
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
            Politique de confidentialité
          </a>
        )}
        .
      </StyledCopyContainer>
    );
  }

  return (
    <StyledLinksContainer>
      {shouldOfferBypass && !shouldUseBypass && (
        <>
          <button type="button" onClick={enableBypass}>
            <Trans>Bypass SSO</Trans>
          </button>
          <StyledSeparator>•</StyledSeparator>
        </>
      )}
      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
        Politique de confidentialité
      </a>
      <StyledSeparator>•</StyledSeparator>
      <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">
        Conditions d'utilisation
      </a>
    </StyledLinksContainer>
  );
};
