import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

// Payment flow for the outstanding balance of the current workspace.
// Step 1: choose method (card via Revolut or SEPA transfer).
// Step 2 card:    show total + 3% fees, then hand off to Revolut checkout.
// Step 2 wire:    show copy-to-clipboard blocks (destinataire, IBAN, BIC,
// devise, référence) so the client can paste them into their bank UI.
// The "Retour" button on each step brings the client back one level.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const VioletColor = '#7e37fe';

const REVOLUT_CHECKOUT_URL =
  'https://checkout.revolut.com/pay/ce10ca1f-757f-419b-99b9-01a8579b98f3';
const CARD_FEE_RATE = 0.03;

const BUZZLE_BANK = {
  beneficiary: 'BUZZLE PARTNERS LLP',
  currency: 'EUR',
  iban: 'GB25 REVO 0099 6997 5441 68',
  bic: 'REVOGB21',
};

const MY_WORKSPACE_INVOICES = gql`
  query PayInvoicesUnpaid {
    myWorkspaceInvoices {
      id
      number
      date
      dueDate
      total
      balance
      currency
      status
    }
  }
`;

type Invoice = {
  id: string;
  number: string;
  date: string;
  dueDate?: string | null;
  total: number;
  balance: number;
  currency: string;
  status: string;
};

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 28px 40px 48px;
  color: ${InkColor};
  overflow-y: auto;
  > * {
    max-width: 1320px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
`;

const HeaderText = styled.div`
  display: flex;
  align-items: center;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid ${InkColor};
  background: ${SurfaceColor};
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
  }
`;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: ${InkColor};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const VioletCard = styled.div`
  background: ${VioletColor};
  color: #ffffff;
  border-radius: 18px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const VioletLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
`;

const VioletValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.024em;
  line-height: 1.05;
`;

const VioletSub = styled.div`
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  margin-top: 4px;
`;

const DarkCard = styled.div`
  background: ${InkColor};
  color: ${SurfaceColor};
  border-radius: 18px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DarkLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
`;

const DarkValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const DarkSub = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const SectionTitle = styled.h2`
  font-family: 'Inter Tight', sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: ${InkColor};
  margin: 0 0 14px;
`;

const MethodsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const MethodCard = styled.button`
  text-align: left;
  background: ${SurfaceColor};
  border: 1px solid rgba(20, 20, 28, 0.12);
  border-radius: 16px;
  padding: 22px 22px 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.12s, transform 0.12s, box-shadow 0.12s;
  &:hover {
    border-color: ${InkColor};
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(20, 20, 28, 0.08);
  }
`;

const MethodIcon = styled.span`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(126, 55, 254, 0.14);
  color: ${VioletColor};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const MethodTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: ${InkColor};
`;

const MethodMeta = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const MethodDetail = styled.div`
  color: ${MutedColor};
  font-size: 13px;
  line-height: 1.55;
`;

const MethodAmount = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  color: ${InkColor};
`;

const MethodCta = styled.span`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: ${InkColor};
`;

const CopyGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CopyRow = styled.div`
  background: ${SurfaceColor};
  border: 1px solid rgba(20, 20, 28, 0.12);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CopyMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
`;

const CopyLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const CopyValue = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 14.5px;
  color: ${InkColor};
  word-break: break-all;
`;

