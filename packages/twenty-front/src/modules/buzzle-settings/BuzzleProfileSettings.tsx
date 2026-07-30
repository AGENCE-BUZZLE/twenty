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
  border: 1px solid rgba(20, 20, 28, 0.08);
  border-radius: 22px;
  background: ${SurfaceColor};
  color: ${InkColor};
  padding: 26px 28px 28px;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const SectionTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: ${InkColor};
  letter-spacing: -0.01em;
`;

const SectionSubtitle = styled.div`
  color: ${MutedColor};
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
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: ${MutedColor};
`;

const Input = styled.input`
  padding: 11px 14px;
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
  &:disabled {
    background: rgba(20, 20, 28, 0.04);
    color: ${MutedColor};
    cursor: not-allowed;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
`;

const SubmitButton = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 0;
  padding: 10px 20px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SavedBadge = styled.span<{ visible: boolean }>`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #16a34a;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.25s;
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
