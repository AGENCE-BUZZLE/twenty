import { type JSX } from 'react';
import { I18nProvider } from '@lingui/react';
import { Container, Html } from '@react-email/components';

import { BaseHead } from 'src/components/BaseHead';
import { Footer } from 'src/components/Footer';
import { Logo } from 'src/components/Logo';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type BaseEmailProps = {
  children: JSX.Element | JSX.Element[] | string;
  width?: number;
  // locale prop is kept optional for backward compatibility with the
  // Twenty callers but is ignored: BaseEmail forces fr-FR below.
  locale?: keyof typeof APP_LOCALES;
};

// Buzzle: force la locale à fr-FR pour tous les emails. Le CRM est
// mono-langue français, et les catalogues fr-FR de twenty-emails
// couvrent l'intégralité des templates utilisés.
const FORCED_LOCALE: keyof typeof APP_LOCALES = 'fr-FR';

export const BaseEmail = ({ children, width }: BaseEmailProps) => {
  const i18nInstance = createI18nInstance(FORCED_LOCALE);

  return (
    <I18nProvider i18n={i18nInstance}>
      <Html lang={FORCED_LOCALE}>
        <BaseHead />
        <Container width={width || 290}>
          <Logo />
          {children}
          <Footer i18n={i18nInstance} />
        </Container>
      </Html>
    </I18nProvider>
  );
};
