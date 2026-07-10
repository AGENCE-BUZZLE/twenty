import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconSearch } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';

import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { MultiWorkspaceDropdownButton } from '@/ui/navigation/navigation-drawer/components/MultiWorkspaceDropdown/MultiWorkspaceDropdownButton';

// Sits at the bottom of the workspace drawer. Contains the workspace
// switcher pill (moved from the top header) and the search shortcut.

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
`;

const DropdownWrap = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const BuzzleWorkspaceSwitcherFooter = () => {
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  return (
    <Container>
      <DropdownWrap>
        <MultiWorkspaceDropdownButton />
      </DropdownWrap>
      <LightIconButton
        Icon={IconSearch}
        accent="secondary"
        size="small"
        onClick={openRecordsSearchPage}
        aria-label={t`Search`}
      />
    </Container>
  );
};
