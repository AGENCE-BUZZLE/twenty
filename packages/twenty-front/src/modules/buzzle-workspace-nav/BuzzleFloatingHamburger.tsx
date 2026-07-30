import { styled } from '@linaria/react';
import { IconX } from 'twenty-ui/icon';

import { buzzleSidebarExpandedState } from '@/buzzle-workspace-nav/states/buzzleSidebarExpandedState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

// Hamburger control in the top-left of the Ink shell. Clicking toggles
// buzzleSidebarExpandedState, which BuzzleFloatingSidebar reads to
// switch its pills from icon-only (56x56 squares) to horizontal buttons
// with the full label. The ShellGrid parent also reads the state to
// widen the sidebar column.
//
// The clickable target is 56x56 so the icon sits on the same vertical
// axis as the pills below (each pill is 56x56 too, left-aligned in the
// 76px sidebar column).

const Wrap = styled.div`
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  justify-self: start;
  z-index: 3;
  position: relative;

  @media (max-width: 768px) {
    z-index: 65;
  }
`;

const IconButton = styled.button`
  width: 56px;
  height: 56px;
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 0;
  transition: color 160ms ease;

  &:hover {
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.4);
    outline-offset: 2px;
    border-radius: 12px;
  }

  svg {
    display: block;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    z-index: 65;
  }
`;

// Clean 3-line hamburger, sized to match the 22px icons used inside the
// sidebar pills.
const HamburgerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={22}
    height={22}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

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
        {expanded ? <IconX size={22} stroke={1.75} /> : <HamburgerIcon />}
      </IconButton>
    </Wrap>
  );
};
