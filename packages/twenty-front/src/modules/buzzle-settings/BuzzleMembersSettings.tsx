import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';

import { BuzzleSettingsLayout } from '@/buzzle-settings/BuzzleSettingsLayout';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { SendInvitationsDocument } from '~/generated-metadata/graphql';

// Members management (Buzzle visual). Lists workspaceMember records and
// exposes a compact "invite by email" form. Twenty's sendInvitations
// mutation is called directly; the email owner receives a magic link.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const OkColor = '#187a4a';
const OkSoft = '#e3f4ea';
const DangerColor = '#c94a4a';
const DangerSoft = '#fbe5e5';

const Card = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  background: ${SurfaceColor};
  padding: 24px 28px;
  margin-bottom: 24px;
`;

const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
`;

const CardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: ${InkColor};
`;

const CardSub = styled.div`
  color: ${MutedColor};
  font-size: 13px;
  margin-top: 2px;
`;

const InviteRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: stretch;
`;

const EmailInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  border: 1px solid ${HairlineColor};
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: ${InkColor};
  background: ${SurfaceColor};
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const InviteButton = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 1px solid ${InkColor};
  padding: 0 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  &:hover {
    opacity: 0.88;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const OkBanner = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: ${OkSoft};
  color: ${OkColor};
  font-size: 13px;
  margin-top: 14px;
`;

const ErrorBanner = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: ${DangerSoft};
  color: #5a1010;
  border: 1px solid ${DangerColor};
  font-size: 13px;
  margin-top: 14px;
`;

const ListWrap = styled.div`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  overflow: hidden;
  background: ${SurfaceColor};
`;

const ListHead = styled.div`
  padding: 14px 22px;
  border-bottom: 1px solid ${HairlineColor};
  background: ${PaperColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: 16px;
`;

const ListRow = styled.div`
  padding: 14px 22px;
  border-bottom: 1px solid ${HairlineColor};
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: 16px;
  align-items: center;
  font-size: 13.5px;
  color: ${InkColor};
  &:last-child {
    border-bottom: 0;
  }
`;

const Avatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${AccentColor};
  color: ${SurfaceColor};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
`;

const NameCell = styled.div`
  display: inline-flex;
  align-items: center;
`;

const EmailCell = styled.div`
  color: ${MutedColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
`;

const RoleTag = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: ${PaperColor};
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${InkColor};
`;

const EmptyRow = styled.div`
  padding: 40px 22px;
  text-align: center;
  color: ${MutedColor};
  font-size: 13.5px;
`;

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const initialsOf = (name?: {
  firstName?: string;
  lastName?: string;
} | null): string => {
  const first = name?.firstName?.[0] ?? '';
  const last = name?.lastName?.[0] ?? '';
  const combined = `${first}${last}`.toUpperCase().trim();
  return combined || '?';
};

const displayName = (name?: {
  firstName?: string;
  lastName?: string;
} | null): string => {
  const first = name?.firstName ?? '';
  const last = name?.lastName ?? '';
  const full = `${first} ${last}`.trim();
  return full || 'Sans nom';
};

export const BuzzleMembersSettings = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [okMessage, setOkMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { records, loading, refetch } = useFindManyRecords({
    objectNameSingular: 'workspaceMember',
    orderBy: [{ createdAt: 'AscNullsLast' }],
  });

  const [sendInvitations] = useMutation(SendInvitationsDocument);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setOkMessage('');
    setErrorMessage('');
    const email = inviteEmail.trim();
    if (!email) return;
    setSending(true);
    try {
      const result = await sendInvitations({
        variables: { emails: [email] },
      });
      const payload = result.data?.sendInvitations;
      if (payload?.success) {
        setOkMessage(`Invitation envoyée à ${email}.`);
        setInviteEmail('');
        refetch();
      } else {
        setErrorMessage(
          payload?.errors?.join(', ') || 'Envoi de l\'invitation impossible.',
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur pendant l\'envoi.';
      setErrorMessage(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <BuzzleSettingsLayout activeTab="members">
      <Card>
        <CardHead>
          <div>
            <CardTitle>Inviter un nouveau membre</CardTitle>
            <CardSub>
              L'invitation est envoyée par email avec un lien de connexion.
            </CardSub>
          </div>
        </CardHead>
        <form onSubmit={handleInvite}>
          <InviteRow>
            <EmailInput
              type="email"
              placeholder="adresse@exemple.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <InviteButton type="submit" disabled={sending}>
              <IconSend /> {sending ? 'Envoi…' : 'Envoyer l\'invitation'}
            </InviteButton>
          </InviteRow>
          {okMessage && <OkBanner>{okMessage}</OkBanner>}
          {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}
        </form>
      </Card>

      <ListWrap>
        <ListHead>
          <div>Membre</div>
          <div>Email</div>
          <div>Rôle</div>
        </ListHead>
        {loading && (!records || records.length === 0) ? (
          <EmptyRow>Chargement des membres…</EmptyRow>
        ) : records && records.length > 0 ? (
          records.map((row) => (
            <ListRow key={row.id}>
              <NameCell>
                <Avatar>
                  {initialsOf(
                    row.name as {
                      firstName?: string;
                      lastName?: string;
                    } | null,
                  )}
                </Avatar>
                {displayName(
                  row.name as {
                    firstName?: string;
                    lastName?: string;
                  } | null,
                )}
              </NameCell>
              <EmailCell>
                {typeof row.userEmail === 'string' ? row.userEmail : ''}
              </EmailCell>
              <div>
                <RoleTag>Membre</RoleTag>
              </div>
            </ListRow>
          ))
        ) : (
          <EmptyRow>Aucun membre pour le moment.</EmptyRow>
        )}
      </ListWrap>
    </BuzzleSettingsLayout>
  );
};
