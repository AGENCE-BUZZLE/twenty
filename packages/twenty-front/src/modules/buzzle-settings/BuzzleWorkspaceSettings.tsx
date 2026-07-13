import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { BuzzleSettingsLayout } from '@/buzzle-settings/BuzzleSettingsLayout';
import { DEFAULT_WORKSPACE_LOGO } from '@/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  UpdateWorkspaceDocument,
  UploadWorkspaceLogoDocument,
} from '~/generated-metadata/graphql';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

// Super-admin workspace settings: edit displayName, subdomain and logo.
// The layout gates this tab so we still guard defensively here.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Card = styled.div`
  border: 1px solid ${InkColor};
  border-radius: 12px;
  background: ${InkColor};
  color: ${SurfaceColor};
  padding: 28px 32px;
  margin-bottom: 24px;
`;

const SectionHead = styled.div`
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
  margin-top: 4px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
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
`;

const InputHint = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 11.5px;
  font-family: 'JetBrains Mono', monospace;
`;

const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InputSuffix = styled.span`
  color: rgba(255, 255, 255, 0.72);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
`;

const LogoPreview = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const LogoActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
`;

const StatusMsg = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
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

const OutlineButton = styled.button`
  background: transparent;
  color: ${SurfaceColor};
  border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const DangerButton = styled(OutlineButton)`
  color: #ffbdbd;
  border-color: rgba(255, 189, 189, 0.4);
`;

const RestrictedBanner = styled.div`
  padding: 18px 22px;
  border-radius: 12px;
  border: 1px solid rgba(20, 20, 28, 0.14);
  background: rgba(20, 20, 28, 0.04);
  color: ${InkColor};
  font-size: 14px;
`;

