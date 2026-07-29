import { styled } from '@linaria/react';
import { IconLayoutList, IconX } from 'twenty-ui/icon';

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

const Pill = styled.button`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  &[data-open='true'] {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.28);
  }
`;

export const BuzzleFloatingHamburger = () => {
  const [expanded, setExpanded] = useAtomState(buzzleSidebarExpandedState);

  return (
    <Wrap>
      <Pill
        type="button"
        data-open={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={expanded ? 'Fermer la navigation' : 'Ouvrir la navigation'}
        aria-pressed={expanded}
      >
        {expanded ? <IconX size={22} /> : <IconLayoutList size={22} />}
      </Pill>
    </Wrap>
  );
};
