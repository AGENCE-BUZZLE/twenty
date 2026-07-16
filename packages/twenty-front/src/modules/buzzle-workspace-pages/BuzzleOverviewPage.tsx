import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { BuzzleLeadDrawer, type BuzzleLeadDrawerField } from '@/buzzle-workspace-pages/BuzzleLeadDrawer';
import { BuzzleWorkspacesButton } from '@/buzzle-workspace-nav/BuzzleWorkspacesButton';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
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
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 20px;
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Inter Tight', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.024em;
  color: ${InkColor};
  margin: 0;
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

const HeaderPeriodStrip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 999px;
  padding: 4px;
`;

const HeaderPeriodPill = styled.button<{ active?: boolean }>`
  padding: 7px 14px;
  border-radius: 999px;
  border: 0;
  background: ${({ active }) => (active ? InkColor : 'transparent')};
  color: ${({ active }) => (active ? SurfaceColor : InkColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover:not(:disabled) {
    background: ${({ active }) =>
      active ? InkColor : 'rgba(20, 20, 28, 0.06)'};
  }
`;

const HeaderCustomDate = styled.input`
  background: transparent;
  border: 0;
  color: inherit;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 0 4px;
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(1);
  }
`;

const CustomWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const CustomPopover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.16);
  padding: 14px 16px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 260px;
`;

const CustomPopoverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CustomPopoverLabel = styled.label`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  width: 32px;
`;

const CustomPopoverInput = styled.input`
  flex: 1 1 auto;
  padding: 8px 10px;
  border: 1px solid rgba(20, 20, 28, 0.14);
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: ${InkColor};
  background: ${SurfaceColor};
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const CustomPopoverActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
`;

const CustomPopoverButton = styled.button<{ primary?: boolean }>`
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid ${InkColor};
  background: ${({ primary }) => (primary ? InkColor : 'transparent')};
  color: ${({ primary }) => (primary ? SurfaceColor : InkColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
  }
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

const ChartCard = styled.div`
  background: ${InkColor};
  color: ${SurfaceColor};
  border-radius: 18px;
  padding: 16px 20px 12px;
  position: relative;
  overflow: visible;
  height: 320px;
  display: flex;
  flex-direction: column;
`;

const ChartCardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
`;

const ChartCardTitle = styled.div`
  font-family: 'Inter Tight', sans-serif;
  font-size: 18px;
  font-weight: 500;
`;

const ChartCardSub = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin-top: 4px;
`;

const ChannelPills = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  padding: 4px;
`;

const ChannelPill = styled.button<{ active?: boolean }>`
  padding: 6px 14px;
  border-radius: 999px;
  border: 0;
  background: ${({ active }) => (active ? SurfaceColor : 'transparent')};
  color: ${({ active }) => (active ? InkColor : SurfaceColor)};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? SurfaceColor : 'rgba(255,255,255,0.14)')};
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
  background: rgba(20, 20, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: ${SurfaceColor};
  pointer-events: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  min-width: 130px;
  z-index: 3;
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
  font-weight: 500;
  margin-top: 2px;
`;

const ChartTooltipTrend = styled.div`
  color: #c6f1c1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  margin-top: 4px;
`;

const LeadsCard = styled.div`
  background: ${InkColor};
  color: ${SurfaceColor};
  border-radius: 18px;
  padding: 16px 18px 12px;
  display: flex;
  flex-direction: column;
  height: 320px;
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
    background: rgba(255, 255, 255, 0.12);
    border-radius: 999px;
  }
`;

const LeadsHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const LeadsHeadRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const LeadsFilter = styled.button<{ active?: boolean }>`
  background: transparent;
  border: 0;
  color: ${({ active }) => (active ? SurfaceColor : 'rgba(255,255,255,0.55)')};
  padding: 4px 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? 500 : 400)};
  cursor: pointer;
  border-bottom: 2px solid
    ${({ active }) => (active ? '#c9b7ff' : 'transparent')};
  transition: color 0.12s, border-color 0.12s;
`;

const LeadDayLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  padding: 12px 0 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const LeadRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  &:last-of-type {
    border-bottom: 0;
  }
`;

const LeadIcon = styled.span<{ tint: string; color: string }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${({ tint }) => tint};
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const LeadName = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
`;

const LeadMeta = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.55);
`;

const LeadRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const LeadTime = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
`;

const LeadEyeButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: ${SurfaceColor};
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const LeadsEmpty = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
`;

const SeeAllRow = styled.button`
  margin-top: auto;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${SurfaceColor};
  padding: 14px 18px;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
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

