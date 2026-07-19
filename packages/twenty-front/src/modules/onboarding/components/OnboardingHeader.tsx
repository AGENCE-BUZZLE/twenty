import { ONBOARDING_CONTENT_BLOCK_WIDTH } from '@/onboarding/constants/OnboardingContentBlockWidth';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { IconChevronLeft } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// Buzzle white-label: the onboarding header used to show Twenty's logo
// and a "free credits" chip. We swap the logo for the Buzzle wordmark
// and drop the credits chip entirely — Buzzle CRM has no credit system.

const StyledHeader = styled.div`
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[8]} ${themeCssVariables.spacing[8]} 1px;
  width: 100%;
`;

const StyledSide = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: 1 1 0;
  min-width: 0;
`;

const StyledLeftSide = styled(StyledSide)`
  justify-content: flex-end;
  padding-right: ${themeCssVariables.spacing[1]};
`;

const StyledCenter = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 ${ONBOARDING_CONTENT_BLOCK_WIDTH}px;
  justify-content: flex-start;
  min-width: 0;
`;

const StyledRightSide = styled(StyledSide)`
  justify-content: flex-end;
  padding-left: ${themeCssVariables.spacing[1]};
`;

const StyledLogo = styled.img`
  height: 26px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

type OnboardingHeaderProps = {
  onBack?: () => void;
  freeCredits?: number;
};

// freeCredits stays in the prop signature for API compatibility with the
// upstream Twenty code paths but is intentionally ignored.
export const OnboardingHeader = ({ onBack }: OnboardingHeaderProps) => {
  return (
    <StyledHeader>
      <StyledLeftSide>
        {isDefined(onBack) && (
          <LightIconButton
            Icon={IconChevronLeft}
            accent="tertiary"
            size="small"
            onClick={onBack}
            aria-label="Retour"
          />
        )}
      </StyledLeftSide>
      <StyledCenter>
        <StyledLogo src="/images/buzzle-dark.png" alt="Buzzle" />
      </StyledCenter>
      <StyledRightSide />
    </StyledHeader>
  );
};
