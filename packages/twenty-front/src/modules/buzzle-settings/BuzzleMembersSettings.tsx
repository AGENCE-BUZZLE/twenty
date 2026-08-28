import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { BuzzleSettingsLayout } from '@/buzzle-settings/BuzzleSettingsLayout';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { SendInvitationsDocument } from '~/generated-metadata/graphql';

// Roles a super admin / admin can assign to invited members. "Super
// Administrateur" is intentionally left out — that badge is granted at the
// user level (canAccessFullAdminPanel), not via an invite.
type AssignableRole = 'admin' | 'standard' | 'read';

const ASSIGNABLE_ROLES: Array<{
  value: AssignableRole;
  label: string;
  description: string;
}> = [
  {
    value: 'admin',
    label: 'Administrateur',
    description:
      'Accès complet : peut inviter des membres et changer les statuts.',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Peut uniquement changer le statut des leads existants.',
  },
  {
    value: 'read',
    label: 'Lecture seule',
    description: 'Consulte les leads et rapports, sans possibilité de modifier.',
  },
];

// Client-side persistence pour les rôles choisis lors des invitations,
// tant que le backend permissions Twenty n'est pas branché. Les rôles
// remontent ensuite dans la liste des membres (badge par email).
const rolesStorageKey = (workspaceId?: string): string =>
  `buzzle-member-roles:${workspaceId ?? 'default'}`;

