import { styled } from '@linaria/react';

// Shared right-side drawer used to inspect a lead (contact or call). The
// caller maps the underlying record to a list of {label, value} fields so
// the drawer stays visual-only.

const InkColor = '#14141c';
const SurfaceColor = '#ffffff';
const HairlineColor = '#d6d2c7';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 28, 0.35);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Drawer = styled.div`
  width: 460px;
  max-width: 100vw;
  height: 100%;
  background: ${SurfaceColor};
  border-left: 1px solid ${HairlineColor};
  padding: 28px 32px 32px;
  overflow-y: auto;
`;

const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const DrawerTitle = styled.h2`
  font-family: 'Inter Tight', sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: 1px solid ${HairlineColor};
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  color: ${InkColor};
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  &:hover {
    background: ${InkColor};
    color: ${SurfaceColor};
    border-color: ${InkColor};
  }
`;

const FieldRow = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${HairlineColor};
  &:last-child {
    border-bottom: 0;
  }
`;

const FieldLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${MutedColor};
  margin-bottom: 4px;
`;

const FieldValue = styled.div`
  color: ${InkColor};
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
`;

const IconClose = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export type BuzzleLeadDrawerField = {
  label: string;
  value: string;
};

type BuzzleLeadDrawerProps = {
  title: string;
  fields: BuzzleLeadDrawerField[];
  onClose: () => void;
};

export const BuzzleLeadDrawer = ({
  title,
  fields,
  onClose,
}: BuzzleLeadDrawerProps) => (
  <Backdrop onClick={onClose}>
    <Drawer onClick={(e) => e.stopPropagation()}>
      <DrawerHead>
        <DrawerTitle>{title}</DrawerTitle>
        <CloseButton onClick={onClose}>
          <IconClose /> Fermer
        </CloseButton>
      </DrawerHead>
      {fields
        .filter((f) => f.value.length > 0)
        .map((field) => (
          <FieldRow key={field.label}>
            <FieldLabel>{field.label}</FieldLabel>
            <FieldValue>{field.value}</FieldValue>
          </FieldRow>
        ))}
    </Drawer>
  </Backdrop>
);
