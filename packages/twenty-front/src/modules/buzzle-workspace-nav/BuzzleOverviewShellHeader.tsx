import { styled } from '@linaria/react';
import { IconBell } from 'twenty-ui/icon';

import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { BuzzlePeriodPicker } from '@/buzzle-workspace-pages/BuzzlePeriodPicker';
import type { BuzzlePeriod } from '@/buzzle-workspace-pages/BuzzlePeriodPicker';

// Header of the /overview Ink shell: the Buzzle wordmark logo sits in
// the top-left (spanning across the sidebar and top-bar columns) and
// the action chips (period picker, notifications, workspace switcher)
// sit on the right. Rendered directly by BuzzleOverviewPage as part of
// the grid — logo is grid cell (col 1, row 1), chips fill (col 2, row 1).

const LogoBlock = styled.div`
  grid-column: 1;
  grid-row: 1;
  height: 64px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  width: max-content;
  z-index: 3;
`;

const LogoImg = styled.img`
  height: 30px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

const Actions = styled.div`
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 64px;
  z-index: 2;
`;

const NotifChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.6);
  font-size: 13.5px;
  font-weight: 500;
  color: #14141c;
  cursor: pointer;
  transition:
    background 140ms ease,
    transform 140ms ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  font-family: inherit;

  &:hover {
    background: #ffffff;
    transform: translateY(-1px);
  }
`;

const NotifCount = styled.span`
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #7e37fe;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
  padding: 0 6px;
`;

// Wrap the workspace switcher so its dark-drawer CSS variables (which
// would leak in from the sidebar) don't repaint it on the light chip
// styling. We reset the important drawer tokens back to the light
// palette locally — same treatment as HeaderWorkspaceWrap on the old
// overview header.
const WorkspaceWrap = styled.div`
  --t-gray-scale-gray3: #ffffff;
  --t-color-gray3: #ffffff;
  --t-gray-scale-gray2: #f6f6fb;
  --t-color-gray2: #f6f6fb;
  --t-gray-scale-gray4: #f0f0f6;
  --t-color-gray4: #f0f0f6;
  --t-font-color-primary: #14141c;
  --t-font-color-secondary: rgba(20, 20, 28, 0.72);
  --t-font-color-tertiary: rgba(20, 20, 28, 0.5);
  --t-background-primary: #ffffff;
  --t-background-secondary: #f6f6fb;
  --t-background-tertiary: #f0f0f6;
  --t-background-transparent-light: rgba(20, 20, 28, 0.04);
  --t-background-transparent-lighter: rgba(20, 20, 28, 0.02);
  --t-background-transparent-medium: rgba(20, 20, 28, 0.08);
  --t-background-transparent-strong: rgba(20, 20, 28, 0.14);
  --t-border-color-light: rgba(20, 20, 28, 0.08);
  --t-border-color-medium: rgba(20, 20, 28, 0.14);
  --t-border-color-strong: rgba(20, 20, 28, 0.22);
`;

type BuzzleOverviewShellHeaderProps = {
  period: BuzzlePeriod;
  onPeriodChange: (p: BuzzlePeriod) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
};

export const BuzzleOverviewShellHeader = ({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: BuzzleOverviewShellHeaderProps) => {
  return (
    <>
      <LogoBlock aria-label="Buzzle">
        <LogoImg src="/images/buzzle-white.png" alt="Buzzle" />
      </LogoBlock>
      <Actions>
        <BuzzlePeriodPicker
          period={period}
          onPeriodChange={onPeriodChange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={onCustomStartChange}
          onCustomEndChange={onCustomEndChange}
        />
        <NotifChip type="button" aria-label="Notifications" title="Bientôt disponible">
          <IconBell size={16} />
          <span>Notifications</span>
          <NotifCount>0</NotifCount>
        </NotifChip>
        <WorkspaceWrap>
          <BuzzleWorkspacesButton hideOnMobile />
        </WorkspaceWrap>
      </Actions>
    </>
  );
};
