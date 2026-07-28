import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';

// Ink shell background for the Overview workspace page. Same visual DNA
// as BuzzleAuthBackground (grid of cells + mouse-following purple
// spotlight) but tuned for an app context: no bottom fade, softer
// spotlight radius, sits at z-index 0 behind the floating sidebar,
// top-bar, and stage card. Only mounted when the /overview route is
// active (see DefaultLayout).

const InkColor = '#14141c';
const AccentColor = 'rgba(91, 75, 255, 0.28)';
const GridColor = 'rgba(115, 115, 115, 0.28)';

const CELL = 48;

const Root = styled.div`
  position: fixed;
  inset: 0;
  background: ${InkColor};
  overflow: hidden;
  z-index: 0;
  --mx: -400px;
  --my: -400px;
  pointer-events: none;
`;

const Cells = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
`;

const CellsBase = styled(Cells)`
  opacity: 0.45;
  z-index: 10;
`;

const CellsHover = styled(Cells)`
  z-index: 20;
  -webkit-mask-image: radial-gradient(
    180px circle at var(--mx) var(--my),
    white,
    transparent 70%
  );
  mask-image: radial-gradient(
    180px circle at var(--mx) var(--my),
    white,
    transparent 70%
  );
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${GridColor};
  flex-shrink: 0;
`;

const AccentCol = styled(Col)`
  border-bottom-color: ${AccentColor};
`;

const Cell = styled.div`
  width: ${CELL}px;
  height: ${CELL}px;
  border-left: 1px solid ${GridColor};
  border-bottom: 1px solid ${GridColor};
`;

const AccentCell = styled(Cell)`
  border-left-color: ${AccentColor};
  border-bottom-color: ${AccentColor};
  background: ${AccentColor};
`;

type Grid = { cols: number; rows: number };

const useGridSize = (): Grid => {
  const compute = (): Grid => {
    if (typeof window === 'undefined') {
      return { cols: 0, rows: 0 };
    }
    return {
      cols: Math.min(60, Math.ceil(window.innerWidth / CELL) + 2),
      rows: Math.ceil(window.innerHeight / CELL) + 2,
    };
  };
  const [grid, setGrid] = useState<Grid>(compute);

  useEffect(() => {
    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setGrid(compute()));
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  return grid;
};

const renderGrid = (
  grid: Grid,
  Column: typeof Col,
  CellCmp: typeof Cell,
) => {
  const cols = [];
  for (let c = 0; c < grid.cols; c++) {
    const cells = [];
    for (let r = 0; r < grid.rows; r++) {
      cells.push(<CellCmp key={r} />);
    }
    cols.push(<Column key={c}>{cells}</Column>);
  }
  return cols;
};

export const BuzzleInkShellBackground = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const grid = useGridSize();

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    let raf = 0;
    let px = -400;
    let py = -400;

    const apply = () => {
      root.style.setProperty('--mx', `${px}px`);
      root.style.setProperty('--my', `${py}px`);
      raf = 0;
    };

    const move = (event: MouseEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (raf === 0) raf = requestAnimationFrame(apply);
    };

    const leave = () => {
      px = -400;
      py = -400;
      if (raf === 0) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (grid.cols === 0) {
    return <Root ref={rootRef} aria-hidden="true" />;
  }

  return (
    <Root ref={rootRef} aria-hidden="true">
      <CellsBase>{renderGrid(grid, Col, Cell)}</CellsBase>
      <CellsHover>{renderGrid(grid, AccentCol, AccentCell)}</CellsHover>
    </Root>
  );
};
