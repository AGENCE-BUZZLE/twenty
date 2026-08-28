import { useMemo } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle: mapping display-side des statuts de leads par workspace.
// Les valeurs internes restent stables (NEW, CONTACTED, QUOTED, WON, LOST,
// OFF_TOPIC) — celles enregistrées côté DB — pour garder OCT push Google
// Ads / stats cohérents. Ce qui varie par client :
//   - le libellé qui s'affiche dans la table Contacts / Appels
//   - l'ordre et la liste des statuts sélectionnables dans le dropdown
//   - la couleur associée
// Ajouter un nouveau client = 1 entrée dans WORKSPACE_STATUS_CONFIG.

export type StatusMeta = {
  label: string;
  bg: string;
  fg: string;
  dot: string;
};

const DEFAULT_STATUS_META: Record<string, StatusMeta> = {
  NEW: {
    label: 'Nouveau',
    bg: '#e3ecff',
    fg: '#1a3fb0',
    dot: '#3d5efc',
  },
  CONTACTED: {
    label: 'À rappeler',
    bg: '#fff1e3',
    fg: '#7a3c00',
    dot: '#e08a2b',
  },
  QUOTED: {
    label: 'Devis envoyé',
    bg: '#ede4ff',
    fg: '#4a2fb8',
    dot: '#12b76a',
  },
  WON: {
    label: 'Signé',
    bg: '#e0f3e5',
    fg: '#136d34',
    dot: '#187a4a',
  },
  LOST: {
    label: 'Perdu',
    bg: '#efede6',
    fg: '#57574f',
    dot: '#8a8b91',
  },
  CANCELLED: {
    label: 'Annulé',
    bg: '#efede6',
    fg: '#57574f',
    dot: '#8a8b91',
  },
  OFF_TOPIC: {
    label: 'Hors sujet',
    bg: '#fbe5e5',
    fg: '#8a1a1a',
    dot: '#dc2626',
  },
};

const DEFAULT_ORDER = [
  'NEW',
  'CONTACTED',
  'QUOTED',
  'WON',
  'LOST',
  'CANCELLED',
  'OFF_TOPIC',
];

type WorkspaceStatusConfig = {
  order: string[];
  overrides?: Partial<Record<string, Partial<StatusMeta>>>;
};

// Clé : subdomain du workspace
const WORKSPACE_STATUS_CONFIG: Record<string, WorkspaceStatusConfig> = {
  'galaxy-glass': {
    // Ordre du dropdown : Nouveau → En cours → Effectué → Annulé (gestion
    // interne, ne touche pas les conversions Google Ads déjà comptées) →
    // Hors sujet (rétracte la conversion Nouveau lead côté OCT).
    order: ['NEW', 'QUOTED', 'WON', 'CANCELLED', 'OFF_TOPIC'],
    overrides: {
      QUOTED: { label: 'En cours' },
      WON: { label: 'Effectué' },
    },
  },
};

export const useBuzzleStatusConfig = () => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const subdomain = currentWorkspace?.subdomain ?? '';

  return useMemo(() => {
    const config = WORKSPACE_STATUS_CONFIG[subdomain] ?? { order: DEFAULT_ORDER };
    const meta: Record<string, StatusMeta> = {};
    for (const [key, base] of Object.entries(DEFAULT_STATUS_META)) {
      meta[key] = { ...base, ...(config.overrides?.[key] ?? {}) };
    }
    // Fallback pour tout statut renvoyé par la DB qui n'est pas dans nos
    // constantes (ne devrait pas arriver, mais on évite d'afficher vide).
    const getMeta = (status: string): StatusMeta =>
      meta[status] ?? {
        label: status,
        bg: '#efede6',
        fg: '#57574f',
        dot: '#8a8b91',
      };

    return {
      order: config.order,
      meta,
      getMeta,
    };
  }, [subdomain]);
};
