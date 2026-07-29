import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { BuzzleFloatingHamburger } from '@/buzzle-workspace-nav/BuzzleFloatingHamburger';
import { BuzzleFloatingSidebar } from '@/buzzle-workspace-nav/BuzzleFloatingSidebar';
import { BuzzleOverviewShellHeader } from '@/buzzle-workspace-nav/BuzzleOverviewShellHeader';
import { BuzzleLeadDrawer, type BuzzleLeadDrawerField } from '@/buzzle-workspace-pages/BuzzleLeadDrawer';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { BuzzlePeriodPicker } from '@/buzzle-workspace-pages/BuzzlePeriodPicker';
import { useBuzzleStatusConfig } from '@/buzzle-workspace-config/useBuzzleStatusConfig';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Buzzle workspace overview.
// Two-column dashboard : a violet "Solde à régler" card on the left backed
// by the Zoho invoices query, and an Ink activity strip on the right with
// per-object counters (Contacts, Appels). Period filter and workflow menu
// live in the header.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';
const VioletColor = '#7e37fe';

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

const MY_WORKSPACE_INVOICES = gql`
  query DashboardInvoices {
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

const Container = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  padding: 28px 40px 32px;
  color: ${InkColor};
  background: #efede6;
  overflow-y: auto;
  > * {
    max-width: 1320px;
    margin-left: auto;
    margin-right: auto;
  }
  @media (max-width: 768px) {
    padding: 16px 12px 24px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 20px;
  @media (max-width: 768px) {
    align-items: center;
    gap: 12px;
  }
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: ${InkColor};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 22px;
    letter-spacing: -0.018em;
  }
`;

const HeaderSub = styled.div`
  color: ${MutedColor};
  font-size: 14px;
  line-height: 1.55;
  max-width: 640px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

// Wrap the workspace switcher so its dark-drawer CSS variables (inherited
// from the sidebar) don't leak Ink colors when we render it inside a light
// surface header. We reset the important drawer tokens back to the light
// palette locally.
const HeaderWorkspaceWrap = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border: 1px solid ${InkColor};
  border-radius: 999px;
  background: ${SurfaceColor};

  --t-background-primary: #ffffff;
  --t-background-secondary: #ffffff;
  --t-background-tertiary: #efede6;
  --t-background-transparent-light: rgba(20, 20, 28, 0.04);
  --t-background-transparent-medium: rgba(20, 20, 28, 0.06);
  --t-background-transparent-strong: rgba(20, 20, 28, 0.1);
  --t-gray-scale-gray2: #efede6;
  --t-color-gray2: #efede6;
  --t-gray-scale-gray3: #f5f2ea;
  --t-color-gray3: #f5f2ea;
  --t-font-color-primary: ${InkColor};
  --t-font-color-secondary: rgba(20, 20, 28, 0.72);
  --t-font-color-tertiary: rgba(20, 20, 28, 0.55);
  --t-font-color-light: rgba(20, 20, 28, 0.6);
  --t-font-color-extra-light: rgba(20, 20, 28, 0.42);
  --t-border-color-light: rgba(20, 20, 28, 0.08);
  --t-border-color-medium: rgba(20, 20, 28, 0.14);
  --t-border-color-strong: rgba(20, 20, 28, 0.2);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VioletCard = styled.div`
  background: ${VioletColor};
  color: #ffffff;
  border-radius: 18px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  height: 260px;
`;

const VioletHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
`;

const VioletEyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
`;

const VioletTrend = styled.span<{ tone: 'up' | 'down' | 'flat' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.16);
  color: ${({ tone }) =>
    tone === 'down' ? '#ffdada' : tone === 'up' ? '#e8ffe1' : '#ffffff'};
`;

const VioletStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
`;

const VioletStatValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
`;

const VioletStatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 6px;
`;

const VioletBalanceLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 6px;
`;

const VioletBalanceValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.024em;
  line-height: 1.05;
`;

const VioletBalanceSub = styled.div`
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const CtaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
`;

const CtaPrimary = styled.button`
  background: ${InkColor};
  color: ${SurfaceColor};
  border: 0;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  &:hover {
    opacity: 0.88;
  }
`;

const CtaSecondary = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: ${SurfaceColor};
  border: 1px solid rgba(255, 255, 255, 0.24);
  padding: 10px 16px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
`;

const DarkCard = styled.div`
  background: ${InkColor};
  color: ${SurfaceColor};
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 260px;
`;

const DarkCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const DarkCardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 18px;
  font-weight: 500;
`;

const DarkCardSub = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin-top: 4px;
`;

