import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { IconBell } from 'twenty-ui/icon';

import { BuzzleFloatingSidebar } from '@/buzzle-workspace-nav/BuzzleFloatingSidebar';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';

// Buzzle: Galaxy Glass SEO/GEO audit · rendered inside the CRM instead
// of a separate password-gated report. The CRM auth already gates
// access so the audit page is a plain workspace route. Content is
// hardcoded from the audit performed on galaxyglass-parebrise.fr on
// 2026-07-29 (data files under scratchpad/gg_audit_findings.md).

const InkColor = '#14141c';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const HairlineColor = 'rgba(20, 20, 28, 0.08)';

// ---------- Shell (mirrors BuzzleOverviewPage shell) ----------

const ShellGrid = styled.div`
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  height: 100dvh;
  display: grid;
  grid-template-columns: 76px 1fr;
  grid-template-rows: auto 1fr;
  column-gap: 16px;
  row-gap: 14px;
  padding: 20px;
  align-items: stretch;
  overflow: hidden;
  color: ${InkColor};
  box-sizing: border-box;

  @media (max-width: 768px) {
    height: auto;
    min-height: 100dvh;
    overflow-y: auto;
  }
`;

const LogoBlock = styled.div`
  grid-column: 1;
  grid-row: 1;
  height: 64px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  width: max-content;
  z-index: 3;
`;

const LogoImg = styled.img`
  height: 44px;
  width: auto;
  display: block;

  @media (max-width: 768px) {
    height: 34px;
  }
`;

const Actions = styled.div`
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 64px;
  z-index: 2;

  > button,
  > div > button {
    height: 40px !important;
  }
  > button:hover,
  > div > button:hover {
    background: #ffffff !important;
  }
`;

const NotifChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid #14141c;
  background: #ffffff;
  color: #14141c;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
`;

const WorkspaceWrap = styled.div`
  --t-gray-scale-gray3: #ffffff;
  --t-color-gray3: #ffffff;
  --t-gray-scale-gray2: #f6f6fb;
  --t-color-gray2: #f6f6fb;
  --t-font-color-primary: #14141c;
  --t-font-color-secondary: rgba(20, 20, 28, 0.72);
  --t-background-primary: #ffffff;
  --t-background-secondary: #f6f6fb;
  --t-background-transparent-light: rgba(20, 20, 28, 0.04);
  --t-background-transparent-medium: rgba(20, 20, 28, 0.08);
  --t-border-color-light: rgba(20, 20, 28, 0.08);
  --t-border-color-medium: rgba(20, 20, 28, 0.14);
`;

const Stage = styled.main`
  grid-column: 2;
  grid-row: 2;
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  border-radius: 28px;
  padding: 26px 30px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  color: ${InkColor};

  @media (max-width: 768px) {
    overflow-y: visible;
  }
`;

// ---------- Audit content ----------

const StageHead = styled.header`
  padding: 0 2px 24px 2px;
  border-bottom: 1px solid ${HairlineColor};
  margin-bottom: 24px;
`;

const AuditKicker = styled.div`
  font-family: 'JetBrains Mono', 'Inter', monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 8px;
`;

const AuditTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: ${InkColor};
`;

const AuditSub = styled.p`
  font-size: 14px;
  color: ${MutedColor};
  margin: 8px 0 0 0;
  line-height: 1.55;
  max-width: 640px;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 32px;
  margin-bottom: 32px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ScoreGauge = styled.div`
  position: relative;
  width: 220px;
  height: 220px;
  display: grid;
  place-items: center;
`;

const ScoreValue = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${InkColor};
  line-height: 1;
`;

const ScoreOutOf = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: ${MutedColor};
  margin-top: 4px;
`;

const HighlightList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HighlightItem = styled.li`
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 14px;
  align-items: flex-start;
`;

const HighlightIcon = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;

  &[data-tone='good'] {
    background: rgba(22, 163, 74, 0.14);
    color: #16a34a;
  }
  &[data-tone='warn'] {
    background: rgba(245, 158, 11, 0.14);
    color: #b45309;
  }
  &[data-tone='bad'] {
    background: rgba(220, 38, 38, 0.14);
    color: #dc2626;
  }
`;

const HighlightBody = styled.div`
  font-size: 14px;
  color: ${InkColor};
  line-height: 1.5;
  strong {
    font-weight: 600;
  }
`;

const HighlightMeta = styled.div`
  font-size: 12.5px;
  color: ${MutedColor};
  margin-top: 4px;
`;

const SectionCard = styled.section`
  border: 1px solid ${HairlineColor};
  border-radius: 18px;
  padding: 22px 24px;
  margin-bottom: 16px;
  background: #ffffff;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: ${InkColor};
`;

const SeverityChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', 'Inter', monospace;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid;

  &[data-sev='severe'] {
    color: #dc2626;
    background: rgba(220, 38, 38, 0.08);
    border-color: rgba(220, 38, 38, 0.3);
  }
  &[data-sev='fix'] {
    color: #b45309;
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
  }
  &[data-sev='recommended'] {
    color: #a16207;
    background: rgba(234, 179, 8, 0.1);
    border-color: rgba(234, 179, 8, 0.3);
  }
  &[data-sev='ok'] {
    color: #16a34a;
    background: rgba(22, 163, 74, 0.08);
    border-color: rgba(22, 163, 74, 0.3);
  }
  &[data-sev='info'] {
    color: #1a73e8;
    background: rgba(26, 115, 232, 0.08);
    border-color: rgba(26, 115, 232, 0.3);
  }
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Issue = styled.details`
  border: 1px solid ${HairlineColor};
  border-radius: 12px;
  overflow: hidden;
  background: #fafaf7;
  &[open] {
    background: #ffffff;
  }
`;

const IssueSummary = styled.summary`
  padding: 12px 16px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: ${InkColor};
  display: flex;
  align-items: center;
  gap: 10px;
  list-style: none;
  &::-webkit-details-marker {
    display: none;
  }
  &::before {
    content: '›';
    display: inline-block;
    font-size: 18px;
    color: ${MutedColor};
    transition: transform 140ms ease;
    line-height: 1;
    ${Issue}[open] & {
      transform: rotate(90deg);
    }
  }
`;

const IssueBody = styled.div`
  padding: 4px 16px 16px 36px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: rgba(20, 20, 28, 0.75);
  line-height: 1.55;
  display: flex;
  flex-direction: column;
  gap: 10px;
  strong {
    color: ${InkColor};
    font-weight: 600;
  }
`;

const ActionPlanCard = styled.section`
  border: 1px solid ${HairlineColor};
  border-radius: 18px;
  padding: 24px 28px 28px;
  background: linear-gradient(160deg, #7e37fe 0%, #5b25c7 100%);
  color: #ffffff;
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    right: -60px;
    top: -60px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const ActionTitle = styled.h2`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
  color: #ffffff;
`;

const ActionSub = styled.p`
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 20px 0;
`;

const ActionSteps = styled.ol`
  list-style: none;
  counter-reset: step;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const ActionStep = styled.li`
  counter-increment: step;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 14px;
  align-items: center;
  color: #ffffff;
  font-size: 13.5px;

  &::before {
    content: counter(step);
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffffff;
    color: #5b25c7;
    font-family: 'Inter Tight', 'Inter', sans-serif;
    font-weight: 700;
    font-size: 14px;
  }
`;