const CopyButton = styled.button<{ copied?: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${({ copied }) => (copied ? '#187a4a' : InkColor)};
  background: ${({ copied }) => (copied ? '#187a4a' : SurfaceColor)};
  color: ${({ copied }) => (copied ? SurfaceColor : InkColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex: 0 0 auto;
  &:hover {
    background: ${({ copied }) => (copied ? '#187a4a' : InkColor)};
    color: ${SurfaceColor};
  }
`;

const NoticeBox = styled.div`
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(126, 55, 254, 0.08);
  border: 1px solid rgba(126, 55, 254, 0.24);
  color: ${InkColor};
  font-size: 13px;
  line-height: 1.55;
`;

const FooterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
`;

const FooterFiller = styled.div`
  flex: 0 0 auto;
`;

const CtaPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 999px;
  background: ${InkColor};
  color: ${SurfaceColor};
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  border: 0;
  &:hover {
    opacity: 0.88;
  }
`;

const IconArrowLeft = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCard = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const IconBank = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 10 12 4l9 6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="5" y1="10" x2="5" y2="18" />
    <line x1="9" y1="10" x2="9" y2="18" />
    <line x1="15" y1="10" x2="15" y2="18" />
    <line x1="19" y1="10" x2="19" y2="18" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const LoaderStage = styled.div`
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
`;

const Loader = styled.div`
  --dim: 3rem;
  width: var(--dim);
  height: var(--dim);
  position: relative;
  animation: buzzlePayLoaderSpin 2s linear infinite;

  .circle {
    --dim: 1.2rem;
    width: var(--dim);
    height: var(--dim);
    background-color: ${InkColor};
    border-radius: 50%;
    position: absolute;
  }
  .circle:nth-child(1) { top: 0; left: 0; }
  .circle:nth-child(2) { top: 0; right: 0; }
  .circle:nth-child(3) { bottom: 0; left: 0; }
  .circle:nth-child(4) { bottom: 0; right: 0; }

  @keyframes buzzlePayLoaderSpin {
    0% { transform: scale(1) rotate(0); }
    20%, 25% { transform: scale(1.3) rotate(90deg); }
    45%, 50% { transform: scale(1) rotate(180deg); }
    70%, 75% { transform: scale(1.3) rotate(270deg); }
    95%, 100% { transform: scale(1) rotate(360deg); }
  }
`;

const formatCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

type Step = 'method' | 'card' | 'transfer';

type CopyBlockRow = { label: string; value: string; hint?: string };

const CopyBlock = ({ label, value, hint }: CopyBlockRow) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked; user falls back to manual copy
    }
  };

  return (
    <CopyRow>
      <CopyMeta>
        <CopyLabel>{label}</CopyLabel>
        <CopyValue>{value}</CopyValue>
        {hint && (
          <div style={{ color: MutedColor, fontSize: 12 }}>{hint}</div>
        )}
      </CopyMeta>
      <CopyButton
        copied={copied}
        onClick={handleCopy}
        aria-label={`Copier ${label}`}
      >
        {copied ? 'Copié' : 'Copier'}
      </CopyButton>
    </CopyRow>
  );
};

export const BuzzleInvoicePayPage = () => {
  const navigate = useNavigate();
  const apolloCoreClient = useApolloCoreClient();
  const [step, setStep] = useState<Step>('method');

  const { data, loading } = useQuery<{ myWorkspaceInvoices: Invoice[] }>(
    MY_WORKSPACE_INVOICES,
    { client: apolloCoreClient, fetchPolicy: 'cache-and-network' },
  );

  const invoices = data?.myWorkspaceInvoices ?? [];

  const unpaidInvoices = useMemo(
    () =>
      invoices.filter((i) => i.status !== 'paid' && i.status !== 'void'),
    [invoices],
  );

  const pendingBalance = useMemo(
    () => unpaidInvoices.reduce((s, i) => s + i.balance, 0),
    [unpaidInvoices],
  );

  const currency = unpaidInvoices[0]?.currency ?? invoices[0]?.currency ?? 'EUR';

  const cardTotal = pendingBalance * (1 + CARD_FEE_RATE);
  const cardFee = pendingBalance * CARD_FEE_RATE;

  const invoiceReference = unpaidInvoices
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((i) => i.number)
    .join(' / ');

  // First-load loader while the Zoho fetch is in flight.
  if (loading && !data) {
    return (
      <Container>
        <LoaderStage>
          <Loader>
            <span className="circle" />
            <span className="circle" />
            <span className="circle" />
            <span className="circle" />
          </Loader>
        </LoaderStage>
      </Container>
    );
  }

  // No outstanding balance: bounce back to the invoices index. Keeps the
  // pay page from being reachable by anyone who lands on the URL with no
  // balance to settle.
  if (!loading && unpaidInvoices.length === 0) {
    return (
      <Container>
        <HeaderRow>
          <HeaderText>
            <PageTitle>Aucun solde à régler</PageTitle>
          </HeaderText>
          <HeaderActions>
            <BuzzleWorkspacesButton />
          </HeaderActions>
        </HeaderRow>
        <NoticeBox>
          Toutes vos factures sont à jour. Rien à régler pour le moment.
        </NoticeBox>
        <FooterBar>
          <BackButton onClick={() => navigate('/invoices')}>
            <IconArrowLeft /> Retour aux factures
          </BackButton>
          <FooterFiller />
        </FooterBar>
      </Container>
    );
  }

  const goBack = () => {
    if (step === 'method') {
      navigate('/invoices');
      return;
    }
    setStep('method');
  };

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Effectuer un règlement</PageTitle>
        </HeaderText>
        <HeaderActions>
          <BuzzleWorkspacesButton />
        </HeaderActions>
      </HeaderRow>

      <Grid>
        <VioletCard>
          <VioletLabel>Solde à régler</VioletLabel>
          <VioletValue>{formatCurrency(pendingBalance, currency)}</VioletValue>
          <VioletSub>
            {unpaidInvoices.length} facture
            {unpaidInvoices.length > 1 ? 's' : ''} en attente
          </VioletSub>
        </VioletCard>
        <DarkCard>
          <DarkLabel>Références</DarkLabel>
          <DarkValue>{invoiceReference}</DarkValue>
          <DarkSub>
            Numéro
            {unpaidInvoices.length > 1 ? 's' : ''} de facture à indiquer en cas
            de virement.
          </DarkSub>
        </DarkCard>
      </Grid>

      {step === 'method' && (
        <>
          <SectionTitle>Choisissez votre méthode</SectionTitle>
          <MethodsGrid>
            <MethodCard type="button" onClick={() => setStep('card')}>
              <MethodIcon>
                <IconCard />
              </MethodIcon>
              <div>
                <MethodTitle>Paiement par carte bancaire</MethodTitle>
                <MethodMeta>3 % de frais</MethodMeta>
              </div>
              <MethodAmount>{formatCurrency(cardTotal, currency)}</MethodAmount>
              <MethodDetail>
                Paiement instantané via Revolut. Redirection immédiate vers un
                checkout sécurisé.
              </MethodDetail>
              <MethodCta>
                Continuer <IconArrowRight />
              </MethodCta>
            </MethodCard>

            <MethodCard type="button" onClick={() => setStep('transfer')}>
              <MethodIcon>
                <IconBank />
              </MethodIcon>
              <div>
                <MethodTitle>Virement bancaire</MethodTitle>
                <MethodMeta>Gratuit</MethodMeta>
              </div>
              <MethodAmount>
                {formatCurrency(pendingBalance, currency)}
              </MethodAmount>
              <MethodDetail>
                Coordonnées SEPA prêtes à copier-coller. Réception sous 2 jours
                ouvrés.
              </MethodDetail>
              <MethodCta>
                Voir les coordonnées <IconArrowRight />
              </MethodCta>
            </MethodCard>
          </MethodsGrid>
        </>
      )}

      {step === 'card' && (
        <>
          <SectionTitle>Paiement par carte bancaire</SectionTitle>
          <CopyGrid>
            <CopyRow>
              <CopyMeta>
                <CopyLabel>Solde initial</CopyLabel>
                <CopyValue>
                  {formatCurrency(pendingBalance, currency)}
                </CopyValue>
              </CopyMeta>
            </CopyRow>
            <CopyRow>
              <CopyMeta>
                <CopyLabel>Frais de traitement</CopyLabel>
                <CopyValue>
                  + {formatCurrency(cardFee, currency)} (3 %)
                </CopyValue>
              </CopyMeta>
            </CopyRow>
            <CopyRow style={{ background: '#f5f2ea' }}>
              <CopyMeta>
                <CopyLabel>Total à payer</CopyLabel>
                <CopyValue style={{ fontSize: 20, fontWeight: 500 }}>
                  {formatCurrency(cardTotal, currency)}
                </CopyValue>
              </CopyMeta>
            </CopyRow>
          </CopyGrid>

          <NoticeBox>
            Vous serez redirigé vers Revolut Checkout dans une nouvelle
            fenêtre. Merci d'indiquer manuellement la référence {invoiceReference}{' '}
            dans le champ prévu à cet effet si Revolut le demande.
          </NoticeBox>
        </>
      )}

      {step === 'transfer' && (
        <>
          <SectionTitle>Coordonnées bancaires</SectionTitle>
          <CopyGrid>
            <CopyBlock
              label="Destinataire"
              value={BUZZLE_BANK.beneficiary}
            />
            <CopyBlock label="Devise acceptée" value={BUZZLE_BANK.currency} />
            <CopyBlock label="IBAN" value={BUZZLE_BANK.iban} />
            <CopyBlock label="BIC / SWIFT" value={BUZZLE_BANK.bic} />
            <CopyBlock
              label="Montant à virer"
              value={formatCurrency(pendingBalance, currency)}
            />
            <CopyBlock
              label="Référence (objet du virement)"
              value={invoiceReference}
              hint={
                unpaidInvoices.length > 1
                  ? 'À indiquer précisément pour rattacher le paiement à vos factures.'
                  : 'À indiquer précisément pour rattacher le paiement à votre facture.'
              }
            />
          </CopyGrid>

          <NoticeBox>
            Virement SEPA gratuit, réception sous 2 jours ouvrés en général.
            Aucun frais de notre côté. Une fois le virement effectué, le solde
            se mettra à jour automatiquement dans ce tableau de bord après
            réception côté banque.
          </NoticeBox>
        </>
      )}

      <FooterBar>
        <BackButton onClick={goBack}>
          <IconArrowLeft />{' '}
          {step === 'method' ? 'Retour aux factures' : 'Étape précédente'}
        </BackButton>
        {step === 'card' ? (
          <CtaPrimary
            href={REVOLUT_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Payer {formatCurrency(cardTotal, currency)} sur Revolut{' '}
            <IconArrowRight />
          </CtaPrimary>
        ) : (
          <FooterFiller />
        )}
      </FooterBar>
    </Container>
  );
};
