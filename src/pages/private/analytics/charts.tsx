import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import i18n from '../../../i18n';

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

// A top for the scale that splits into four whole, even steps.
function niceMax(value: number): number {
  if (value <= 4) return 4;
  if (value <= 40) return Math.ceil(value / 4) * 4;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * step >= value) return m * step;
  }
  return value;
}

export interface TimelinePoint {
  key: string;
  label: string;
  tooltip: string;
  value: number;
}

const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 40 };

// One series over time: an area with a 2px line, a crosshair and a tooltip on hover.
export function Timeline({
  points,
  valueLabel,
  format = (n: number) => n.toLocaleString(i18n.language || undefined),
}: {
  points: TimelinePoint[];
  valueLabel: string;
  format?: (n: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const innerW = Math.max(0, width - PAD.left - PAD.right);
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;
    const x = (i: number) => PAD.left + (points.length > 1 ? i * step : innerW / 2);
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
    const line = points
      .map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
      .join('');
    const area = points.length
      ? `${line}L${x(points.length - 1).toFixed(1)},${PAD.top + innerH}L${x(0).toFixed(1)},${PAD.top + innerH}Z`
      : '';
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: max * f, y: y(max * f) }));
    const every = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(innerW / 64))));
    return { innerW, innerH, x, y, line, area, ticks, every, step };
  }, [points, width]);

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    if (!points.length) return;
    const box = event.currentTarget.getBoundingClientRect();
    const rel = event.clientX - box.left;
    const index = geometry.step ? Math.round(rel / geometry.step) : 0;
    setHover(Math.max(0, Math.min(points.length - 1, index)));
  };

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="timeline" ref={ref}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={valueLabel}>
          {geometry.ticks.map((tick) => (
            <g key={tick.v}>
              <line
                className="timeline__grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text className="timeline__axis" x={PAD.left - 8} y={tick.y + 4} textAnchor="end">
                {format(Math.round(tick.v))}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % geometry.every === 0 ? (
              <text
                key={p.key}
                className="timeline__axis"
                x={geometry.x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
              >
                {p.label}
              </text>
            ) : null
          )}
          <path className="timeline__area" d={geometry.area} />
          <path className="timeline__line" d={geometry.line} />
          {active && hover !== null && (
            <g>
              <line
                className="timeline__cross"
                x1={geometry.x(hover)}
                x2={geometry.x(hover)}
                y1={PAD.top}
                y2={PAD.top + geometry.innerH}
              />
              <circle
                className="timeline__dot"
                cx={geometry.x(hover)}
                cy={geometry.y(active.value)}
                r={5}
              />
            </g>
          )}
          <rect
            x={PAD.left - 6}
            y={0}
            width={Math.max(0, geometry.innerW + 12)}
            height={HEIGHT}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {active && hover !== null && (
        <div
          className="timeline__tooltip"
          style={{
            left: Math.min(Math.max(geometry.x(hover), 80), width - 80),
            top: Math.max(geometry.y(active.value) - 64, 0),
          }}
        >
          <span>{active.tooltip}</span>
          <strong>
            {format(active.value)} {valueLabel.toLowerCase()}
          </strong>
        </div>
      )}
    </div>
  );
}

export interface BarRow {
  key: string;
  label: React.ReactNode;
  value: number;
  detail?: string;
}

// A ranked list: label, a thin bar for the share of the largest, and the number.
export function BarList({
  rows,
  empty,
  limit = 8,
  moreLabel,
  lessLabel,
}: {
  rows: BarRow[];
  empty: string;
  limit?: number;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return <p className="bar-list__empty">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const shown = open ? rows : rows.slice(0, limit);
  return (
    <>
      <ol className="bar-list">
        {shown.map((row) => (
          <li key={row.key} className="bar-list__row" title={row.detail}>
            <span className="bar-list__label">{row.label}</span>
            <span className="bar-list__value tabular">
              {row.value.toLocaleString(i18n.language || undefined)}
            </span>
            <span className="bar-list__track" aria-hidden="true">
              <span className="bar-list__bar" style={{ width: `${(row.value / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ol>
      {rows.length > limit && moreLabel && lessLabel && (
        <button type="button" className="bar-list__more" onClick={() => setOpen((v) => !v)}>
          {open ? lessLabel : moreLabel}
        </button>
      )}
    </>
  );
}

// Weekday × hour, one hue from light to dark for how many pages were seen.
export function Heatmap({
  grid,
  days,
  format,
}: {
  grid: number[][];
  days: string[];
  format: (day: string, hour: number, value: number) => string;
}) {
  const max = Math.max(1, ...grid.flat());
  const [focus, setFocus] = useState<string>('');
  useEffect(() => setFocus(''), [grid]);
  return (
    <div className="heatmap">
      <div className="heatmap__grid" role="table">
        {grid.map((row, d) => (
          <div key={days[d]} className="heatmap__row" role="row">
            <span className="heatmap__day" role="rowheader">
              {days[d]}
            </span>
            {row.map((value, h) => (
              <span
                key={h}
                role="cell"
                className="heatmap__cell"
                style={
                  { '--level': value ? 0.12 + (value / max) * 0.88 : 0 } as React.CSSProperties
                }
                title={format(days[d], h, value)}
                onPointerEnter={() => setFocus(format(days[d], h, value))}
                onPointerLeave={() => setFocus('')}
              />
            ))}
          </div>
        ))}
        <div className="heatmap__row heatmap__row--hours" aria-hidden="true">
          <span className="heatmap__day" />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="heatmap__hour">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
        </div>
      </div>
      <p className="heatmap__focus" aria-live="polite">
        {focus || ' '}
      </p>
    </div>
  );
}
