import { styled } from '@linaria/react';

// Solid Ink surface behind the Overview workspace shell.
// Mounted by DefaultLayout when /overview is active on desktop.

const InkColor = '#14141c';

const Root = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background: ${InkColor};
  pointer-events: none;
`;

export const BuzzleInkShellBackground = () => <Root aria-hidden="true" />;
