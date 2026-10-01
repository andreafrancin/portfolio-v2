import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PIECES, STEM, VINE_VIEWBOX } from './vine-art';
import './index.scss';

const FALLABLE = PIECES.map((p, i) => ({ p, i })).filter(
  ({ p }) => p.t[1] + p.b[1] < 200 && p.b[2] * p.b[3] > 600
);

interface FallingLeaf {
  id: number;
  piece: number;
  style: React.CSSProperties;
}

let fallId = 0;

function useFallingLeaves(ref: React.RefObject<HTMLDivElement | null>, active: boolean) {
  const [leaves, setLeaves] = useState<FallingLeaf[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el || FALLABLE.length === 0) return;
    let timer = 0;
    let onScreen = true;

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    io.observe(el);

    const drop = () => {
      if (onScreen && !document.hidden) {
        const { i } = FALLABLE[Math.floor(Math.random() * FALLABLE.length)];
        const dir = Math.random() < 0.5 ? -1 : 1;
        const style = {
          '--fall': `${140 + Math.random() * 120}px`,
          '--sway': `${dir * (14 + Math.random() * 22)}px`,
          '--turn': `${dir * (90 + Math.random() * 160)}deg`,
          '--dur': `${7 + Math.random() * 3}s`,
        } as React.CSSProperties;
        setLeaves((list) => [...list.slice(-1), { id: ++fallId, piece: i, style }]);
      }
      timer = window.setTimeout(drop, 4000 + Math.random() * 4000);
    };
    timer = window.setTimeout(drop, 3200);

    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [active, ref]);

  const remove = (id: number) => setLeaves((list) => list.filter((l) => l.id !== id));
  return { leaves, remove };
}

function Vine({ className = '', tone }: { className?: string; tone?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'still' | 'armed' | 'grown'>('still');
  const { leaves, remove } = useFallingLeaves(ref, phase === 'grown');

  useLayoutEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setPhase('armed');
  }, []);

  useEffect(() => {
    if (phase !== 'armed' || !ref.current) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => setPhase('grown'));
        });
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  return (
    <div
      ref={ref}
      className={`vine vine--${phase} ${className}`}
      aria-hidden="true"
      style={tone ? ({ '--vine': tone } as React.CSSProperties) : undefined}
    >
      <svg
        viewBox={`0 0 ${VINE_VIEWBOX.width} ${VINE_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          className="vine__stem"
          d={STEM.d}
          transform={`translate(${STEM.t[0]} ${STEM.t[1]})`}
          fillRule="evenodd"
        />
        {PIECES.map((p, i) => (
          <path
            key={i}
            className="vine__piece"
            d={p.d}
            transform={`translate(${p.t[0]} ${p.t[1]})`}
            fillRule="evenodd"
            style={{ '--at': (p.cx / VINE_VIEWBOX.width).toFixed(3) } as React.CSSProperties}
          />
        ))}
      </svg>

      {leaves.map(({ id, piece, style }) => {
        const p = PIECES[piece];
        const [bx, by, bw, bh] = p.b;
        const box = {
          left: `${((p.t[0] + bx) / VINE_VIEWBOX.width) * 100}%`,
          top: `${((p.t[1] + by) / VINE_VIEWBOX.height) * 100}%`,
          width: `${(bw / VINE_VIEWBOX.width) * 100}%`,
          height: `${(bh / VINE_VIEWBOX.height) * 100}%`,
        };
        return (
          <svg
            key={id}
            className="vine__falling"
            viewBox={`${bx} ${by} ${bw} ${bh}`}
            style={{ ...box, ...style }}
            onAnimationEnd={() => remove(id)}
          >
            <path d={p.d} fillRule="evenodd" />
          </svg>
        );
      })}
    </div>
  );
}

export default Vine;
