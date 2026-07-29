import { styled } from '@linaria/react';
import { useStore } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_LOCALES } from 'twenty-shared/translations';
import {
  IconChevronDown,
  IconCheck,
  IconLogout,
  IconSettings,
  IconUser,
  IconUsers,
  IconWorldWww,
} from 'twenty-ui/icon';
import { enUS } from 'date-fns/locale';

import { useAuth } from '@/auth/hooks/useAuth';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { useUpdateWorkspaceMemberSettings } from '@/settings/profile/hooks/useUpdateWorkspaceMemberSettings';
import { getDateFnsLocale } from '@/ui/field/display/utils/getDateFnsLocale';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';
import { logError } from '~/utils/logError';

// Buzzle: sidebar footer with a Paramètres button. Opens a menu with
// Profil / Membres / Langue submenu / Déconnexion. Replaces the previous
// workspace switcher · that lives in the overview header now.

const SUPPORTED_LOCALES: Array<keyof typeof APP_LOCALES> = ['en', 'fr-FR'];
const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  'fr-FR': 'Français',
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
  position: relative;
`;

const Trigger = styled.button`
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const TriggerIcon = styled.span`
  display: inline-flex;
  color: rgba(255, 255, 255, 0.8);
`;

const TriggerLabel = styled.span`
  flex: 1 1 auto;
  text-align: left;
`;

const Menu = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 12px;
  right: 12px;
  min-width: 200px;
  background: #ffffff;
  color: #14141c;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.18);
  z-index: 40;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: #14141c;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const MenuItemIcon = styled.span`
  display: inline-flex;
  color: rgba(20, 20, 28, 0.6);
`;

const MenuItemLabel = styled.span`
  flex: 1;
`;

const MenuItemMeta = styled.span`
  color: rgba(20, 20, 28, 0.55);
  font-size: 12px;
`;

const MenuDivider = styled.div`
  height: 1px;
  background: rgba(20, 20, 28, 0.08);
  margin: 6px 0;
`;

const MenuHeader = styled.div`
  padding: 8px 12px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(20, 20, 28, 0.55);
`;

type MenuVariant = 'root' | 'languages';

export const BuzzleSettingsFooter = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const store = useStore();
  const [currentWorkspaceMember, setCurrentWorkspaceMember] = useAtomState(
    currentWorkspaceMemberState,
  );
  const { updateWorkspaceMemberSettings } = useUpdateWorkspaceMemberSettings();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const currentLocale = currentWorkspaceMember?.locale ?? APP_LOCALES.en;
  const currentLocaleLabel =
    LOCALE_LABELS[currentLocale as string] ?? (currentLocale as string);

  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<MenuVariant>('root');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setVariant('root');
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = () => {
    setOpen(false);
    setVariant('root');
  };

  const handleLocale = async (locale: keyof typeof APP_LOCALES) => {
    if (!currentWorkspaceMember?.id) return;
    try {
      setCurrentWorkspaceMember({ ...currentWorkspaceMember, locale });
      await updateWorkspaceMemberSettings({
        workspaceMemberId: currentWorkspaceMember.id,
        update: { locale },
      });
      const dateFnsLocale = await getDateFnsLocale(locale);

      store.set(dateLocaleState.atom, {
        locale,
        localeCatalog: dateFnsLocale || enUS,
      });
      await dynamicActivate(locale);
      try {
        localStorage.setItem('locale', locale);
      } catch {
        // ignore
      }
      invalidateMetadataStore();
    } catch (error) {
      logError(error);
    }
    close();
  };

  return (
    <Container ref={ref}>
      <Trigger
        onClick={() => {
          setOpen((prev) => !prev);
          setVariant('root');
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <TriggerIcon>
          <IconSettings size={16} />
        </TriggerIcon>
        <TriggerLabel>Paramètres</TriggerLabel>
        <TriggerIcon>
          <IconChevronDown size={14} />
        </TriggerIcon>
      </Trigger>
      {open && variant === 'root' && (
        <Menu role="menu">
          <MenuItem
            onClick={() => {
              navigate('/settings/profile');
              close();
            }}
          >
            <MenuItemIcon>
              <IconUser size={15} />
            </MenuItemIcon>
            <MenuItemLabel>Profil</MenuItemLabel>
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate('/settings/members');
              close();
            }}
          >
            <MenuItemIcon>
              <IconUsers size={15} />
            </MenuItemIcon>
            <MenuItemLabel>Membres</MenuItemLabel>
          </MenuItem>
          <MenuItem onClick={() => setVariant('languages')}>
            <MenuItemIcon>
              <IconWorldWww size={15} />
            </MenuItemIcon>
            <MenuItemLabel>Langue</MenuItemLabel>
            <MenuItemMeta>{currentLocaleLabel}</MenuItemMeta>
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={() => { close(); signOut(); }}>
            <MenuItemIcon>
              <IconLogout size={15} />
            </MenuItemIcon>
            <MenuItemLabel>Déconnexion</MenuItemLabel>
          </MenuItem>
        </Menu>
      )}

      {open && variant === 'languages' && (
        <Menu role="menu">
          <MenuHeader>Langue</MenuHeader>
          {SUPPORTED_LOCALES.map((loc) => (
            <MenuItem key={loc} onClick={() => handleLocale(loc)}>
              <MenuItemIcon>
                {loc === currentLocale ? <IconCheck size={15} /> : null}
              </MenuItemIcon>
              <MenuItemLabel>{LOCALE_LABELS[loc]}</MenuItemLabel>
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem onClick={() => setVariant('root')}>
            <MenuItemLabel>← Retour</MenuItemLabel>
          </MenuItem>
        </Menu>
      )}
    </Container>
  );
};
