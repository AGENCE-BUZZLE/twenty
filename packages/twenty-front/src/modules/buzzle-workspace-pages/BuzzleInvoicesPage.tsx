import { BuzzleComingSoonPage } from '@/buzzle-workspace-pages/BuzzleComingSoonPage';

const IconReceipt = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4v18l3-2 3 2 3-2 3 2 3-2 1 2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

export const BuzzleInvoicesPage = () => (
  <BuzzleComingSoonPage
    eyebrow="Espace . Factures"
    title="Factures"
    lede="Retrouvez ici l'historique des factures emises pour vos clients et le detail de vos abonnements Buzzle."
    Icon={IconReceipt}
    cardTitle="A venir"
    cardSubtitle="Cette section arrive dans une prochaine mise a jour."
  />
);