const ActionTag = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.16);
`;

// ---------- Score gauge SVG ----------

const OVERALL_SCORE = 68;

const AuditScoreGauge = ({ value }: { value: number }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const color =
    value >= 80 ? '#16a34a' : value >= 60 ? '#b45309' : '#dc2626';
  return (
    <ScoreGauge>
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        style={{ position: 'absolute', inset: 0 }}
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(20, 20, 28, 0.08)"
          strokeWidth="14"
        />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 110 110)"
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <ScoreValue>{value}</ScoreValue>
        <ScoreOutOf>score global · sur 100</ScoreOutOf>
      </div>
    </ScoreGauge>
  );
};

// ---------- Page ----------

type Finding = {
  title: string;
  detail: string;
  fix?: string;
};

type Section = {
  key: string;
  title: string;
  severity: 'severe' | 'fix' | 'recommended' | 'ok' | 'info';
  chipLabel: string;
  findings: Finding[];
};

const SECTIONS: Section[] = [
  {
    key: 'technical',
    title: 'Technique & Performance',
    severity: 'ok',
    chipLabel: 'OK',
    findings: [
      {
        title: 'PageSpeed mobile 95 · desktop 98 (Lighthouse)',
        detail:
          "LCP mobile 2,5 s · desktop 1,1 s. TBT 0 ms sur les deux. CLS 0. Aucun rendering-blocking critique. Ces scores placent Galaxy Glass dans le top 10 % des sites du secteur pare-brise en France.",
      },
      {
        title: 'HTTPS + robots.txt cohérents',
        detail:
          "robots.txt WordPress standard : bloque /wp-admin/ (sauf admin-ajax.php) et référence le sitemap. Rien à changer.",
      },
      {
        title: 'Sitemap XML structuré (9 sous-sitemaps)',
        detail:
          "wp-sitemap.xml présent, splits par type de contenu (pages, posts, catégories). Bien découvert par Googlebot.",
      },
    ],
  },
  {
    key: 'content-blog',
    title: 'Blog & contenu éditorial',
    severity: 'severe',
    chipLabel: 'Sévère',
    findings: [
      {
        title: '5 articles de blog "template" WordPress non nettoyés',
        detail:
          "Le sitemap /wp-sitemap-posts-post-1.xml expose 5 articles sans lien avec le pare-brise : hello-world, remote-tech-assistance, common-laptop-problems, securing-home-network, tech-in-top-shape.",
        fix: "Supprimer les 5 articles depuis WP → Articles → Corbeille (attention : ils sont indexables et présents dans le sitemap). Recommandation forte : les remplacer par 4-6 articles utiles au SEO local pare-brise (ex : Comment déclarer un bris de glace à son assurance, Différence entre réparation et remplacement d'impact, Franchise bris de glace 2026, Combien de temps prend un remplacement à domicile).",
      },
      {
        title: 'Aucune stratégie de contenu de longue traîne visible',
        detail:
          "Les pages centres (Aix, Marseille) sont courtes. Aucun article ne cible les requêtes informationnelles longue traîne (ex : \"délai remplacement pare-brise assurance MAAF\", \"reprise franchise 2026\").",
        fix: "Planifier un cluster de contenu autour de 3 hubs : Bris de glace & assurance / Remplacement à domicile / Nos centres. 2 articles par hub sur 3 mois, ancrés sur des questions posées par les leads.",
      },
    ],
  },
  {
    key: 'onpage',
    title: 'On-page & structured data',
    severity: 'severe',
    chipLabel: 'Sévère',
    findings: [
      {
        title: 'Aucun JSON-LD (LocalBusiness, Service, FAQPage manquants)',
        detail:
          "Google et les IA génératives (ChatGPT, Perplexity, AI Overviews) s'appuient massivement sur les données structurées pour comprendre un site. Absence complète chez Galaxy Glass.",
        fix: "Ajouter 3 blocs JSON-LD : (1) LocalBusiness sur la homepage avec adresse, téléphone, horaires, note agrégée. (2) Service pour chaque page /remplacer-* avec areaServed. (3) FAQPage sur la homepage pour les 12 questions déjà accordéonnables.",
      },
      {
        title: 'Meta description absente sur la homepage',
        detail:
          "Google va générer une description automatique qui ne met pas en avant les 400 € de bonus ni le rappel en 2 minutes.",
        fix: "Rédiger 150-160 caractères : 'Remplacement pare-brise à domicile partout en France sous 24-48h. Jusqu'à 400 € cash offerts, franchise prise en charge. Rappel garanti en 2 min.'",
      },
      {
        title: 'Aucune balise canonical ni Open Graph / Twitter Card',
        detail:
          "Partages sur WhatsApp / Facebook / SMS : aucun aperçu enrichi. Risque de contenu dupliqué non signalé aux moteurs (page /aix-en-provence/ vs /marseille/ qui se ressemblent).",
        fix: "Générer les OG tags (og:title, og:description, og:image 1200×630, og:type=website) via un plugin (Yoast SEO ou Rank Math) + canonical auto sur chaque URL.",
      },
    ],
  },
  {
    key: 'gbp',
    title: 'Google Business Profile & SEO local',
    severity: 'fix',
    chipLabel: 'À corriger',
    findings: [
      {
        title: 'GBP Aix-en-Provence excellent · 5,0 sur 51 avis',
        detail:
          "Fiche 'Pare-brise - Galaxy Glass Aix en Provence' au 1175 montée d'Avignon. 10 photos, statut Opérationnel, site déclaré = page /aix-en-provence/. Base solide pour continuer à collecter des avis.",
      },
      {
        title: 'GBP Marseille inexistant sous le nom Galaxy Glass',
        detail:
          "Le site expose une page /marseille/ dédiée mais aucune fiche Google Business Profile n'est trouvable au nom Galaxy Glass Marseille. Le seul acteur pertinent à Marseille est un concurrent (Marseille Pare-brise, 5,0/108 avis, avenue de Montolivet).",
        fix: "Créer une fiche GBP dédiée Marseille (SAB · Service-Area Business si pas de local physique client) : nom identique au format Aix, même téléphone, zone Marseille + communes environnantes. Compter 3-4 semaines de validation Google. Sans cette fiche, la page /marseille/ ne rankera jamais localement.",
      },
      {
        title: 'Nombre de photos GBP faible (10) vs concurrence',
        detail:
          "Marseille Pare-brise concurrent atteint plusieurs dizaines de photos. Sur Google Maps, le poids visuel est un signal fort de ranking local.",
        fix: "Uploader 15-20 photos supplémentaires : équipe, camion siglé, avant/après intervention à domicile, dessins schémas de garantie, certification technique.",
      },
    ],
  },
  {
    key: 'authority',
    title: 'Autorité & confiance (E-E-A-T)',
    severity: 'recommended',
    chipLabel: 'Recommandé',
    findings: [
      {
        title: 'Widget Trustindex présent sur la homepage',
        detail:
          "Bon signal E-E-A-T. Les avis externes sont visibles au-dessus de la ligne de flottaison.",
      },
      {
        title: 'Aucun lien vers réseaux sociaux détecté',
        detail:
          "Facebook, Instagram, Google My Business : aucune icône dans le header/footer. Le lien vers la fiche GBP Aix devrait notamment apparaître.",
        fix: "Ajouter dans le footer : lien Google Maps (fiche Aix), Facebook si créée, Instagram si créée. Créer les comptes manquants et poster 1× par semaine (avant/après, avis clients, offres).",
      },
      {
        title: "Aucune mention du dirigeant ni schéma auteur",
        detail:
          "M. Bouchikhi Tani Arezki est identifié dans llms.txt mais absent du site public. Or Google associe fortement le E-E-A-T (Expertise, Experience, Authoritativeness, Trust) à des personnes physiques identifiables.",
        fix: "Créer une page 'Qui sommes-nous' avec photo, parcours du dirigeant, années d'expérience métier, certifications (agréé assurance, formation professionnelle du vitrage automobile).",
      },
    ],
  },
  {
    key: 'geo',
    title: 'Visibilité IA / GEO',
    severity: 'recommended',
    chipLabel: 'Recommandé',
    findings: [
      {
        title: 'llms.txt présent avec informations business à jour',
        detail:
          "Fichier /llms.txt sert un résumé structuré à jour : services, adresse, SIREN 929 943 892, dirigeant. Bon signal pour ChatGPT, Perplexity, Claude, Gemini.",
      },
      {
        title: 'Le llms.txt actuel note lui-même les blog posts comme "unrelated"',
        detail:
          "Le fichier envoie un signal contradictoire aux LLMs : 'general blog posts on tech topics that appear unrelated to the core business'.",
        fix: "Une fois les 5 articles template supprimés, réécrire ce paragraphe dans llms.txt pour mentionner les vrais contenus pare-brise.",
      },
      {
        title: 'Aucun schéma FAQPage exposé aux LLMs',
        detail:
          "Les 12 Q/R du bloc FAQ homepage sont uniquement du HTML. ChatGPT / Perplexity ratent une occasion de citer Galaxy Glass en réponse à des requêtes comme 'combien coûte un remplacement de pare-brise'.",
        fix: "Ajouter FAQPage JSON-LD reprenant les 12 questions/réponses (à faire en même temps que le point On-page/JSON-LD ci-dessus).",
      },
    ],
  },
  {
    key: 'positioning',
    title: "Stratégie & positionnement",
    severity: 'ok',
    chipLabel: 'OK',
    findings: [
      {
        title: 'Proposition de valeur claire et différenciante',
        detail:
          "Bonus de reprise 400 €, franchise offerte, rappel garanti 2 min, RDV sous 24-48 h à domicile. Ce positionnement 'à domicile + cash offert' est unique face à Carglass / Speed Glass / Point S.",
      },
      {
        title: 'Ciblage géographique cohérent avec la campagne Ads',
        detail:
          "Aix-en-Provence + Marseille (les deux zones cibles principales) sont exposées via des pages dédiées + reflétées dans le naming des GBP.",
      },
    ],
  },
];

const HIGHLIGHTS = [
  {
    tone: 'good',
    label: '95',
    body: (
      <>
        <strong>PageSpeed mobile 95/100</strong> · LCP 2,5 s, TBT 0 ms, CLS 0.
        Excellent socle technique.
      </>
    ),
    meta: 'Aucune action requise côté performance.',
  },
  {
    tone: 'bad',
    label: '5',
    body: (
      <>
        <strong>5 articles de blog "template" WordPress</strong> non nettoyés
        (hello-world, tech topics random) qui polluent le sitemap.
      </>
    ),
    meta: 'Impact SEO thématique + crédibilité · à traiter en priorité #1.',
  },
  {
    tone: 'bad',
    label: '0',
    body: (
      <>
        <strong>Zéro donnée structurée (JSON-LD)</strong> sur le site :
        LocalBusiness, Service et FAQPage tous manquants. Les IA génératives ne
        voient pas Galaxy Glass.
      </>
    ),
    meta: "Impact fort sur AI Overviews, Perplexity, ChatGPT.",
  },
  {
    tone: 'warn',
    label: '★',
    body: (
      <>
        <strong>GBP Aix 5,0/51 avis</strong> : excellent · <strong>mais aucun
        GBP Marseille</strong> alors que la page /marseille/ est publiée.
      </>
    ),
    meta: 'Sans fiche dédiée, la page Marseille ne rankera pas.',
  },
] as const;

const ACTION_PLAN = [
  {
    label: 'Semaine 1',
    text: 'Supprimer les 5 articles de blog template WordPress + réécrire la meta description homepage.',
  },
  {
    label: 'Semaine 2',
    text: 'Ajouter les JSON-LD LocalBusiness + Service + FAQPage via Yoast SEO ou Rank Math.',
  },
  {
    label: 'Semaine 3',
    text: 'Créer la fiche Google Business Profile Marseille (SAB, zone Marseille + communes).',
  },
  {
    label: 'Semaine 4',
    text: 'Ajouter Open Graph tags + canonical URLs + 15 photos supplémentaires sur GBP Aix.',
  },
  {
    label: 'Mois 2',
    text: '3 articles de blog thématiques pare-brise (bris de glace assurance, franchise 2026, à domicile vs atelier).',
  },
  {
    label: 'Mois 3',
    text: 'Créer page "Qui sommes-nous" avec dirigeant + certifications pour E-E-A-T.',
  },
];

export const BuzzleAuditGalaxyGlassPage = () => {
  const navigate = useNavigate();

  return (
    <ShellGrid>
      <LogoBlock aria-label="Buzzle CRM">
        <LogoImg src="/images/buzzle-crm-white.png" alt="Buzzle CRM" />
      </LogoBlock>
      <Actions>
        <NotifChip
          type="button"
          aria-label="Notifications"
          onClick={() => navigate('/overview')}
        >
          <IconBell size={16} />
          <span>Notifications</span>
        </NotifChip>
        <WorkspaceWrap>
          <BuzzleWorkspacesButton hideOnMobile variant="pill" />
        </WorkspaceWrap>
      </Actions>
      <BuzzleFloatingSidebar />
      <Stage>
        <StageHead>
          <AuditKicker>Audit SEO/GEO · 29 juillet 2026</AuditKicker>
          <AuditTitle>Galaxy Glass · galaxyglass-parebrise.fr</AuditTitle>
          <AuditSub>
            État complet de la visibilité SEO, GEO (visibilité IA) et Google
            Business Profile pour l'écosystème Galaxy Glass · pare-brise à
            domicile, Aix-en-Provence + Marseille + zones nationales.
          </AuditSub>
        </StageHead>

        <SummaryRow>
          <AuditScoreGauge value={OVERALL_SCORE} />
          <HighlightList>
            {HIGHLIGHTS.map((h, i) => (
              <HighlightItem key={i}>
                <HighlightIcon data-tone={h.tone}>{h.label}</HighlightIcon>
                <div>
                  <HighlightBody>{h.body}</HighlightBody>
                  <HighlightMeta>{h.meta}</HighlightMeta>
                </div>
              </HighlightItem>
            ))}
          </HighlightList>
        </SummaryRow>

        {SECTIONS.map((section) => (
          <SectionCard key={section.key}>
            <SectionHead>
              <SectionTitle>{section.title}</SectionTitle>
              <SeverityChip data-sev={section.severity}>
                {section.chipLabel}
              </SeverityChip>
            </SectionHead>
            <IssueList>
              {section.findings.map((f, i) => (
                <Issue key={i}>
                  <IssueSummary>{f.title}</IssueSummary>
                  <IssueBody>
                    <div>{f.detail}</div>
                    {f.fix && (
                      <div>
                        <strong>Recommandation : </strong>
                        {f.fix}
                      </div>
                    )}
                  </IssueBody>
                </Issue>
              ))}
            </IssueList>
          </SectionCard>
        ))}

        <ActionPlanCard>
          <ActionTitle>Plan d'action priorisé</ActionTitle>
          <ActionSub>
            Six actions concrètes séquencées sur 3 mois pour passer de 68 à 85
            de score global.
          </ActionSub>
          <ActionSteps>
            {ACTION_PLAN.map((step, i) => (
              <ActionStep key={i}>
                <span />
                <span>{step.text}</span>
                <ActionTag>{step.label}</ActionTag>
              </ActionStep>
            ))}
          </ActionSteps>
        </ActionPlanCard>
      </Stage>
    </ShellGrid>
  );
};
