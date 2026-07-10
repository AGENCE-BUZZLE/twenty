import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { BuzzleSettingsLayout } from '@/buzzle-settings/BuzzleSettingsLayout';
import { useUpdateWorkspaceMemberSettings } from '@/settings/profile/hooks/useUpdateWorkspaceMemberSettings';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const InkColor = '#14141c';
const PaperColor = '#efede6';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const AccentColor = '#5b4bff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Card = styled.div`
  border: 1px solid ${InkColor};
  border-radius: 12px;
  background: ${InkColor};
  color: ${SurfaceColor};
  padding: 28px 32px;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const SectionTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: ${SurfaceColor};
`;

const SectionSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  margin-top: 2px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const InlineFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
`;

const Input = styled.input`
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: ${InkColor};
  background: ${SurfaceColor};
  &:focus {
    outline: none;
    border-color: ${SurfaceColor};
  }
  &:disabled {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.55);
    cursor: not-allowed;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const SubmitButton = styled.button`
  background: ${SurfaceColor};
  color: ${InkColor};
  border: 1px solid ${SurfaceColor};
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    opacity: 0.88;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SavedBadge = styled.span<{ visible: boolean }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${AccentColor};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.25s;
  align-self: center;
`;

export const BuzzleProfileSettings = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { updateWorkspaceMemberSettings } = useUpdateWorkspaceMemberSettings();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);

  useEffect(() => {
    setFirstName(currentWorkspaceMember?.name?.firstName ?? '');
    setLastName(currentWorkspaceMember?.name?.lastName ?? '');
  }, [currentWorkspaceMember]);

  const dirty =
    firstName !== (currentWorkspaceMember?.name?.firstName ?? '') ||
    lastName !== (currentWorkspaceMember?.name?.lastName ?? '');

  const handleSave = async () => {
    if (!currentWorkspaceMember?.id || saving) return;
    setSaving(true);
    try {
      await updateWorkspaceMemberSettings({
        workspaceMemberId: currentWorkspaceMember.id,
        update: { name: { firstName, lastName } },
      });
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BuzzleSettingsLayout activeTab="profile">
      <Card>
        <SectionHead>
          <div>
            <SectionTitle>Informations personnelles</SectionTitle>
            <SectionSubtitle>
              Modifiez votre nom affiché dans le workspace.
            </SectionSubtitle>
          </div>
          <SavedBadge visible={savedRecently}>Enregistré</SavedBadge>
        </SectionHead>

        <FieldGroup>
          <InlineFields>
            <Field>
              <Label>Prénom</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Clément"
              />
            </Field>
            <Field>
              <Label>Nom</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Lavis"
              />
            </Field>
          </InlineFields>

          <Field>
            <Label>Adresse email</Label>
            <Input
              type="email"
              value={currentUser?.email ?? ''}
              disabled
            />
          </Field>
        </FieldGroup>

        <Actions>
          <SubmitButton onClick={handleSave} disabled={!dirty || saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </SubmitButton>
        </Actions>
      </Card>
    </BuzzleSettingsLayout>
  );
};
