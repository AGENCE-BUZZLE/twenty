import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { AppPath } from 'twenty-shared/types';
import { getImageAbsoluteURI, isDefined } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/data-display';
import { UndecoratedLink } from 'twenty-ui/navigation';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { useRedirectToDefaultDomain } from '~/modules/domain-manager/hooks/useRedirectToDefaultDomain';

type LogoProps = {
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  placeholder?: string | null;
  onClick?: () => void;
  to?: AppPath;
};

const StyledContainer = styled.div`
  height: ${themeCssVariables.spacing[12]};
  margin-bottom: ${themeCssVariables.spacing[4]};
  margin-top: ${themeCssVariables.spacing[4]};

  position: relative;
  width: ${themeCssVariables.spacing[12]};
`;

// Fallback layout when no workspace-specific logo is passed (e.g. on
// app.crm.agence-buzzle.com/welcome). We show the Buzzle wordmark on the
// same Ink background as the sidebar, so the sign-in page reads as
// Buzzle-branded and not as a generic Twenty page.
const StyledBuzzleContainer = styled.div`
  height: 64px;
  width: 180px;
  background: #14141c;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 22px;
  margin-bottom: ${themeCssVariables.spacing[4]};
  margin-top: ${themeCssVariables.spacing[4]};
  cursor: pointer;
`;

const StyledBuzzleLogo = styled.img`
  width: 100%;
  height: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

const StyledSecondaryLogo = styled.img`
  border-radius: ${themeCssVariables.border.radius.xs};
  height: ${themeCssVariables.spacing[6]};
  width: ${themeCssVariables.spacing[6]};
`;

const StyledSecondaryLogoContainer = styled.div`
  align-items: center;
  background-color: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.sm};
  bottom: calc(-1 * ${themeCssVariables.spacing[3]});
  display: flex;
  height: ${themeCssVariables.spacing[7]};
  justify-content: center;

  position: absolute;
  right: calc(-1 * ${themeCssVariables.spacing[3]});
  width: ${themeCssVariables.spacing[7]};
`;

const StyledPrimaryLogo = styled.div`
  background-size: cover;
  height: 100%;
  width: 100%;
`;

export const Logo = ({
  primaryLogo,
  secondaryLogo,
  placeholder,
  onClick,
  to = AppPath.SignInUp,
}: LogoProps) => {
  const { redirectToDefaultDomain } = useRedirectToDefaultDomain();
  const defaultPrimaryLogoUrl = `${window.location.origin}/images/icons/android/android-launchericon-192-192.png`;

  const primaryLogoUrl = getImageAbsoluteURI({
    imageUrl: primaryLogo ?? defaultPrimaryLogoUrl,
    baseUrl: REACT_APP_SERVER_BASE_URL,
  });

  const secondaryLogoUrl = isNonEmptyString(secondaryLogo)
    ? getImageAbsoluteURI({
        imageUrl: secondaryLogo,
        baseUrl: REACT_APP_SERVER_BASE_URL,
      })
    : null;

  const isUsingDefaultLogo = !isDefined(primaryLogo);

  // On the root domain welcome page (app.crm.agence-buzzle.com/welcome
  // and friends) there is no target workspace, so we swap Twenty's
  // generic launcher icon for the Buzzle wordmark on the same Ink pill
  // used at the top of the sidebar.
  const isRootDomainWelcome =
    isUsingDefaultLogo &&
    !isDefined(secondaryLogo) &&
    !isDefined(placeholder);

  if (isRootDomainWelcome) {
    return (
      <UndecoratedLink
        to={to}
        onClick={() => {
          onClick?.();
          redirectToDefaultDomain();
        }}
      >
        <StyledBuzzleContainer>
          <StyledBuzzleLogo src="/images/buzzle-white.png" alt="Buzzle" />
        </StyledBuzzleContainer>
      </UndecoratedLink>
    );
  }

  return (
    <StyledContainer onClick={() => onClick?.()}>
      {isUsingDefaultLogo ? (
        <UndecoratedLink to={to} onClick={() => redirectToDefaultDomain()}>
          <StyledPrimaryLogo
            style={{ backgroundImage: `url(${primaryLogoUrl})` }}
          />
        </UndecoratedLink>
      ) : (
        <StyledPrimaryLogo
          style={{ backgroundImage: `url(${primaryLogoUrl})` }}
        />
      )}
      {isDefined(secondaryLogoUrl) ? (
        <StyledSecondaryLogoContainer>
          <StyledSecondaryLogo src={secondaryLogoUrl} />
        </StyledSecondaryLogoContainer>
      ) : (
        isDefined(placeholder) && (
          <StyledSecondaryLogoContainer>
            <Avatar
              size="lg"
              placeholder={placeholder}
              type="squared"
              placeholderColorSeed={placeholder}
            />
          </StyledSecondaryLogoContainer>
        )
      )}
    </StyledContainer>
  );
};