const slugify = (raw: string): string =>
  raw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const BuzzleWorkspaceSettings = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const [currentWorkspace, setCurrentWorkspace] = useAtomState(
    currentWorkspaceState,
  );

  const isSuperAdmin = currentUser?.canAccessFullAdminPanel ?? false;

  const [name, setName] = useState(currentWorkspace?.displayName ?? '');
  const [subdomain, setSubdomain] = useState(
    currentWorkspace?.subdomain ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Deux étapes : le fichier choisi est mis en attente + affiché en preview ;
  // l'upload part au clic sur "Enregistrer l'image".
  const [pendingLogo, setPendingLogo] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoStatus, setLogoStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateWorkspace] = useMutation(UpdateWorkspaceDocument);
  const [uploadLogo] = useMutation(UploadWorkspaceLogoDocument);

  useEffect(() => {
    setName(currentWorkspace?.displayName ?? '');
    setSubdomain(currentWorkspace?.subdomain ?? '');
  }, [currentWorkspace?.id]);

  const dirty = useMemo(() => {
    return (
      name !== (currentWorkspace?.displayName ?? '') ||
      subdomain !== (currentWorkspace?.subdomain ?? '')
    );
  }, [
    name,
    subdomain,
    currentWorkspace?.displayName,
    currentWorkspace?.subdomain,
  ]);

  if (!isSuperAdmin) {
    return (
      <BuzzleSettingsLayout activeTab="workspace">
        <RestrictedBanner>
          Seul le Super Administrateur peut modifier les paramètres du
          workspace.
        </RestrictedBanner>
      </BuzzleSettingsLayout>
    );
  }

  const handleSave = async () => {
    if (!currentWorkspace?.id || saving) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const cleanedSubdomain = slugify(subdomain);

      const result = await updateWorkspace({
        variables: {
          input: {
            displayName: name.trim() || undefined,
            subdomain: cleanedSubdomain || undefined,
          },
        },
      });
      const updated = result.data?.updateWorkspace;

      if (updated) {
        setCurrentWorkspace({
          ...currentWorkspace,
          displayName: updated.displayName ?? name,
          subdomain: updated.subdomain ?? cleanedSubdomain,
        });
        setSubdomain(updated.subdomain ?? cleanedSubdomain);
        setSavedRecently(true);
        setTimeout(() => setSavedRecently(false), 2200);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Impossible de sauvegarder.';

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoPick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoFile = (file: File) => {
    if (!currentWorkspace?.id) return;
    // Preview URL local — révoquée quand on remplace / annule / upload.
    if (pendingLogo) {
      URL.revokeObjectURL(pendingLogo.previewUrl);
    }
    setPendingLogo({ file, previewUrl: URL.createObjectURL(file) });
    setLogoStatus('');
    setErrorMessage('');
  };

  const cancelPendingLogo = () => {
    if (pendingLogo) URL.revokeObjectURL(pendingLogo.previewUrl);
    setPendingLogo(null);
  };

  const commitPendingLogo = async () => {
    if (!pendingLogo || !currentWorkspace?.id || uploadingLogo) return;
    setUploadingLogo(true);
    setErrorMessage('');
    try {
      const res = await uploadLogo({
        variables: { file: pendingLogo.file },
      });
      const url = res.data?.uploadWorkspaceLogo?.url;

      if (url) {
        setCurrentWorkspace({ ...currentWorkspace, logo: url });
        setLogoStatus('Enregistré');
        setTimeout(() => setLogoStatus(''), 2200);
      }
      URL.revokeObjectURL(pendingLogo.previewUrl);
      setPendingLogo(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Impossible d\'envoyer le logo.';

      setErrorMessage(message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!currentWorkspace?.id) return;
    try {
      await updateWorkspace({ variables: { input: { logo: null } } });
      setCurrentWorkspace({ ...currentWorkspace, logo: null });
      cancelPendingLogo();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Impossible de retirer le logo.';

      setErrorMessage(message);
    }
  };

  return (
    <BuzzleSettingsLayout activeTab="workspace">
      <Card>
        <SectionHead>
          <SectionTitle>Identité du workspace</SectionTitle>
          <SectionSubtitle>
            Le nom et le slug sont visibles par tous les membres du workspace.
            Le slug pilote l'URL d'accès de votre CRM.
          </SectionSubtitle>
        </SectionHead>

        <FieldGroup>
          <Field>
            <Label htmlFor="ws-name">Nom du workspace</Label>
            <Input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Galaxy Glass"
            />
          </Field>

          <Field>
            <Label htmlFor="ws-slug">Slug (sous-domaine)</Label>
            <InlineRow>
              <Input
                id="ws-slug"
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="galaxy-glass"
                style={{ maxWidth: 260 }}
              />
              <InputSuffix>.crm.agence-buzzle.com</InputSuffix>
            </InlineRow>
            <InputHint>
              lettres, chiffres et tirets — sans espace ni accent.
            </InputHint>
          </Field>
        </FieldGroup>

        <Actions>
          <StatusMsg>
            {errorMessage
              ? errorMessage
              : savedRecently
                ? 'Enregistré'
                : ''}
          </StatusMsg>
          <SubmitButton
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </SubmitButton>
        </Actions>
      </Card>

      <Card>
        <SectionHead>
          <SectionTitle>Logo du workspace</SectionTitle>
          <SectionSubtitle>
            Affiché à côté du nom dans le CRM et sur les invitations. Format
            recommandé : PNG ou SVG carré 512 × 512.
          </SectionSubtitle>
        </SectionHead>

        <LogoRow>
          <LogoPreview>
            <img
              src={
                pendingLogo
                  ? pendingLogo.previewUrl
                  : getAbsoluteImageUrl(
                      currentWorkspace?.logo ?? DEFAULT_WORKSPACE_LOGO,
                    )
              }
              alt={currentWorkspace?.displayName ?? 'Logo workspace'}
            />
          </LogoPreview>
          <LogoActions>
            {pendingLogo ? (
              <>
                <SubmitButton
                  type="button"
                  onClick={commitPendingLogo}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Enregistrement…' : 'Enregistrer l\'image'}
                </SubmitButton>
                <OutlineButton
                  type="button"
                  onClick={cancelPendingLogo}
                  disabled={uploadingLogo}
                >
                  Annuler
                </OutlineButton>
              </>
            ) : (
              <>
                <OutlineButton type="button" onClick={handleLogoPick}>
                  Choisir une image
                </OutlineButton>
                {currentWorkspace?.logo && (
                  <DangerButton type="button" onClick={handleLogoRemove}>
                    Retirer
                  </DangerButton>
                )}
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) handleLogoFile(file);
                e.target.value = '';
              }}
            />
          </LogoActions>
        </LogoRow>
        {(logoStatus || (errorMessage && pendingLogo)) && (
          <StatusMsg style={{ marginTop: 12 }}>
            {errorMessage && pendingLogo ? errorMessage : logoStatus}
          </StatusMsg>
        )}
      </Card>
    </BuzzleSettingsLayout>
  );
};