const GoToLink = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: ${SurfaceColor};
  padding: 8px 14px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
`;

const AssetCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  height: 100%;
`;

const AssetHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AssetIcon = styled.span<{ tint: string; color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ tint }) => tint};
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const AssetName = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 15px;
  font-weight: 500;
`;

const AssetType = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.55);
`;

const AssetValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const AssetSub = styled.div<{ tone?: 'up' | 'down' | 'flat' }>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: ${({ tone }) =>
    tone === 'down'
      ? '#ffb0b0'
      : tone === 'up'
        ? '#c6f1c1'
        : 'rgba(255,255,255,0.6)'};
`;

const DistributionRow = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
`;

const DistributionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const DistributionLabel = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 14px;
`;

const DistributionSub = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
`;

const DistributionBar = styled.div`
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  display: flex;
`;

const DistributionSeg = styled.div<{ pct: number; color: string }>`
  flex: 0 0 ${({ pct }) => `${pct}%`};
  background: ${({ color }) => color};
`;

const DistributionLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
`;

const LegendDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

// ---------- Bottom row: leads chart + recent leads list ----------

const LowerGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

// Chart + Activity cards match the validated V9 mockup exactly: white
// surface with 1px hairline border, generous radius, dark ink text,
// muted ink for meta/axis. Both cards share the same visual DNA so the
// split reads as a single pair.

const CardSurface = `
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  padding: 22px;
`;

const ChartCard = styled.div`
  ${CardSurface}
  position: relative;
  overflow: visible;
  height: 360px;
  display: flex;
  flex-direction: column;
  color: ${InkColor};
`;

const ChartCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const ChartCardTitle = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${InkColor};
`;

const ChartCardSub = styled.div`
  color: ${MutedColor};
  font-size: 12.5px;
  margin-top: 3px;
`;

const ChannelPills = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(20, 20, 28, 0.05);
  border-radius: 10px;
  padding: 3px;
`;

const ChannelPill = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  border: 0;
  background: ${({ active }) => (active ? '#ffffff' : 'transparent')};
  color: ${({ active }) => (active ? InkColor : MutedColor)};
  box-shadow: ${({ active }) =>
    active ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'};
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  &:hover:not(:disabled) {
    color: ${InkColor};
  }
`;

const ChartArea = styled.div`
  position: relative;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

const ChartTooltip = styled.div`
  position: absolute;
  padding: 10px 14px;
  border-radius: 12px;
  background: #14141c;
  color: #ffffff;
  pointer-events: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  min-width: 130px;
  z-index: 3;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
`;

const ChartTooltipLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
`;

const ChartTooltipValue = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 600;
  margin-top: 2px;
  color: #ffffff;
`;

const ChartTooltipTrend = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  margin-top: 4px;
`;

const LeadsCard = styled.div`
  ${CardSurface}
  display: flex;
  flex-direction: column;
  height: 360px;
  color: ${InkColor};
`;

const LeadsScroll = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(20, 20, 28, 0.12);
    border-radius: 999px;
  }
`;

const LeadsHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const LeadsHeadRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(20, 20, 28, 0.05);
  border-radius: 10px;
  padding: 3px;
`;

const LeadsFilter = styled.button<{ active?: boolean }>`
  background: ${({ active }) => (active ? '#ffffff' : 'transparent')};
  border: 0;
  color: ${({ active }) => (active ? InkColor : MutedColor)};
  padding: 6px 12px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: ${({ active }) =>
    active ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'};
  transition: color 0.12s, background 0.12s;
  &:hover:not(:disabled) {
    color: ${InkColor};
  }
`;

const LeadDayLabel = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(20, 20, 28, 0.4);
  text-transform: uppercase;
  padding: 14px 4px 8px;
  &:first-of-type {
    padding-top: 0;
  }
`;

const LeadRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 8px;
  border-radius: 12px;
  transition: background 140ms ease;
  &:hover {
    background: rgba(20, 20, 28, 0.03);
  }
`;

const LeadIcon = styled.span<{ tint: string; color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ tint }) => tint};
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
`;

const LeadName = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: ${InkColor};
`;

const LeadMeta = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: ${MutedColor};
  margin-top: 2px;
`;

const LeadRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const LeadTime = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: ${MutedColor};
`;

const LeadEyeButton = styled.button`
  background: transparent;
  border: 1px solid rgba(20, 20, 28, 0.12);
  color: ${InkColor};
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(20, 20, 28, 0.05);
  }
`;

const LeadsEmpty = styled.div`
  color: ${MutedColor};
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
`;