const monthLabel = (): string => {
  return new Date()
    .toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' })
    .toUpperCase();
};

type Period = 'today' | 'week' | 'month' | 'custom';

export const BuzzleOverviewPage = () => {
  const navigate = useNavigate();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const displayName = currentUser?.firstName ?? '';
  const workspaceName = currentWorkspace?.displayName ?? 'votre workspace';

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

  // Calls are still mocked (waiting on a real provider) — mirror the count
  // that BuzzleCallsPage displays so the dashboard stays in sync.
  const MOCK_CALLS = useMemo(
    () => [
      { id: 'mock-1', startedAt: '2026-07-11T09:32:00Z', contactName: 'Sylvie Vartan', phoneNumber: '+33 6 87 65 43 21' },
      { id: 'mock-2', startedAt: '2026-07-11T08:14:00Z', contactName: 'Alexandre Meyer', phoneNumber: '+33 6 12 34 56 78' },
      { id: 'mock-3', startedAt: '2026-07-10T18:47:00Z', contactName: 'Numéro inconnu', phoneNumber: '+33 4 91 22 33 44' },
      { id: 'mock-4', startedAt: '2026-07-10T15:03:00Z', contactName: 'Karim Bakri', phoneNumber: '+33 7 82 65 41 09' },
    ],
    [],
  );

  // Period filter — controls every derived value below (chart, list, cards,
  // solde, distribution, everything). "custom" is a start → end range.
  const [period, setPeriod] = useState<Period>('week');
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const weekAgoIso = () => {
    const d = new Date();

    d.setDate(d.getDate() - 6);

    return d.toISOString().slice(0, 10);
  };
  const [customStart, setCustomStart] = useState<string>(weekAgoIso);
  const [customEnd, setCustomEnd] = useState<string>(todayIso);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const customPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customPickerOpen) return;
    const handler = (event: MouseEvent) => {
      if (
        customPickerRef.current &&
        !customPickerRef.current.contains(event.target as Node)
      ) {
        setCustomPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [customPickerOpen]);

  const periodRange = useMemo(() => {
    const now = Date.now();

    if (period === 'today') {
      const d = new Date();

      d.setHours(0, 0, 0, 0);

      return { start: d.getTime(), end: now };
    }
    if (period === 'week') {
      return { start: now - 7 * 86400000, end: now };
    }
    if (period === 'month') {
      return { start: now - 30 * 86400000, end: now };
    }
    // custom = start / end range picked in the header
    const start = customStart ? new Date(customStart) : new Date();

    start.setHours(0, 0, 0, 0);
    const end = customEnd ? new Date(customEnd) : new Date();

    end.setHours(23, 59, 59, 999);

    // Guard against inverted range — swap if end is before start.
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
    const buckets: Record<string, number> = {
      NEW: 0,
      QUOTED: 0,
      VALIDATED: 0,
      CANCELLED: 0,
    };
    for (const c of contacts) {
      const s = typeof c.status === 'string' ? c.status : 'NEW';

      if (buckets[s] !== undefined) buckets[s] += 1;
    }

    return buckets;
  }, [contacts]);
  const contactNewCount = contactByStatus.NEW;
  const contactValidatedCount = contactByStatus.VALIDATED;

  const MOCK_CALLS_TOTAL = calls.length;
  const MOCK_CALLS_QUALIFIED = 0;

  const totalContactsForBar = Math.max(1, contactTotal);
  const seg = (label: string, count: number, color: string) => ({
    label,
    count,
    pct: (count / totalContactsForBar) * 100,
    color,
  });
  const distribution = [
    seg('Nouveaux', contactByStatus.NEW, '#f2b400'),
    seg('Devis envoyés', contactByStatus.QUOTED, VioletColor),
    seg('Validés', contactByStatus.VALIDATED, '#22b972'),
    seg('Annulés', contactByStatus.CANCELLED, '#8a8b91'),
  ];

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

    const pushDayBuckets = (days: number) => {
      const now = new Date();

      for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(now);

        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const iso = d.toISOString();
        const label = d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        });
        const dayEnd = new Date(d);

        dayEnd.setHours(23, 59, 59, 999);
        const count = relevantDates.filter((iso2) => {
          const ts = new Date(iso2).getTime();

          return ts >= d.getTime() && ts <= dayEnd.getTime();
        }).length;

        buckets.push({ label, iso, count });
      }
    };

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
      // Cap at 60 buckets to keep the chart readable — daily up to 60 days,
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
    } else if (period === 'week') {
      pushDayBuckets(7);
    } else if (period === 'month') {
      pushDayBuckets(30);
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

  // SVG path builder — segments droits, area under curve.
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

  // Build drawer fields from a contact / call and open the drawer. Mirrors
  // the "Voir les informations" behavior on the /contacts page.
  const openContactDrawer = (contactId: string) => {
    const record = allContacts.find((c) => c.id === contactId);

    if (!record) return;
    const name =
      typeof record.name === 'string' && record.name.trim().length > 0
        ? record.name
        : 'Détail du contact';
    const phone = (() => {
      const p = record.phone as {
        primaryPhoneCallingCode?: string;
        primaryPhoneNumber?: string;
      } | null | undefined;

      if (!p || typeof p !== 'object') return '';

      return `${p.primaryPhoneCallingCode ?? ''} ${p.primaryPhoneNumber ?? ''}`.trim();
    })();
    const email = (() => {
      const e = record.email as { primaryEmail?: string } | null | undefined;

      if (!e || typeof e !== 'object') return '';

      return e.primaryEmail ?? '';
    })();

    setDetailDrawer({
      title: name,
      fields: [
        {
          label: 'Reçu le',
          value: typeof record.createdAt === 'string'
            ? new Date(record.createdAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
        },
        { label: 'Email', value: email },
        { label: 'Téléphone', value: phone },
        {
          label: 'Message',
          value: typeof record.message === 'string' ? record.message : '',
        },
        {
          label: 'Statut',
          value: typeof record.status === 'string' ? record.status : '',
        },
        {
          label: 'Google Click ID',
          value: typeof record.gclid === 'string' ? record.gclid : '',
        },
        {
          label: 'UTM Source',
          value: typeof record.utmSource === 'string' ? record.utmSource : '',
        },
        {
          label: 'UTM Medium',
          value: typeof record.utmMedium === 'string' ? record.utmMedium : '',
        },
        {
          label: 'UTM Campaign',
          value:
            typeof record.utmCampaign === 'string' ? record.utmCampaign : '',
        },
      ],
    });
  };

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

  return (
    <Container>
      <HeaderRow>
        <HeaderText>
          <PageTitle>Vue d'ensemble</PageTitle>
        </HeaderText>
        <HeaderActions>
          <HeaderPeriodStrip role="tablist" aria-label="Période active">
            <HeaderPeriodPill
              active={period === 'today'}
              onClick={() => setPeriod('today')}
            >
              Aujourd'hui
            </HeaderPeriodPill>
            <HeaderPeriodPill
              active={period === 'week'}
              onClick={() => setPeriod('week')}
            >
              Cette semaine
            </HeaderPeriodPill>
            <HeaderPeriodPill
              active={period === 'month'}
              onClick={() => setPeriod('month')}
            >
              Ce mois-ci
            </HeaderPeriodPill>
            <CustomWrap ref={customPickerRef}>
              <HeaderPeriodPill
                active={period === 'custom'}
                onClick={() => {
                  setPeriod('custom');
                  setCustomPickerOpen((prev) => !prev);
                }}
              >
                {period === 'custom' && customStart && customEnd
                  ? `${formatShortDate(customStart)} → ${formatShortDate(customEnd)}`
                  : 'Période à définir'}
              </HeaderPeriodPill>
              {customPickerOpen && (
                <CustomPopover onClick={(e) => e.stopPropagation()}>
                  <CustomPopoverRow>
                    <CustomPopoverLabel htmlFor="buzzle-range-start">
                      Du
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-range-start"
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </CustomPopoverRow>
                  <CustomPopoverRow>
                    <CustomPopoverLabel htmlFor="buzzle-range-end">
                      Au
                    </CustomPopoverLabel>
                    <CustomPopoverInput
                      id="buzzle-range-end"
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </CustomPopoverRow>
                  <CustomPopoverActions>
                    <CustomPopoverButton
                      onClick={() => setCustomPickerOpen(false)}
                    >
                      Fermer
                    </CustomPopoverButton>
                    <CustomPopoverButton
                      primary
                      onClick={() => setCustomPickerOpen(false)}
                    >
                      Appliquer
                    </CustomPopoverButton>
                  </CustomPopoverActions>
                </CustomPopover>
              )}
            </CustomWrap>
          </HeaderPeriodStrip>
          <BuzzleWorkspacesButton />
        </HeaderActions>
      </HeaderRow>

      <Grid>
        <VioletCard>
          <VioletHead>
            <VioletTrend tone={overdueTrend}>
              <IconArrowUp /> {overdueSummary}
            </VioletTrend>
          </VioletHead>

          <div>
            <VioletBalanceLabel>Solde à régler</VioletBalanceLabel>
            <VioletBalanceValue>{formatEuro(pendingBalance)}</VioletBalanceValue>
            {lastOverdue ? (
              <VioletBalanceSub>
                Dernière en retard · <b>{lastOverdue.number}</b> émise le{' '}
                {formatShortDate(lastOverdue.date)}
              </VioletBalanceSub>
            ) : pendingCount > 0 ? (
              <VioletBalanceSub>
                {pendingCount} facture{pendingCount > 1 ? 's' : ''} en attente de règlement
              </VioletBalanceSub>
            ) : (
              <VioletBalanceSub>Aucune facture en retard, tout est à jour.</VioletBalanceSub>
            )}
          </div>

          <CtaRow>
            <CtaPrimary onClick={() => navigate('/invoices')}>
              Voir les factures <IconArrowRight />
            </CtaPrimary>
          </CtaRow>
        </VioletCard>

        <DarkCard>
          <DarkCardHead>
            <div>
              <DarkCardTitle>Mon activité</DarkCardTitle>
            </div>
          </DarkCardHead>

          <AssetGrid>
            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(126, 55, 254, 0.28)" color="#c9b7ff">
                  <IconUsers />
                </AssetIcon>
                <div>
                  <AssetName>Contacts</AssetName>
                </div>
              </AssetHead>
              <AssetValue>{contactTotal}</AssetValue>
            </AssetCard>

            <AssetCard>
              <AssetHead>
                <AssetIcon tint="rgba(34, 185, 114, 0.24)" color="#a7f4c9">
                  <IconPhone />
                </AssetIcon>
                <div>
                  <AssetName>Appels</AssetName>
                </div>
              </AssetHead>
              <AssetValue>{MOCK_CALLS_TOTAL}</AssetValue>
            </AssetCard>
          </AssetGrid>
        </DarkCard>
      </Grid>

      <LowerGrid>
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
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 4"
                />
              ))}

              {/* Y axis labels */}
              {[0, Math.ceil(chartMax / 2), chartMax].map((val, i) => (
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
                  fill="rgba(255,255,255,0.4)"
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

              {/* X axis labels — every nth point to avoid crowding */}
              {points.map((p, i) => {
                const skip = Math.max(1, Math.floor(points.length / 6));

                if (i % skip !== 0 && i !== points.length - 1) return null;

                return (
                  <text
                    key={`x-${i}`}
                    x={p.x}
                    y={chartPadding.top + innerH + 18}
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="10"
                    fill="rgba(255,255,255,0.4)"
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
                    stroke="rgba(255,255,255,0.14)"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={points[tooltipIdx].x}
                    cy={points[tooltipIdx].y}
                    r="5"
                    fill={VioletColor}
                    stroke={InkColor}
                    strokeWidth="3"
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
              <DarkCardTitle>Leads</DarkCardTitle>
              <DarkCardSub>Activité récente</DarkCardSub>
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
                        tint={
                          lead.kind === 'contact'
                            ? 'rgba(126, 55, 254, 0.28)'
                            : 'rgba(34, 185, 114, 0.24)'
                        }
                        color={
                          lead.kind === 'contact' ? '#c9b7ff' : '#a7f4c9'
                        }
                      >
                        {lead.kind === 'contact' ? <IconUsers /> : <IconPhone />}
                      </LeadIcon>
                      <div>
                        <LeadName>{lead.name}</LeadName>
                        <LeadMeta>{lead.phone || '—'}</LeadMeta>
                      </div>
                      <LeadRight>
                        <LeadTime>{formatHourMin(lead.at)}</LeadTime>
                        <LeadEyeButton
                          aria-label={`Voir ${lead.name}`}
                          onClick={() => {
                            const rawId = lead.id.replace(/^(contact|call)-/, '');

                            if (lead.kind === 'contact') openContactDrawer(rawId);
                            else openCallDrawer(rawId);
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
      </LowerGrid>

      {detailDrawer && (
        <BuzzleLeadDrawer
          title={detailDrawer.title}
          fields={detailDrawer.fields}
          onClose={() => setDetailDrawer(null)}
        />
      )}
    </Container>
  );
};
