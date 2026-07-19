import { fromUrl } from '@lingui/detect-locale';
import { APP_LOCALES } from 'twenty-shared/translations';
import { isDefined, isValidLocale, normalizeLocale } from 'twenty-shared/utils';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

// Buzzle white-label : on force le français par défaut sur tout l'écosystème
// CRM. Seuls les liens explicites avec ?locale=en-... peuvent basculer en
// anglais (les préférences utilisateur passeront par currentUser.locale plus
// tard). On ne relit pas navigator.language / localStorage pour éviter que le
// premier écran (welcome, sign-in, mot de passe oublié) apparaisse en anglais.
export const initialI18nActivate = () => {
  let locale: keyof typeof APP_LOCALES = APP_LOCALES['fr-FR'];

  const urlLocale = fromUrl('locale');
  const normalizedUrlLocale = isDefined(urlLocale)
    ? normalizeLocale(urlLocale)
    : null;

  if (isDefined(normalizedUrlLocale) && isValidLocale(normalizedUrlLocale)) {
    locale = normalizedUrlLocale;
    try {
      localStorage.setItem('locale', normalizedUrlLocale);
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.log('Failed to save locale to localStorage:', error);
    }
  }

  dynamicActivate(locale);
};
