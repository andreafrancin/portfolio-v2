import { get, put } from '../../api-client/api-client';

export interface Totals {
  visitors: number;
  sessions: number;
  pageviews: number;
  avg_duration_ms: number;
  bounce_rate: number;
  messages: number;
}

export interface DailyPoint {
  day: string;
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface GroupRow {
  key: string;
  visitors: number;
  views: number;
}

export interface CountRow {
  key: string;
  count: number;
  visitors?: number;
}

export interface ProjectRow {
  id: number;
  title: string;
  visitors: number;
  views: number;
  avg_duration_ms: number;
  avg_scroll: number;
  read_through: number | null;
  images_opened: number;
}

export interface AnalyticsReport {
  range: { from: string; to: string };
  previous_range: { from: string; to: string };
  live: number;
  totals: Totals;
  previous: Totals;
  daily: DailyPoint[];
  pages: GroupRow[];
  entry_pages: GroupRow[];
  exit_pages: { key: string; sessions: number }[];
  not_found: GroupRow[];
  projects: ProjectRow[];
  sources: GroupRow[];
  referrers: GroupRow[];
  campaigns: GroupRow[];
  countries: GroupRow[];
  languages: GroupRow[];
  devices: GroupRow[];
  funnel: { contact_visitors: number; started: number; sent: number };
  services_chosen: CountRow[];
  services_opened: CountRow[];
  categories: CountRow[];
  outbound: CountRow[];
  suggested_clicks: number;
  when: number[][];
}

export const fetchAnalyticsReport = (from: string, to: string): Promise<AnalyticsReport> =>
  get(`analytics/report/?from=${from}&to=${to}`, true);

export interface AnalyticsSettings {
  hidden_sections: string[];
  sections: string[];
}

export const fetchAnalyticsSettings = (): Promise<AnalyticsSettings> =>
  get('analytics/settings/', true);
export const saveAnalyticsSettings = (hidden_sections: string[]): Promise<AnalyticsSettings> =>
  put('analytics/settings/', { hidden_sections }, true);