const SeeAllRow = styled.button`
  margin-top: 14px;
  background: transparent;
  border: 1px dashed rgba(20, 20, 28, 0.12);
  color: ${MutedColor};
  padding: 10px 14px;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  &:hover {
    color: ${InkColor};
    border-color: ${MutedColor};
  }
`;

const IconArrowUp = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 11 12 6 7 11" />
    <line x1="12" y1="18" x2="12" y2="6" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const formatEuro = (amount: number): string => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
};

const formatShortDate = (raw?: string | null): string => {
  if (!raw) return '';

  try {
    return new Date(raw).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

// 4-color gradient palette for lead avatars · same as the V9 mockup.
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7e37fe 0%, #4b1fb0 100%)', // violet
  'linear-gradient(135deg, #16a34a 0%, #065f46 100%)', // green
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // orange
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // blue
] as const;

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
};

const avatarGradient = (name: string): string =>
  AVATAR_GRADIENTS[hashName(name || '?') % AVATAR_GRADIENTS.length];

const avatarInitials = (name: string): string => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const monthLabel = (): string => {
  return new Date()
    .toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' })
    .toUpperCase();
};

// ---------- Ink shell layout (desktop only) ----------

// Full-viewport grid that hosts the floating pill sidebar (col 1), the
// logo + chips top-bar (row 1 spanning both cols by way of the header
// component), and the white Stage card (col 2, row 2). The Ink cells
// background is mounted by DefaultLayout when the /overview route is
// active.
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

const Stage = styled.main`
  grid-column: 2;
  grid-row: 2;
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 28px;
  padding: 26px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  color: ${InkColor};

  @media (max-width: 768px) {
    grid-column: 1;
    grid-row: 1;
    border-radius: 20px;
    padding: 18px 16px;
    overflow-y: visible;
  }
`;

const StageHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 2px 22px 2px;
  gap: 12px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StageTitle = styled.h2`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: ${InkColor};
`;

const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

// Tile uses CSS variables to switch its color palette when the accent
// data-attribute is set. Children (label, value, footer, badge) simply
// read from --tile-label / --tile-value / --tile-footer / --tile-badge-*
// so Linaria doesn't need to resolve any styled-component references.
const Tile = styled.div`
  --tile-label: ${MutedColor};
  --tile-value: ${InkColor};
  --tile-footer: ${MutedColor};
  --tile-badge-color: #16a34a;
  --tile-badge-bg: rgba(22, 163, 74, 0.08);
  --tile-badge-color-down: #dc2626;
  --tile-badge-bg-down: rgba(220, 38, 38, 0.08);

  border-radius: 22px;
  padding: 22px;
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 172px;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(20, 20, 28, 0.06);
  }

  &[data-accent='true'] {
    --tile-label: rgba(255, 255, 255, 0.72);
    --tile-value: #ffffff;
    --tile-footer: rgba(255, 255, 255, 0.78);
    --tile-badge-color: #ffffff;
    --tile-badge-bg: rgba(255, 255, 255, 0.16);
    --tile-badge-color-down: #ffffff;
    --tile-badge-bg-down: rgba(255, 255, 255, 0.16);

    background: linear-gradient(160deg, #7e37fe 0%, #5b25c7 100%);
    color: #ffffff;
    border: none;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  &[data-accent='true']::after {
    content: '';
    position: absolute;
    right: -40px;
    top: -40px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const TileLabel = styled.div`
  font-size: 13px;
  color: var(--tile-label);
  font-weight: 500;
`;

const TileValue = styled.div`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 14px 0 10px 0;
  color: var(--tile-value);
`;

const TileFooter = styled.div`
  font-size: 12.5px;
  color: var(--tile-footer);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const TileBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--tile-badge-color);
  background: var(--tile-badge-bg);
  &[data-tone='down'] {
    color: var(--tile-badge-color-down);
    background: var(--tile-badge-bg-down);
  }
`;

const SplitRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

// Light card variant used inside the Stage (chart + activity split).
// The existing dark Chart/Leads cards are dropped in as-is inside these
// wrappers so the charting code and lead list logic don't have to move.
const StageCardLight = styled.div`
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(20, 20, 28, 0.08);
  padding: 22px;
