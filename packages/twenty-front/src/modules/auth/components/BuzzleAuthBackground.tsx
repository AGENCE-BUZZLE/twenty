import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';

// Buzzle: full-viewport auth background that reproduces the hero from
// home.agence-buzzle.com. A grid of 48px cells on top of the Ink surface,
// with a radial spotlight that follows the mouse pointer to reveal a
// purple accent grid underneath. On mobile / reduced motion, the
// spotlight stays parked and only the static grid shows.

const InkColor = '#14141c';
const AccentColor = 'rgba(91, 75, 255, 0.32)';
const GridColor = 'rgba(115, 115, 115, 0.35)';

const CELL = 48;

const Root = styled.div`
  position: fixed;
  inset: 0;
  background: ${InkColor};
  overflow: hidden;
  z-index: 0;
  --mx: -300px;
  --my: -300px;
`;

const Fade = styled.div`
  position: absolute;
  inset: 0;
  z-index: 30;
  background: ${InkColor};
  pointer-events: none;
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    black 70%
  );
  mask-image: linear-gradient(to bottom, transparent, black 70%);
`;

const Cells = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
`;

const CellsBase = styled(Cells)`
  opacity: 0.5;
  z-index: 10;
`;

const CellsHover = styled(Cells)`
  z-index: 20;
  -webkit-mask-image: radial-gradient(
    140px circle at var(--mx) var(--my),
    white,
    transparent 70%
  );
  mask-image: radial-gradient(
    140px circle at var(--mx) var(--my),
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

export const BuzzleAuthBackground = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const grid = useGridSize();

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    let raf = 0;
    let px = -300;
    let py = -300;

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
      px = -300;
      py = -300;
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
      <Fade />
    </Root>
  );
};
