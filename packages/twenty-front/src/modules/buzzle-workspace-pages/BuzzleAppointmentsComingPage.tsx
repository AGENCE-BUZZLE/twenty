import { styled } from '@linaria/react';
import { IconCalendarEvent } from 'twenty-ui/icon';

import { BuzzleWorkspaceShell } from '@/buzzle-workspace-nav/BuzzleWorkspaceShell';

// Coming-soon placeholder for the Rendez-vous workspace route. Sits in
// the shared Ink shell so it visually matches every other page while
// the real product is being built.

const Wrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
`;

const Card = styled.div`
  max-width: 520px;
  text-align: center;
  padding: 40px 36px;
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 20px;
  background: #ffffff;
`;

const IconFrame = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(18, 183, 106, 0.12);
  color: #12b76a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #14141c;
  margin: 0 0 10px 0;
`;

const Lede = styled.p`
  color: rgba(20, 20, 28, 0.6);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
`;

export const BuzzleAppointmentsComingPage = () => (
  <BuzzleWorkspaceShell>
    <Wrap>
      <Card>
        <IconFrame>
          <IconCalendarEvent size={30} />
        </IconFrame>
        <Title>Rendez-vous · bientôt disponible</Title>
        <Lede>
          Prise de rendez-vous en ligne, synchronisation Google Calendar et
          rappels automatiques par SMS et email arrivent prochainement dans le
          CRM Buzzle. En attendant, la prise de rendez-vous continue via
          téléphone et WhatsApp.
        </Lede>
      </Card>
    </Wrap>
  </BuzzleWorkspaceShell>
);
