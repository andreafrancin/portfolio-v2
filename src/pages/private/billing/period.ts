export type PeriodPreset = 'month' | 'quarter' | 'year' | 'last-year' | 'all' | 'custom';

// A preset, or a specific past year written as "year-2024".
export type PeriodChoice = PeriodPreset | `year-${number}`;

export interface Period {
  choice: PeriodChoice;
  from: string;
  to: string;
}

export const PERIOD_PRESETS: PeriodPreset[] = ['month', 'quarter', 'year', 'last-year', 'all'];

export const DEFAULT_PERIOD: Period = { choice: 'year', from: '', to: '' };

const pad = (n: number) => String(n).padStart(2, '0');

// Dates are compared as YYYY-MM-DD text, so "-31" safely closes any month.
export function periodRange(period: Period, today = new Date()): { from: string; to: string } {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const choice = period.choice;

  if (choice === 'month') {
    return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-31` };
  }
  if (choice === 'quarter') {
    const first = Math.floor((month - 1) / 3) * 3 + 1;
    return { from: `${year}-${pad(first)}-01`, to: `${year}-${pad(first + 2)}-31` };
  }
  if (choice === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (choice === 'last-year') return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  if (choice === 'custom') return { from: period.from, to: period.to };
  if (choice.startsWith('year-')) {
    const y = choice.slice(5);
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  return { from: '', to: '' };
}

export function inPeriod(date: string, range: { from: string; to: string }): boolean {
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

const storageKey = (kind: string) => `af.billing.period.${kind}`;

function isChoice(value: unknown): value is PeriodChoice {
  return (
    typeof value === 'string' &&
    ([...PERIOD_PRESETS, 'custom'].includes(value) || /^year-\d{4}$/.test(value))
  );
}

export function loadPeriod(kind: string): Period {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(kind)) || 'null');
    if (saved && isChoice(saved.choice)) {
      return {
        choice: saved.choice,
        from: typeof saved.from === 'string' ? saved.from : '',
        to: typeof saved.to === 'string' ? saved.to : '',
      };
    }
  } catch {
    // Storage can be unavailable; the default period is fine.
  }
  return DEFAULT_PERIOD;
}

export function savePeriod(kind: string, period: Period): void {
  try {
    localStorage.setItem(storageKey(kind), JSON.stringify(period));
  } catch {
    // Remembering the period is only a convenience.
  }
}
