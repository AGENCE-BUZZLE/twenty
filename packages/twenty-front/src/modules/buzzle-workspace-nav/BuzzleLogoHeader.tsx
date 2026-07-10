import { styled } from '@linaria/react';

// Buzzle brand mark shown at the top of the workspace drawer.
// Replaces Twenty's NavigationDrawerHeader (which held the workspace
// picker + search). The picker moves to a dedicated footer component.

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 6px 12px 14px;
`;

const LogoImg = styled.img`
  height: 26px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;

export const BuzzleLogoHeader = () => (
  <Container>
    <LogoImg src="/images/buzzle-white.png" alt="Buzzle" />
  </Container>
);
