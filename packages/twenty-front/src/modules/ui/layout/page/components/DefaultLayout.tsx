import { AppErrorBoundary } from '@/error-handler/components/AppErrorBoundary';
import { AppFullScreenErrorFallback } from '@/error-handler/components/AppFullScreenErrorFallback';
import { AppPageErrorFallback } from '@/error-handler/components/AppPageErrorFallback';
import { FileUploadProvider } from '@/file-upload/components/FileUploadProvider';
import { InformationBannerIsImpersonating } from '@/information-banner/components/impersonate/InformationBannerIsImpersonating';
import { KeyboardShortcutMenu } from '@/keyboard-shortcut-menu/components/KeyboardShortcutMenu';
import { LayoutCustomizationBar } from '@/layout-customization/components/LayoutCustomizationBar';
import { AppNavigationDrawer } from '@/navigation/components/AppNavigationDrawer';
import { BuzzleMobileHeader } from '@/buzzle-workspace-nav/BuzzleMobileHeader';
import { BuzzleInkShellBackground } from '@/buzzle-workspace-nav/BuzzleInkShellBackground';
import { PageDragDropProvider } from '@/navigation-menu-item/display/dnd/providers/PageDragDropProvider';
import { useShowFullscreen } from '@/ui/layout/fullscreen/hooks/useShowFullscreen';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { styled } from '@linaria/react';
import { Outlet, useLocation } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';
const StyledLayout = styled.div`
  background: ${themeCssVariables.grayScale.gray3};

  &[data-shell='overview'] {
    background: transparent;
  }

  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  scrollbar-color: ${themeCssVariables.border.color.medium} transparent;
  scrollbar-width: 4px;
  width: 100%;

  *::-webkit-scrollbar-thumb {
    border-radius: ${themeCssVariables.border.radius.md};
  }

  @media print {
    background: ${themeCssVariables.background.primary};
    height: auto;
    min-height: 100%;
    overflow: visible;
  }
`;

const StyledPageContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  min-height: 0;
  min-width: 0;

  @media print {
    display: block;
    min-height: auto;
    min-width: auto;
    overflow: visible;
  }
`;

// Buzzle: dark navigation rail. We scope Twenty's CSS custom
// properties inside the drawer wrapper so every child component that
// reads `themeCssVariables.grayScale.gray3` / font colors / hover
// backgrounds resolves to Ink + white / white-transparents.
// Nothing else in the app is affected because CSS variables cascade
// scope-locally.
const StyledNavigationDrawerWrapper = styled.div`
  flex-shrink: 0;

  --t-gray-scale-gray3: #14141c;
  --t-color-gray3: #14141c;
  --t-gray-scale-gray2: #1c1c26;
  --t-color-gray2: #1c1c26;
  --t-gray-scale-gray4: #26262f;
  --t-color-gray4: #26262f;

  --t-font-color-primary: #ffffff;
  --t-font-color-secondary: rgba(255, 255, 255, 0.72);
  --t-font-color-tertiary: rgba(255, 255, 255, 0.5);
  --t-font-color-light: rgba(255, 255, 255, 0.6);
  --t-font-color-extra-light: rgba(255, 255, 255, 0.4);
  --t-font-color-inverted-primary: #14141c;

  --t-background-primary: #14141c;
  --t-background-secondary: #1c1c26;
  --t-background-tertiary: #26262f;
  --t-background-transparent-light: rgba(255, 255, 255, 0.06);
  --t-background-transparent-lighter: rgba(255, 255, 255, 0.03);
  --t-background-transparent-medium: rgba(255, 255, 255, 0.1);
  --t-background-transparent-strong: rgba(255, 255, 255, 0.16);

  --t-border-color-light: rgba(255, 255, 255, 0.08);
  --t-border-color-medium: rgba(255, 255, 255, 0.12);
  --t-border-color-strong: rgba(255, 255, 255, 0.2);

  background: #14141c;
  color: #ffffff;

  &[data-shell='overview'] {
    display: none;
  }

  @media print {
    display: none;
  }
`;

const StyledMobileHeaderWrap = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const StyledMainContainer = styled.div`
  display: flex;
  flex: 0 1 100%;
  min-width: 0;
  overflow: hidden;

  @media print {
    display: block;
    min-width: auto;
    overflow: visible;
  }
`;

export const DefaultLayout = () => {
  const isMobile = useIsMobile();
  const useShowFullScreen = useShowFullscreen();
  const location = useLocation();
  // Route-conditional shell: /overview renders its own Ink shell
  // (floating pill sidebar + logo top-bar + card stage) so we hide
  // the default gray background and desktop drawer.
  // Pages that render their own Ink shell (background + pill sidebar +
  // logo top-bar + white Stage). We only trigger the shell for pages
  // that actually opt into it — Contacts / Factures / Appels still use
  // the drawer nav today and would break if the drawer got hidden.
  const inkShellPrefixes = ['/overview', '/audit-seo-geo'];
  const isOverviewShell =
    !isMobile &&
    !useShowFullScreen &&
    (location.pathname === '/' ||
      inkShellPrefixes.some((p) => location.pathname.startsWith(p)));
  const shellAttr = isOverviewShell ? 'overview' : undefined;

  return (
    <>
      <FileUploadProvider>
        {isOverviewShell && <BuzzleInkShellBackground />}
        <StyledLayout data-shell={shellAttr}>
          <AppErrorBoundary FallbackComponent={AppFullScreenErrorFallback}>
            <InformationBannerIsImpersonating />
            <LayoutCustomizationBar />
            {isMobile && !useShowFullScreen && (
              <StyledMobileHeaderWrap>
                <BuzzleMobileHeader />
              </StyledMobileHeaderWrap>
            )}
            <StyledPageContainer>
              <PageDragDropProvider>
                <KeyboardShortcutMenu />
                {useShowFullScreen ? null : (
                  <StyledNavigationDrawerWrapper data-shell={shellAttr}>
                    <AppNavigationDrawer />
                  </StyledNavigationDrawerWrapper>
                )}
                <StyledMainContainer>
                  <AppErrorBoundary FallbackComponent={AppPageErrorFallback}>
                    <Outlet />
                  </AppErrorBoundary>
                </StyledMainContainer>
              </PageDragDropProvider>
            </StyledPageContainer>
          </AppErrorBoundary>
        </StyledLayout>
      </FileUploadProvider>
    </>
  );
};
