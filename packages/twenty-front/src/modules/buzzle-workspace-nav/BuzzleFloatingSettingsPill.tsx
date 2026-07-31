import { styled } from '@linaria/react';
import { useStore } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_LOCALES } from 'twenty-shared/translations';
import {
  IconBuildingSkyscraper,
  IconCheck,
  IconLogout,
  IconSettings,
  IconUser,
  IconUsers,
  IconWorldWww,
} from 'twenty-ui/icon';
import { enUS } from 'date-fns/locale';

import { useAuth } from '@/auth/hooks/useAuth';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { useUpdateWorkspaceMemberSettings } from '@/settings/profile/hooks/useUpdateWorkspaceMemberSettings';
import { getDateFnsLocale } from '@/ui/field/display/utils/getDateFnsLocale';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';
import { logError } from '~/utils/logError';

// Floating pill version of BuzzleSettingsFooter: sits at the bottom of
// the Ink shell's pill sidebar. Clicking pops a menu right of the pill
// with Profil / Membres / Langue / Déconnexion · same actions as the
// original drawer footer, adapted to icon-only pill styling.

const SUPPORTED_LOCALES: Array<keyof typeof APP_LOCALES> = ['en', 'fr-FR'];
const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  'fr-FR': 'Français',
};

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
  margin-top: 8px;
`;

const Pill = styled.button`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: transparent;
  border: 0;
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    transform: translateY(-1px);
  }

  &[data-open='true'] {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }

  // Sur mobile la settings pill vit dans le drawer noir · pas de fond
  // blanc, juste l'icône blanche transparente comme les autres items.
  @media (max-width: 768px) {
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    box-shadow: none;
    backdrop-filter: none;
    border-radius: 12px;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    &[data-open='true'] {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const Tip = styled.span`
  position: absolute;
  left: 66px;
  top: 50%;
  transform: translateY(-50%);
  background: #14141c;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
  z-index: 4;

  ${Pill}:hover & {
    opacity: 1;
    transform: translateY(-50%) translateX(2px);
  }
`;

const Menu = styled.div`
  position: absolute;
  bottom: 0;
  left: calc(100% + 12px);
  min-width: 220px;
  background: #ffffff;
  color: #14141c;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.2);
  z-index: 40;
  border: 1px solid rgba(20, 20, 28, 0.08);

  // Sur mobile la pill est en bas à droite du drawer · le menu s'ouvre
  // au dessus, aligné à droite pour ne pas déborder de l'écran.
  @media (max-width: 768px) {
    bottom: calc(100% + 8px);
    left: auto;
    right: 0;
    min-width: 200px;
    max-width: calc(100vw - 40px);
  }
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

export const BuzzleFloatingSettingsPill = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const store = useStore();
  const [currentWorkspaceMember, setCurrentWorkspaceMember] = useAtomState(
    currentWorkspaceMemberState,
  );
  const currentUser = useAtomStateValue(currentUserState);
  const isSuperAdmin = currentUser?.canAccessFullAdminPanel === true;
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
    <Wrap ref={ref}>
      <Pill
        type="button"
        data-open={open}
        onClick={() => {
          setOpen((prev) => !prev);
          setVariant('root');
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Paramètres"
      >
        <IconSettings size={22} />
        <Tip>Paramètres</Tip>
      </Pill>
      {open && variant === 'root' && (
        <Menu role="menu">
          <MenuItem
            type="button"
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
            type="button"
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
          {isSuperAdmin && (
            <MenuItem
              type="button"
              onClick={() => {
                navigate('/settings/workspace');
                close();
              }}
            >
              <MenuItemIcon>
                <IconBuildingSkyscraper size={15} />
              </MenuItemIcon>
              <MenuItemLabel>Espace de travail</MenuItemLabel>
            </MenuItem>
          )}
          <MenuItem type="button" onClick={() => setVariant('languages')}>
            <MenuItemIcon>
              <IconWorldWww size={15} />
            </MenuItemIcon>
            <MenuItemLabel>Langue</MenuItemLabel>
            <MenuItemMeta>{currentLocaleLabel}</MenuItemMeta>
          </MenuItem>
          <MenuDivider />
          <MenuItem
            type="button"
            onClick={() => {
              close();
              signOut();
            }}
          >
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
            <MenuItem type="button" key={loc} onClick={() => handleLocale(loc)}>
              <MenuItemIcon>
                {loc === currentLocale ? <IconCheck size={15} /> : null}
              </MenuItemIcon>
              <MenuItemLabel>{LOCALE_LABELS[loc]}</MenuItemLabel>
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem type="button" onClick={() => setVariant('root')}>
            <MenuItemLabel>← Retour</MenuItemLabel>
          </MenuItem>
        </Menu>
      )}
    </Wrap>
  );
};
