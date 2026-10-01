export type RichColor = 'pink' | 'black';

export interface Run {
  text: string;
  bold?: boolean;
  color?: RichColor;
}

const TAG = /\[(\/?)(b|n|pink|black)\]/g;

export function parseRich(src: string): Run[] {
  const runs: Run[] = [];
  const weight: boolean[] = [];
  const color: RichColor[] = [];
  let last = 0;
  const push = (text: string) => {
    if (!text) return;
    runs.push({ text, bold: weight[weight.length - 1], color: color[color.length - 1] });
  };
  const text = src || '';
  const tag = new RegExp(TAG.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = tag.exec(text))) {
    push(text.slice(last, m.index));
    last = m.index + m[0].length;
    const [, closing, name] = m;
    const stack: unknown[] = name === 'b' || name === 'n' ? weight : color;
    if (closing) stack.pop();
    else if (name === 'b' || name === 'n') weight.push(name === 'b');
    else color.push(name as RichColor);
  }
  push(text.slice(last));
  return normalizeRuns(runs);
}

export function serializeRich(runs: Run[]): string {
  return normalizeRuns(runs)
    .map(({ text, bold, color }) => {
      let s = text;
      if (bold !== undefined) s = bold ? `[b]${s}[/b]` : `[n]${s}[/n]`;
      if (color) s = `[${color}]${s}[/${color}]`;
      return s;
    })
    .join('');
}

export const plainText = (src: string) => (src || '').replace(TAG, '');

export const hasFormatting = (src: string) => /\[\/?(b|n|pink|black)\]/.test(src || '');

export function normalizeRuns(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const prev = out[out.length - 1];
    if (prev && prev.bold === r.bold && prev.color === r.color) prev.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

export function splitLines(runs: Run[]): Run[][] {
  const lines: Run[][] = [[]];
  for (const r of runs) {
    r.text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ ...r, text: part });
    });
  }
  return lines;
}

export const runsText = (runs: Run[]) => runs.map((r) => r.text).join('');

export function trimRuns(runs: Run[]): Run[] {
  const out = runs.map((r) => ({ ...r }));
  while (out.length && !out[0].text.replace(/^\s+/, '')) out.shift();
  if (out.length) out[0].text = out[0].text.replace(/^\s+/, '');
  while (out.length && !out[out.length - 1].text.replace(/\s+$/, '')) out.pop();
  if (out.length) out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '');
  return out;
}

export function applyStyle(
  runs: Run[],
  start: number,
  end: number,
  patch: { bold?: boolean | null; color?: RichColor | null }
): Run[] {
  const out: Run[] = [];
  let pos = 0;
  for (const r of runs) {
    const a = pos;
    const b = pos + r.text.length;
    pos = b;
    if (b <= start || a >= end) {
      out.push(r);
      continue;
    }
    const from = Math.max(start, a) - a;
    const to = Math.min(end, b) - a;
    if (from > 0) out.push({ ...r, text: r.text.slice(0, from) });
    const mid: Run = { ...r, text: r.text.slice(from, to) };
    if (patch.bold !== undefined) mid.bold = patch.bold ?? undefined;
    if (patch.color !== undefined) mid.color = patch.color ?? undefined;
    out.push(mid);
    if (to < r.text.length) out.push({ ...r, text: r.text.slice(to) });
  }
  return normalizeRuns(out);
}

export function runsIn(runs: Run[], start: number, end: number): Run[] {
  const out: Run[] = [];
  let pos = 0;
  for (const r of runs) {
    const a = pos;
    const b = pos + r.text.length;
    pos = b;
    if (b > start && a < end) out.push(r);
  }
  return out;
}