const loadRoleMap = (workspaceId?: string): Record<string, AssignableRole> => {
  try {
    const raw = localStorage.getItem(rolesStorageKey(workspaceId));

    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AssignableRole>;

    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const persistRole = (
  workspaceId: string | undefined,
  email: string,
  role: AssignableRole,
): void => {
  try {
    const map = loadRoleMap(workspaceId);

    map[email.toLowerCase()] = role;
    localStorage.setItem(rolesStorageKey(workspaceId), JSON.stringify(map));
  } catch {
    // ignore
  }
};

// Members management (Buzzle visual). Lists workspaceMember records and
// exposes a compact "invite by email" form. Twenty's sendInvitations
// mutation is called directly; the email owner receives a magic link.

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const AccentColor = '#12b76a';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const OkColor = '#187a4a';
const OkSoft = '#e3f4ea';
const DangerColor = '#c94a4a';
const DangerSoft = '#fbe5e5';

const Card = styled.div`
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  background: ${SurfaceColor};
  color: ${InkColor};
  padding: 24px 26px;
  margin-bottom: 20px;
`;

const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
`;

const CardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
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
  flex-wrap: wrap;
`;

const RoleSelect = styled.select`
  padding: 10px 14px;
  border: 1px solid rgba(20, 20, 28, 0.14);
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: ${InkColor};
  background: ${SurfaceColor};
  min-width: 180px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const RoleHint = styled.div`
  width: 100%;
  color: ${MutedColor};
  font-size: 12px;
  line-height: 1.5;
  margin-top: -2px;
`;

const RestrictedBanner = styled.div`
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid rgba(20, 20, 28, 0.08);
  background: rgba(20, 20, 28, 0.03);
  color: ${MutedColor};
  font-size: 13px;
  margin-bottom: 20px;
`;

const EmailInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(20, 20, 28, 0.14);
  border-radius: 10px;
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
  border: 0;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  &:hover {
    opacity: 0.9;
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
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  overflow: hidden;
  background: ${SurfaceColor};
`;

const ListHead = styled.div`
  padding: 14px 22px;
  border-bottom: 1px solid rgba(20, 20, 28, 0.08);
  background: rgba(20, 20, 28, 0.03);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: ${MutedColor};
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: 16px;
`;

const ListRow = styled.div`
  padding: 14px 22px;
  border-bottom: 1px solid rgba(20, 20, 28, 0.06);
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
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
`;

const RoleTag = styled.span<{ tone?: 'super' | 'admin' | 'standard' | 'read' }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  background: ${({ tone }) =>
    tone === 'super'
      ? 'rgba(18, 183, 106, 0.16)'
      : tone === 'admin'
        ? 'rgba(20, 20, 28, 0.08)'
        : tone === 'standard'
          ? 'rgba(20, 20, 28, 0.06)'
          : 'rgba(20, 20, 28, 0.04)'};
  color: ${({ tone }) =>
    tone === 'super' ? '#0e9155' : InkColor};
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

// Temporary role mapping. Twenty's real 4-role system (Super Administrateur /
// Administrateur / Standard / Lecture seule) will be wired to the workspace
// roleTargets table in a follow-up. For now:
// - The currently authenticated user with canAccessFullAdminPanel = true
//   reads as "Super Administrateur".
// - Everyone else falls back to whatever was picked when they were invited
//   (persisted in localStorage), defaulting to "Administrateur".
const roleTone: Record<AssignableRole, 'admin' | 'standard' | 'read'> = {
  admin: 'admin',
  standard: 'standard',
  read: 'read',
};
const roleLabel: Record<AssignableRole, string> = {
  admin: 'Administrateur',
  standard: 'Standard',
  read: 'Lecture seule',
};

const resolveRole = (
  memberEmail: string | undefined,
  currentUserEmail: string | undefined,
  currentUserIsSuperAdmin: boolean,
  roleMap: Record<string, AssignableRole>,
): { label: string; tone: 'super' | 'admin' | 'standard' | 'read' } => {
  if (
    currentUserIsSuperAdmin &&
    memberEmail &&
    memberEmail === currentUserEmail
  ) {
    return { label: 'Super Administrateur', tone: 'super' };
  }
  const assigned = memberEmail
    ? roleMap[memberEmail.toLowerCase()]
    : undefined;

  if (assigned) {
    return { label: roleLabel[assigned], tone: roleTone[assigned] };
  }

  return { label: 'Administrateur', tone: 'admin' };
};

export const BuzzleMembersSettings = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableRole>('admin');
  const [okMessage, setOkMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sending, setSending] = useState(false);

  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const [roleMap, setRoleMap] = useState<Record<string, AssignableRole>>(() =>
    loadRoleMap(currentWorkspace?.id),
  );

  // Current-user role — governs whether we render the invite card at all.
  // Super Admin + Admin can invite; Standard + Lecture seule cannot.
  const currentRole = resolveRole(
    currentUser?.email,
    currentUser?.email,
    currentUser?.canAccessFullAdminPanel ?? false,
    roleMap,
  );
  const canInvite =
    currentRole.tone === 'super' || currentRole.tone === 'admin';

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
        persistRole(currentWorkspace?.id, email, inviteRole);
        setRoleMap((prev) => ({ ...prev, [email.toLowerCase()]: inviteRole }));
        setOkMessage(
          `Invitation envoyée à ${email} avec le rôle ${roleLabel[inviteRole]}.`,
        );
        setInviteEmail('');
        setInviteRole('admin');
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
      {canInvite ? (
        <Card>
          <CardHead>
            <div>
              <CardTitle>Inviter un nouveau membre</CardTitle>
              <CardSub>
                L'invitation est envoyée par email avec un lien de connexion.
                Choisissez le rôle qui définira ses droits dans le workspace.
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
              <RoleSelect
                aria-label="Rôle à attribuer"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as AssignableRole)
                }
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </RoleSelect>
              <InviteButton type="submit" disabled={sending}>
                <IconSend /> {sending ? 'Envoi…' : 'Envoyer l\'invitation'}
              </InviteButton>
              <RoleHint>
                {ASSIGNABLE_ROLES.find((r) => r.value === inviteRole)?.description}
              </RoleHint>
            </InviteRow>
            {okMessage && <OkBanner>{okMessage}</OkBanner>}
            {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}
          </form>
        </Card>
      ) : (
        <RestrictedBanner>
          Seuls les Administrateurs et Super Administrateurs peuvent inviter de
          nouveaux membres. Contactez un administrateur du workspace pour
          demander un accès.
        </RestrictedBanner>
      )}

      <ListWrap>
        <ListHead>
          <div>Membre</div>
          <div>Email</div>
          <div>Rôle</div>
        </ListHead>
        {loading && (!records || records.length === 0) ? (
          <EmptyRow>Chargement des membres…</EmptyRow>
        ) : records && records.length > 0 ? (
          records.map((row) => {
            const email =
              typeof row.userEmail === 'string' ? row.userEmail : '';
            const role = resolveRole(
              email,
              currentUser?.email,
              currentUser?.canAccessFullAdminPanel ?? false,
              roleMap,
            );

            return (
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
                <EmailCell>{email}</EmailCell>
                <div>
                  <RoleTag tone={role.tone}>{role.label}</RoleTag>
                </div>
              </ListRow>
            );
          })
        ) : (
          <EmptyRow>Aucun membre pour le moment.</EmptyRow>
        )}
      </ListWrap>
    </BuzzleSettingsLayout>
  );
};
