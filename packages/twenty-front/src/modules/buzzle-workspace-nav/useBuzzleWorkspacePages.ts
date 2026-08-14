import { useEffect, useState } from 'react';

// Which pages a client sees is decided in Buzzle Copilot, not here.
//
// Two things matter for the eye: never show an entry the client is not
// supposed to have, even for a frame, and never leave him in front of an
// empty rail. Hence the three states below, and a cache that survives both
// navigation and reload: after the first visit the answer is there before
// the first paint.
const COCKPIT = 'https://app.agence-buzzle.com';

export type PagesStatut = 'chargement' | 'connu' | 'indisponible';

export type PagesOuvertes = {
  pages: Record<string, boolean> | null;
  statut: PagesStatut;
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

export const workspaceSlug = (): string | null => {
  if (typeof window === 'undefined') return null;
  const [slug, ...rest] = window.location.hostname.split('.');
  return rest.length >= 3 && slug !== 'crm' ? slug : null;
};

// Memoire du module : une navigation interne ne redemande rien.
const memoire = new Map<string, Record<string, boolean>>();
const cle = (slug: string) => `buzzle.pages.${slug}`;

const lireCache = (slug: string): Record<string, boolean> | null => {
  const vif = memoire.get(slug);
  if (vif !== undefined) return vif;
  try {
    const brut = window.localStorage.getItem(cle(slug));
    if (brut === null) return null;
    const pages = JSON.parse(brut) as Record<string, boolean>;
    memoire.set(slug, pages);
    return pages;
  } catch {
    return null;
  }
};

export const useBuzzleWorkspacePages = (): PagesOuvertes => {
  const slug = workspaceSlug();
  const [pages, setPages] = useState<Record<string, boolean> | null>(() =>
    slug === null ? null : lireCache(slug),
  );
  const [statut, setStatut] = useState<PagesStatut>(() => {
    if (slug === null) return 'indisponible';
    return lireCache(slug) === null ? 'chargement' : 'connu';
  });

  useEffect(() => {
    if (slug === null) return;

    let alive = true;
    fetch(`${COCKPIT}/api/public/crm-pages?ws=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive) return;
        if (!data?.pages) {
          // Espace inconnu du cockpit : on retombe sur les valeurs compilees.
          setStatut((s) => (s === 'connu' ? s : 'indisponible'));
          return;
        }
        const byKey: Record<string, boolean> = {};
        for (const page of data.pages) byKey[page.key] = page.enabled === true;
        memoire.set(slug, byKey);
        try {
          window.localStorage.setItem(cle(slug), JSON.stringify(byKey));
        } catch {
          // Stockage refuse : la memoire du module suffit pour la session.
        }
        setPages(byKey);
        setStatut('connu');
      })
      .catch(() => {
        if (!alive) return;
        // Cockpit injoignable : plutot les valeurs compilees qu'un rail vide.
        setStatut((s) => (s === 'connu' ? s : 'indisponible'));
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  return { pages, statut };
};
