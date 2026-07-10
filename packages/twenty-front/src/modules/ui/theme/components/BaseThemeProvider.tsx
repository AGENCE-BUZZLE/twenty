import { type JSX, createContext } from 'react';

import { type ColorScheme } from 'twenty-ui/input';
import { ThemeProvider } from 'twenty-ui/theme-constants';

type BaseThemeProviderProps = {
  children: JSX.Element | JSX.Element[];
};

// Buzzle: single theme. The whole app renders in Light (Schemata palette).
// The workspaceMember.colorScheme column and its picker in Settings are
// no longer read here, so switching the value has no effect.
// If we later want a dark mode we bring the toggle back and honour the
// persisted preference again.
export const ThemeSchemeContext = createContext<(theme: ColorScheme) => void>(
  () => {},
);

export const BaseThemeProvider = ({ children }: BaseThemeProviderProps) => {
  return (
    <ThemeSchemeContext.Provider value={() => {}}>
      <ThemeProvider colorScheme="light">{children}</ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
