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
