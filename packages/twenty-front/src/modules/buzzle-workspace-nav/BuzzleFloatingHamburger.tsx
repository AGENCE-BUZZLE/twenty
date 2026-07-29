import { styled } from '@linaria/react';
import { IconBaselineDensitySmall, IconX } from 'twenty-ui/icon';

import { buzzleSidebarExpandedState } from '@/buzzle-workspace-nav/states/buzzleSidebarExpandedState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

// Hamburger control in the top-left of the Ink shell. Clicking toggles
// buzzleSidebarExpandedState, which BuzzleFloatingSidebar reads to
// switch its pills from icon-only (56x56 squares) to horizontal buttons
// with the full label. The ShellGrid parent also reads the state to
// widen the sidebar column.

const Wrap = styled.div`
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  justify-self: start;
  z-index: 3;
`;

const IconButton = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 0;
  transition: color 160ms ease, opacity 160ms ease;

  &:hover {
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.4);
    outline-offset: 4px;
    border-radius: 4px;
  }
`;

export const BuzzleFloatingHamburger = () => {
  const [expanded, setExpanded] = useAtomState(buzzleSidebarExpandedState);

  return (
    <Wrap>
      <IconButton
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={expanded ? 'Fermer la navigation' : 'Ouvrir la navigation'}
        aria-pressed={expanded}
      >
        {expanded ? (
          <IconX size={26} stroke={1.75} />
        ) : (
          <IconBaselineDensitySmall size={26} stroke={1.75} />
        )}
      </IconButton>
    </Wrap>
  );
};
