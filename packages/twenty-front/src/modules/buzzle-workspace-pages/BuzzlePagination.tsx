import { styled } from '@linaria/react';

// Shared client-side pagination strip used by Contacts, Appels and Factures.
// Shows Prev / page numbers / Next with the Buzzle Ink look. When there is
// only a single page the component renders null.

const InkColor = '#14141c';
const HairlineColor = '#d6d2c7';
const SurfaceColor = '#ffffff';
const MutedColor = 'rgba(20, 20, 28, 0.55)';

const Wrap = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const Summary = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${MutedColor};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ active }) => (active ? InkColor : HairlineColor)};
  background: ${({ active }) => (active ? InkColor : 'transparent')};
  color: ${({ active }) => (active ? SurfaceColor : InkColor)};
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:hover:not(:disabled) {
    background: ${InkColor};
    color: ${SurfaceColor};
    border-color: ${InkColor};
  }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const Ellipsis = styled.span`
  color: ${MutedColor};
  padding: 0 4px;
  font-family: 'JetBrains Mono', monospace;
`;

const IconChevronLeft = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Reduce a page list to Prev + up to 7 tokens like [1, 2, ellipsis, 5, 6, 7, ellipsis, 12].
const buildPageWindow = (current: number, total: number): Array<number | 'ellipsis'> => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [];

  pages.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');

  for (let p = start; p <= end; p += 1) pages.push(p);

  if (end < total - 1) pages.push('ellipsis');

  pages.push(total);

  return pages;
};

type BuzzlePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export const BuzzlePagination = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: BuzzlePaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const window = buildPageWindow(page, totalPages);

  return (
    <Wrap>
      <Summary>
        {start}-{end} sur {totalItems}
      </Summary>
      <Controls>
        <PageButton
          aria-label="Page precedente"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <IconChevronLeft />
        </PageButton>
        {window.map((token, idx) =>
          token === 'ellipsis' ? (
            <Ellipsis key={`e-${idx}`}>…</Ellipsis>
          ) : (
            <PageButton
              key={token}
              active={token === page}
              onClick={() => onPageChange(token)}
            >
              {token}
            </PageButton>
          ),
        )}
        <PageButton
          aria-label="Page suivante"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <IconChevronRight />
        </PageButton>
      </Controls>
    </Wrap>
  );
};
