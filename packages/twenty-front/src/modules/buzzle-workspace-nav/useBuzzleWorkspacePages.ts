import { useEffect, useState } from 'react';

// Which pages a client sees is decided in Buzzle Copilot, not here. This hook
// fetches that decision at boot and falls back to the compiled defaults when
// the cockpit cannot be reached, so the nav never comes back empty.
//
// The workspace is read from the hostname (<slug>.crm.agence-buzzle.com), the
// same key the backend uses to resolve it.
const COCKPIT = 'https://app.agence-buzzle.com';

export const workspaceSlug = (): string | null => {
  if (typeof window === 'undefined') return null;
  const [slug, ...rest] = window.location.hostname.split('.');
  return rest.length >= 3 && slug !== 'crm' ? slug : null;
};

// Ordre du menu, et chemin de chaque page. Sert a choisir ou atterrir quand
// la page d'accueil habituelle est fermee pour cet espace.
export const BUZZLE_PAGE_PATHS: ReadonlyArray<{ key: string; path: string }> = [
  { key: 'home', path: '/overview' },
  { key: 'contacts', path: '/contacts' },
  { key: 'calls', path: '/calls' },
  { key: 'invoices', path: '/invoices' },
  { key: 'documents', path: '/documents' },
  { key: 'rdv', path: '/rendez-vous' },
  { key: 'seo', path: '/audit-seo-geo' },
];

// Premiere page ouverte, dans l'ordre du menu. Null tant qu'on ne sait pas.
export const premierePageOuverte = (
  pages: Record<string, boolean> | null,
): string | null => {
  if (pages === null) return null;
  const trouvee = BUZZLE_PAGE_PATHS.find((p) => pages[p.key] === true);
  return trouvee?.path ?? null;
};

export const useBuzzleWorkspacePages = (): Record<string, boolean> | null => {
  const [pages, setPages] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    const slug = workspaceSlug();
    if (slug === null) return;

    let alive = true;
    fetch(`${COCKPIT}/api/public/crm-pages?ws=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data?.pages) return;
        const byKey: Record<string, boolean> = {};
        for (const page of data.pages) byKey[page.key] = page.enabled === true;
        setPages(byKey);
      })
      .catch(() => {
        // Cockpit unreachable: keep the compiled defaults rather than
        // locking the client out of his own space.
      });

    return () => {
      alive = false;
    };
  }, []);

  return pages;
};