`;

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleOverviewPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const displayName = currentUser?.firstName ?? '';
  const workspaceName = currentWorkspace?.displayName ?? 'votre workspace';

  const { order: STATUS_ORDER, meta: STATUS_META } = useBuzzleStatusConfig();

  const apolloCoreClient = useApolloCoreClient();

  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const contactObject = findActiveObjectMetadataItemByNamePlural('contacts');

  const { records: contactRecords } = useFindManyRecords({
    objectNameSingular: 'contact',
    skip: !contactObject,
    limit: 200,
  });

  const { data: invoicesData } = useQuery<{ myWorkspaceInvoices: Invoice[] }>(
    MY_WORKSPACE_INVOICES,
    { client: apolloCoreClient, fetchPolicy: 'cache-and-network' },
  );
  const allInvoices = invoicesData?.myWorkspaceInvoices ?? [];
  const allContacts = contactRecords ?? [];

  // Calls placeholder: empty en attendant un vrai provider (Aircall /
  // Ringover / autre). Une fois wired, remplacer par la query GraphQL
  // correspondante.
  const MOCK_CALLS = useMemo<
    Array<{
      id: string;
      startedAt: string;
      contactName: string;
      phoneNumber: string;
    }>
  >(() => [], []);

  // Period filter · controls every derived value below (chart, list, cards,
  // solde, distribution, everything). "custom" is a start → end range.
  const [period, setPeriod] = useState<Period>('month');
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const weekAgoIso = () => {
    const d = new Date();

    d.setDate(d.getDate() - 6);

    return d.toISOString().slice(0, 10);
  };
  const [customStart, setCustomStart] = useState<string>(weekAgoIso);
  const [customEnd, setCustomEnd] = useState<string>(todayIso);

  const periodRange = useMemo(() => {
    const now = new Date();

    if (period === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: now.getTime() };
    }
    if (period === 'week') {
      // Semaine calendaire ISO : lundi 00:00:00 au dimanche 23:59:59.
      const dow = now.getDay();
      const daysFromMonday = (dow + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday.getTime(), end: sunday.getTime() };
    }
    if (period === 'month') {
      // Mois calendaire : 1er 00:00:00 au dernier jour 23:59:59.
      const first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const last = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return { start: first.getTime(), end: last.getTime() };
    }
    // custom = start / end range picked in the header
    const start = customStart ? new Date(customStart) : new Date();

    start.setHours(0, 0, 0, 0);
    const end = customEnd ? new Date(customEnd) : new Date();

    end.setHours(23, 59, 59, 999);

    // Guard against inverted range: swap if end is before start.
    if (end.getTime() < start.getTime()) {
      return { start: end.getTime(), end: start.getTime() };
    }

    return { start: start.getTime(), end: end.getTime() };
  }, [period, customStart, customEnd]);

  const inRange = (iso?: string | null): boolean => {
    if (!iso) return false;
    const ts = new Date(iso).getTime();

    if (Number.isNaN(ts)) return false;

    return ts >= periodRange.start && ts <= periodRange.end;
  };

  const invoices = useMemo(
    () => allInvoices.filter((i) => inRange(i.date)),
    [allInvoices, periodRange],
  );
  const contacts = useMemo(
    () =>
      allContacts.filter((c) =>
        inRange(typeof c.createdAt === 'string' ? c.createdAt : null),
      ),
    [allContacts, periodRange],
  );
  const calls = useMemo(
    () => MOCK_CALLS.filter((c) => inRange(c.startedAt)),
    [MOCK_CALLS, periodRange],
  );

  // Solde impayé et retards sont TOUJOURS calculés sur l'ensemble des
  // factures, jamais filtrés par période. Une facture ouverte reste
  // ouverte tant qu'elle n'est pas réglée, même si Clément regarde la
  // journée d'aujourd'hui.
  const unpaidInvoices = allInvoices.filter(
    (i) => i.status !== 'paid' && i.status !== 'void',
  );
  const pendingBalance = unpaidInvoices.reduce((s, i) => s + i.balance, 0);
  const overdueInvoices = unpaidInvoices.filter((i) => i.status === 'overdue');
  const lastOverdue = overdueInvoices
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const pendingCount = unpaidInvoices.length;

  const contactTotal = contacts.length;
  const contactByStatus = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const c of contacts) {
      const s = typeof c.status === 'string' ? c.status : 'NEW';
      buckets[s] = (buckets[s] ?? 0) + 1;
    }
    return buckets;
  }, [contacts]);
  const contactNewCount = contactByStatus.NEW ?? 0;
  const contactValidatedCount = contactByStatus.WON ?? 0;

  const MOCK_CALLS_TOTAL = calls.length;
  const MOCK_CALLS_QUALIFIED = 0;

  const totalContactsForBar = Math.max(1, contactTotal);
  const seg = (label: string, count: number, color: string) => ({
    label,
    count,
    pct: (count / totalContactsForBar) * 100,
    color,
  });
  // Distribution alignée sur l'ordre de la config statut du workspace ;
  // on n'affiche que les statuts effectivement utilisés côté client.
  const distribution = STATUS_ORDER.map((s) =>
    seg(STATUS_META[s]?.label ?? s, contactByStatus[s] ?? 0, STATUS_META[s]?.dot ?? MutedColor),
  );

  const overdueTrend = overdueInvoices.length > 0 ? 'down' : 'up';
  const overdueSummary =
    overdueInvoices.length > 0
      ? `${overdueInvoices.length} en retard`
      : 'À jour';

  // ---------- Leads timeline (contacts + calls in one series) ----------

  type Channel = 'all' | 'contact' | 'call';
  const [chartChannel, setChartChannel] = useState<Channel>('all');
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  // Build a series of {label, iso, count} evenly spaced buckets over the
  // period. Aujourd'hui = 8 slots of 3h. Cette semaine = 7 days. Ce mois =
  // 30 days. Custom = the picked day split into 8 slots.
  const timeline = useMemo(() => {
    const periodStart = new Date();
    const buckets: Array<{ label: string; iso: string; count: number }> = [];

    const contactDates: string[] = contacts
      .map((c) => (typeof c.createdAt === 'string' ? c.createdAt : null))
      .filter((v): v is string => Boolean(v));
    const callDates: string[] = calls.map((c) => c.startedAt);

    const relevantDates =
      chartChannel === 'contact'
        ? contactDates
        : chartChannel === 'call'
          ? callDates
          : [...contactDates, ...callDates];

    const pushHourBuckets = (anchor: Date, slots = 8) => {
      const stepMs = (24 * 3600 * 1000) / slots;
      const dayStart = new Date(anchor);

      dayStart.setHours(0, 0, 0, 0);

      for (let i = 0; i < slots; i += 1) {
        const start = new Date(dayStart.getTime() + i * stepMs);
        const end = new Date(start.getTime() + stepMs);
        const label = `${start.getHours().toString().padStart(2, '0')}h`;
        const count = relevantDates.filter((iso2) => {
          const ts = new Date(iso2).getTime();

          return ts >= start.getTime() && ts < end.getTime();
        }).length;

        buckets.push({ label, iso: start.toISOString(), count });
      }
    };

    const pushRangeBuckets = (startIso: string, endIso: string) => {
      const start = new Date(startIso);
      const end = new Date(endIso);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      let a = start.getTime();
      let b = end.getTime();

      if (b < a) [a, b] = [b, a];
      const spanDays = Math.max(1, Math.ceil((b - a) / 86400000));

      // Single day → same 8x3h buckets as "today"
      if (spanDays <= 1) {
        pushHourBuckets(new Date(a));
        return;
      }
      // Cap at 60 buckets to keep the chart readable · daily up to 60 days,
      // otherwise aggregate by week.
      if (spanDays <= 60) {
        const now = new Date();

        for (let i = spanDays - 1; i >= 0; i -= 1) {
          const d = new Date(now);
          const target = new Date(b);

          target.setDate(target.getDate() - i);
          target.setHours(0, 0, 0, 0);
          d.getTime();
          const dayEnd = new Date(target);

          dayEnd.setHours(23, 59, 59, 999);
          const label = target.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          });
          const count = relevantDates.filter((iso2) => {
            const ts = new Date(iso2).getTime();

            return ts >= target.getTime() && ts <= dayEnd.getTime();
          }).length;

          buckets.push({ label, iso: target.toISOString(), count });
        }
        return;
      }
      // Weekly aggregation for very long ranges.
      const weekMs = 7 * 86400000;
      const totalWeeks = Math.ceil((b - a) / weekMs);

      for (let i = 0; i < totalWeeks; i += 1) {
        const wStart = a + i * weekMs;
        const wEnd = Math.min(b, wStart + weekMs - 1);
        const label = new Date(wStart).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        });
        const count = relevantDates.filter((iso2) => {
          const ts = new Date(iso2).getTime();

          return ts >= wStart && ts <= wEnd;
        }).length;

        buckets.push({ label, iso: new Date(wStart).toISOString(), count });
      }
    };

    if (period === 'today') {
      pushHourBuckets(periodStart);
    } else if (period === 'week' || period === 'month') {
      // Semaine calendaire (lundi -> dimanche) ou mois calendaire
      // (1er -> dernier jour), en réutilisant periodRange déjà calculé
      // plus haut pour que le chart couvre exactement la même plage que
      // les cartes et la liste des leads.
      pushRangeBuckets(
        new Date(periodRange.start).toISOString(),
        new Date(periodRange.end).toISOString(),
      );
    } else {
      pushRangeBuckets(customStart, customEnd);
    }

    return buckets;
  }, [contacts, calls, chartChannel, period, customStart, customEnd]);

  const chartMax = Math.max(1, ...timeline.map((b) => b.count));
  const chartTotal = timeline.reduce((s, b) => s + b.count, 0);
  const chartTrendPct = (() => {
    if (timeline.length < 2) return 0;
    const half = Math.floor(timeline.length / 2);
    const left = timeline.slice(0, half).reduce((s, b) => s + b.count, 0);
    const right = timeline.slice(half).reduce((s, b) => s + b.count, 0);

    if (left === 0) return right > 0 ? 100 : 0;

    return Math.round(((right - left) / left) * 100);
  })();

  // SVG path builder · segments droits, area under curve.
  const chartViewW = 700;
  const chartViewH = 220;
  const chartPadding = { top: 20, right: 12, bottom: 30, left: 34 };
  const innerW = chartViewW - chartPadding.left - chartPadding.right;
  const innerH = chartViewH - chartPadding.top - chartPadding.bottom;
  const stepX = timeline.length > 1 ? innerW / (timeline.length - 1) : 0;
  const points = timeline.map((b, i) => {
    const x = chartPadding.left + i * stepX;
    const y = chartPadding.top + innerH - (b.count / chartMax) * innerH;

    return { x, y, ...b };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartPadding.top + innerH} L ${points[0].x} ${chartPadding.top + innerH} Z`
      : '';

  // ---------- Recent leads list ----------

  type LeadKind = 'contact' | 'call';
  type LeadItem = {
    id: string;
    kind: LeadKind;
    name: string;
    phone: string;
    at: string;
  };

  const [leadFilter, setLeadFilter] = useState<Channel>('all');
  const [detailDrawer, setDetailDrawer] = useState<{
    title: string;
    fields: BuzzleLeadDrawerField[];
  } | null>(null);


  const openCallDrawer = (callId: string) => {
    const record = MOCK_CALLS.find((c) => c.id === callId);

    if (!record) return;
    setDetailDrawer({
      title: record.contactName,
      fields: [
        {
          label: 'Reçu le',
          value: new Date(record.startedAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        { label: 'Numéro', value: record.phoneNumber },
        { label: 'Contact', value: record.contactName },
      ],
    });
  };

  const leads: LeadItem[] = useMemo(() => {
    const contactLeads: LeadItem[] = contacts.map((c) => ({
      id: `contact-${c.id}`,
      kind: 'contact',
      name:
        typeof c.name === 'string' && c.name.trim().length > 0
          ? c.name
          : 'Sans nom',
      phone: (() => {
        const p = c.phone as {
          primaryPhoneCallingCode?: string;
          primaryPhoneNumber?: string;
        } | null | undefined;

        if (!p || typeof p !== 'object') return '';

        return `${p.primaryPhoneCallingCode ?? ''} ${p.primaryPhoneNumber ?? ''}`.trim();
      })(),
      at: typeof c.createdAt === 'string' ? c.createdAt : '',
    }));
    const callLeads: LeadItem[] = calls.map((c) => ({
      id: `call-${c.id}`,
      kind: 'call',
      name: c.contactName,
      phone: c.phoneNumber,
      at: c.startedAt,
    }));

    const merged = [...contactLeads, ...callLeads]
      .filter((l) =>
        leadFilter === 'all' ? true : leadFilter === 'contact' ? l.kind === 'contact' : l.kind === 'call',
      )
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 40);

    return merged;
  }, [contacts, calls, leadFilter]);

  const groupedLeads = useMemo(() => {
    const groups: Record<string, LeadItem[]> = {};

    for (const lead of leads) {
      const day = new Date(lead.at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      if (!groups[day]) groups[day] = [];
      groups[day].push(lead);
    }

    return Object.entries(groups);
  }, [leads]);

  const formatHourMin = (raw: string): string => {
    try {
      return new Date(raw).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const contactsAllTime = allContacts.length;

  const kpiTiles = (
    <KpiRow>
      <Tile data-accent="true" onClick={() => navigate('/invoices')}>
        <TileLabel>Factures · solde à régler</TileLabel>
        <TileValue>
          {formatEuro(pendingBalance)}
        </TileValue>
        <TileFooter>
          <TileBadge data-tone={overdueInvoices.length > 0 ? 'down' : 'up'}>
            {pendingCount} en attente
          </TileBadge>
          <span>
            {overdueInvoices.length > 0
              ? `dont ${overdueInvoices.length} en retard`
              : 'tout est à jour'}
          </span>
        </TileFooter>
      </Tile>

      <Tile>
        <TileLabel>Contacts</TileLabel>
        <TileValue>{contactTotal}</TileValue>
        <TileFooter>
          <TileBadge>sur la période</TileBadge>
        </TileFooter>
      </Tile>

      <Tile>
        <TileLabel>Formulaires</TileLabel>
        <TileValue>{contactsAllTime}</TileValue>
        <TileFooter>
          <TileBadge>total base</TileBadge>
        </TileFooter>
      </Tile>

      <Tile>
        <TileLabel>Appels</TileLabel>
        <TileValue>{MOCK_CALLS_TOTAL}</TileValue>
        <TileFooter>
          <TileBadge>sur la période</TileBadge>
        </TileFooter>
      </Tile>
    </KpiRow>
  );

  const chartAndLeadsSections = (
    <>
      <ChartCard>
          <ChartCardHead>
            <div>
              <ChartCardTitle>Leads</ChartCardTitle>
              <ChartCardSub>
                Volume cumulé sur {period === 'today' ? 'la journée' : period === 'week' ? '7 jours' : period === 'month' ? '30 jours' : `du ${formatShortDate(customStart)} au ${formatShortDate(customEnd)}`}
              </ChartCardSub>
            </div>
            <ChannelPills>
              <ChannelPill
                active={chartChannel === 'all'}
                onClick={() => setChartChannel('all')}
              >
                Tous
              </ChannelPill>
              <ChannelPill
                active={chartChannel === 'contact'}
                onClick={() => setChartChannel('contact')}
              >
                Formulaires
              </ChannelPill>
              <ChannelPill
                active={chartChannel === 'call'}
                onClick={() => setChartChannel('call')}
              >
                Appels
              </ChannelPill>
            </ChannelPills>
          </ChartCardHead>

          <ChartArea>
            <ChartSvg
              viewBox={`0 0 ${chartViewW} ${chartViewH}`}
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();

                if (rect.width === 0 || points.length === 0) return;
                const localX = e.clientX - rect.left;
                const svgX = (localX / rect.width) * chartViewW;
                let closest = 0;
                let bestDist = Infinity;

                for (let i = 0; i < points.length; i += 1) {
                  const d = Math.abs(points[i].x - svgX);

                  if (d < bestDist) {
                    bestDist = d;
                    closest = i;
                  }
                }
                setTooltipIdx(closest);
              }}
              onMouseLeave={() => setTooltipIdx(null)}
            >
              <defs>
                <linearGradient id="buzzleChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VioletColor} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={VioletColor} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                <line
                  key={i}
                  x1={chartPadding.left}
                  x2={chartPadding.left + innerW}
                  y1={chartPadding.top + innerH - frac * innerH}
                  y2={chartPadding.top + innerH - frac * innerH}
                  stroke="rgba(20,20,28,0.06)"
                  strokeDasharray="3 4"
                />
              ))}

              {/* Y axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => Math.round(frac * chartMax)).map((val, i) => (
                <text
                  key={i}
                  x={chartPadding.left - 8}
                  y={
                    chartPadding.top +
                    innerH -
                    (val / chartMax) * innerH +
                    4
                  }
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="10"
                  fill="rgba(20,20,28,0.4)"
                  textAnchor="end"
                >
                  {val}
                </text>
              ))}

              {/* Area + line */}
              {points.length > 1 && (
                <>
                  <path d={areaPath} fill="url(#buzzleChartFill)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={VioletColor}
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* X axis labels · every nth point to avoid crowding */}
              {points.map((p, i) => {
                const skip = Math.max(1, Math.floor(points.length / 4));

                if (i % skip !== 0 && i !== points.length - 1) return null;

                return (
                  <text
                    key={`x-${i}`}
                    x={p.x}
                    y={chartPadding.top + innerH + 18}
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="10"
                    fill="rgba(20,20,28,0.4)"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                );
              })}

              {tooltipIdx !== null && points[tooltipIdx] && (
                <>
                  <line
                    x1={points[tooltipIdx].x}
                    x2={points[tooltipIdx].x}
                    y1={chartPadding.top}
                    y2={chartPadding.top + innerH}
                    stroke="rgba(20,20,28,0.14)"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={points[tooltipIdx].x}
                    cy={points[tooltipIdx].y}
                    r="5"
                    fill="#ffffff"
                    stroke={VioletColor}
                    strokeWidth="2.5"
                  />
                </>
              )}
            </ChartSvg>

            {tooltipIdx !== null && points[tooltipIdx] && (
              <ChartTooltip
                style={{
                  left: `${Math.min(
                    Math.max((points[tooltipIdx].x / chartViewW) * 100, 8),
                    82,
                  )}%`,
                  top: '8%',
                  transform: 'translateX(-50%)',
                }}
              >
                <ChartTooltipLabel>{points[tooltipIdx].label}</ChartTooltipLabel>
                <ChartTooltipValue>{points[tooltipIdx].count}</ChartTooltipValue>
                <ChartTooltipTrend>
                  Total {chartTotal} · {chartTrendPct >= 0 ? '+' : ''}
                  {chartTrendPct}% vs période
                </ChartTooltipTrend>
              </ChartTooltip>
            )}
          </ChartArea>
        </ChartCard>

        <LeadsCard>
          <LeadsHead>
            <div>
              <ChartCardTitle>Activité récente</ChartCardTitle>
              <ChartCardSub>Derniers leads entrants</ChartCardSub>
            </div>
            <LeadsHeadRight>
              <LeadsFilter
                active={leadFilter === 'all'}
                onClick={() => setLeadFilter('all')}
              >
                Tous
              </LeadsFilter>
              <LeadsFilter
                active={leadFilter === 'contact'}
                onClick={() => setLeadFilter('contact')}
              >
                Contact
              </LeadsFilter>
              <LeadsFilter
                active={leadFilter === 'call'}
                onClick={() => setLeadFilter('call')}
              >
                Appels
              </LeadsFilter>
            </LeadsHeadRight>
          </LeadsHead>

          <LeadsScroll>
            {leads.length === 0 ? (
              <LeadsEmpty>Aucun lead pour le moment.</LeadsEmpty>
            ) : (
              groupedLeads.map(([day, dayLeads]) => (
                <div key={day}>
                  <LeadDayLabel>{day}</LeadDayLabel>
                  {dayLeads.map((lead) => (
                    <LeadRow key={lead.id}>
                      <LeadIcon
                        tint={avatarGradient(lead.name)}
                        color="#ffffff"
                      >
                        {avatarInitials(lead.name)}
                      </LeadIcon>
                      <div>
                        <LeadName>{lead.name}</LeadName>
                        <LeadMeta>{lead.phone || '-'}</LeadMeta>
                      </div>
                      <LeadRight>
                        <LeadTime>{formatHourMin(lead.at)}</LeadTime>
                        <LeadEyeButton
                          aria-label={`Voir ${lead.name}`}
                          onClick={() => {
                            const rawId = lead.id.replace(/^(contact|call)-/, '');

                            if (lead.kind === 'contact') {
                              navigate(`/contacts/${rawId}`);
                              return;
                            }
                            openCallDrawer(rawId);
                          }}
                        >
                          <IconEye />
                        </LeadEyeButton>
                      </LeadRight>
                    </LeadRow>
                  ))}
                </div>
              ))
            )}
          </LeadsScroll>

          {leadFilter !== 'all' && (
            <SeeAllRow
              onClick={() =>
                navigate(leadFilter === 'contact' ? '/contacts' : '/calls')
              }
            >
              Voir tous les {leadFilter === 'contact' ? 'contacts' : 'appels'}
              <IconArrowRight />
            </SeeAllRow>
          )}
        </LeadsCard>
    </>
  );

  const leadDrawer = detailDrawer && (
    <BuzzleLeadDrawer
      title={detailDrawer.title}
      fields={detailDrawer.fields}
      onClose={() => setDetailDrawer(null)}
    />
  );

  if (!isMobile) {
    return (
      <ShellGrid>
        <BuzzleFloatingHamburger />
        <BuzzleFloatingSidebar />
        <BuzzleOverviewShellHeader
          period={period}
          onPeriodChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
        <Stage>
          <StageHead>
            <StageTitle>Vue d'ensemble</StageTitle>
          </StageHead>
          {kpiTiles}
          <LowerGrid>{chartAndLeadsSections}</LowerGrid>
        </Stage>
        {leadDrawer}
      </ShellGrid>
    );
  }

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Vue d'ensemble</PageTitle>
        </HeaderText>
        <HeaderActions>
          <BuzzlePeriodPicker
            period={period}
            onPeriodChange={setPeriod}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <BuzzleWorkspacesButton hideOnMobile />
        </HeaderActions>
      </HeaderRow>

      {kpiTiles}

      <LowerGrid>{chartAndLeadsSections}</LowerGrid>

      {leadDrawer}
    </Container>
  );
};
