import { BuzzleComingSoonPage } from '@/buzzle-workspace-pages/BuzzleComingSoonPage';

const IconChart = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export const BuzzleReportsPage = () => (
  <BuzzleComingSoonPage
    eyebrow="Espace . Rapports"
    title="Rapports de performance"
    lede="Un tableau de bord centralise les conversions poussees a Google Ads et Meta ainsi que la performance de vos campagnes."
    Icon={IconChart}
    cardTitle="A venir"
    cardSubtitle="Cette section arrive dans une prochaine mise a jour."
  />
);
