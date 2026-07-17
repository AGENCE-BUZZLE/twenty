import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';

// Compact period picker used on every Buzzle workspace page. Shows a
// pill with the current label + chevron; tapping it opens a dropdown
// with Aujourd'hui / Cette semaine / Ce mois-ci / Personnaliser. The
// "Personnaliser" option reveals a start/end date picker inline in the
// same dropdown so the user never leaves the menu.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

export type BuzzlePeriod = 'today' | 'week' | 'month' | 'custom';

type Props = {
  period: BuzzlePeriod;
  onPeriodChange: (period: BuzzlePeriod) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
};

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid ${InkColor};
  background: ${SurfaceColor};
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  background: ${SurfaceColor};
  border: 1px solid ${InkColor};
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(20, 20, 28, 0.16);
  padding: 6px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MenuItem = styled.button<{ active?: boolean }>`
  text-align: left;
  padding: 9px 12px;
  border-radius: 8px;
  border: 0;
  background: ${({ active }) =>
    active ? 'rgba(20, 20, 28, 0.08)' : 'transparent'};
  color: ${InkColor};
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? 500 : 400)};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background: rgba(20, 20, 28, 0.06);
  }
`;

const CustomBlock = styled.div`
  border-top: 1px solid rgba(20, 20, 28, 0.08);
  margin-top: 4px;
  padding: 10px 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CustomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CustomLabel = styled.label`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${MutedColor};
  width: 28px;
`;

const CustomInput = styled.input`
  flex: 1 1 auto;
  padding: 7px 10px;
  border: 1px solid rgba(20, 20, 28, 0.14);
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: ${InkColor};
  background: ${SurfaceColor};
  &:focus {
    outline: none;
    border-color: ${InkColor};
  }
`;

const IconChevronDown = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ marginLeft: 'auto' }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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

export const BuzzlePeriodPicker = ({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label =
    period === 'today'
      ? "Aujourd'hui"
      : period === 'week'
        ? 'Cette semaine'
        : period === 'month'
          ? 'Ce mois-ci'
          : customStart && customEnd
            ? `${formatShortDate(customStart)} → ${formatShortDate(customEnd)}`
            : 'Personnaliser';

  const selectPreset = (next: BuzzlePeriod) => {
    onPeriodChange(next);
    if (next !== 'custom') setOpen(false);
  };

  return (
    <Wrap ref={wrapRef}>
      <Pill
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <IconChevronDown />
      </Pill>
      {open && (
        <Menu role="menu">
          <MenuItem
            active={period === 'today'}
            onClick={() => selectPreset('today')}
          >
            Aujourd'hui {period === 'today' && <IconCheck />}
          </MenuItem>
          <MenuItem
            active={period === 'week'}
            onClick={() => selectPreset('week')}
          >
            Cette semaine {period === 'week' && <IconCheck />}
          </MenuItem>
          <MenuItem
            active={period === 'month'}
            onClick={() => selectPreset('month')}
          >
            Ce mois-ci {period === 'month' && <IconCheck />}
          </MenuItem>
          <MenuItem
            active={period === 'custom'}
            onClick={() => selectPreset('custom')}
          >
            Personnaliser {period === 'custom' && <IconCheck />}
          </MenuItem>
          {period === 'custom' && (
            <CustomBlock>
              <CustomRow>
                <CustomLabel>Du</CustomLabel>
                <CustomInput
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                />
              </CustomRow>
              <CustomRow>
                <CustomLabel>Au</CustomLabel>
                <CustomInput
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                />
              </CustomRow>
            </CustomBlock>
          )}
        </Menu>
      )}
    </Wrap>
  );
};
