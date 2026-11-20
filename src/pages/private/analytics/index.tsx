import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../context/lang-context';
import type { AnalyticsReport, DailyPoint, Totals } from '../../../services/analytics/api-request';
import {
  fetchAnalyticsReport,
  fetchAnalyticsSettings,
  saveAnalyticsSettings,
} from '../../../services/analytics/api-request';
import { useToast } from '../../../components/toast';
import { IconEdit } from '../../../components/icons';
import { CountriesInfo, GeoCredit, InfoButton, SourcesInfo } from './info';
import { CustomizeDialog, SECTIONS } from './customize';
import type { SectionKey } from './customize';
import {
  getCategory,
  loadCategories,
  useCategories,
  useCategoryLabel,
} from '../../../config/categories';
import { BarList, Heatmap, Timeline } from './charts';
import type { BarRow, TimelinePoint } from './charts';
import './index.scss';

const PERIODS = [
  { key: 'today', days: 1 },
  { key: '7', days: 7 },
  { key: '30', days: 30 },
  { key: '90', days: 90 },
  { key: '365', days: 365 },
] as const;
type PeriodKey = (typeof PERIODS)[number]['key'];

type Metric = 'visitors' | 'sessions' | 'pageviews';
const METRICS: Metric[] = ['visitors', 'sessions', 'pageviews'];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function rangeOf(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

function duration(ms: number): string {
  if (!ms) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

function flag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// Days, ISO weeks starting on Monday, or months, depending on how long the period is.
function bucket(daily: DailyPoint[], metric: Metric, lang: string): TimelinePoint[] {
  const days = daily.length;
  const unit = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month';
  const short = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });
  const long = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const monthName = new Intl.DateTimeFormat(lang, { month: 'short', year: '2-digit' });
  const monthLong = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
  const groups = new Map<string, { start: Date; end: Date; value: number }>();
  daily.forEach((point) => {
    const date = new Date(`${point.day}T12:00:00`);
    let key = point.day;
    if (unit === 'week') {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      key = iso(monday);
    } else if (unit === 'month') {
      key = point.day.slice(0, 7);
    }
    const group = groups.get(key) || { start: date, end: date, value: 0 };
    group.end = date;
    group.value += point[metric];
    groups.set(key, group);
  });
  return [...groups.entries()].map(([key, g]) => ({
    key,
    value: g.value,
    label: unit === 'month' ? monthName.format(g.start) : short.format(g.start),
    tooltip:
      unit === 'day'
        ? long.format(g.start)
        : unit === 'week'
          ? `${short.format(g.start)} – ${short.format(g.end)}`
          : monthLong.format(g.start),
  }));
}

function Delta({
  now,
  before,
  inverse = false,
}: {
  now: number;
  before: number;
  inverse?: boolean;
}) {
  const { t } = useTranslation();
  if (!before && !now) return <span className="kpi__delta">—</span>;
  if (!before) return <span className="kpi__delta">{t('ANALYTICS.NEW')}</span>;
  const change = (now - before) / before;
  const better = inverse ? change < 0 : change > 0;
  const sign = change > 0 ? '▲' : change < 0 ? '▼' : '';
  return (
    <span className={`kpi__delta${change && better ? ' is-better' : ''}`}>
      {sign} {Math.abs(Math.round(change * 100))} %{' '}
      <span className="kpi__delta-note">{t('ANALYTICS.VS_PREVIOUS')}</span>
    </span>
  );
}

const HiddenSections = createContext<SectionKey[]>([]);

function Card({
  section,
  title,
  hint,
  info,
  children,
  wide = false,
}: {
  section: SectionKey;
  title: string;
  hint?: string;
  info?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { t } = useTranslation();
  if (useContext(HiddenSections).includes(section)) return null;
  return (
    <section className={`stats-card${wide ? ' stats-card--wide' : ''}`}>
      <header className="stats-card__head">
        <h2 className="stats-card__title">
          {title}
          {info && <InfoButton label={t('ANALYTICS.INFO_LABEL', { title })}>{info}</InfoButton>}
        </h2>
        {hint && <p className="stats-card__hint">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

// Placeholders shaped like the real content, shown until the first data arrives.
function BarsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bars-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bars-skeleton__row">
          <span className="skeleton bars-skeleton__label" style={{ width: `${70 - i * 9}%` }} />
          <span className="skeleton bars-skeleton__value" />
          <span className="skeleton bars-skeleton__bar" style={{ width: `${100 - i * 17}%` }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="table-skeleton__row">
          <span className="skeleton table-skeleton__name" style={{ width: `${55 - i * 5}%` }} />
          {Array.from({ length: 5 }, (_, j) => (
            <span key={j} className="skeleton table-skeleton__cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="stats__grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <section key={i} className="stats-card">
          <span className="skeleton card-skeleton__title" />
          <span className="skeleton card-skeleton__hint" />
          <BarsSkeleton rows={i % 2 ? 4 : 5} />
        </section>
      ))}
    </div>
  );
}

function AnalyticsPage() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [period, setPeriod] = useState<PeriodKey>('30');
  const [metric, setMetric] = useState<Metric>('visitors');
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState(false);
  const [hidden, setHidden] = useState<SectionKey[]>([]);
  const [customizing, setCustomizing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAnalyticsSettings()
      .then((data) => setHidden(data.hidden_sections as SectionKey[]))
      .catch(() => undefined);
  }, []);

  const saveHidden = async (next: SectionKey[]) => {
    try {
      const data = await saveAnalyticsSettings(next);
      setHidden(data.hidden_sections as SectionKey[]);
      setCustomizing(false);
      toast.success(t('ANALYTICS.CUSTOMIZE_SAVED'));
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    }
  };
  useCategories();
  const categoryLabel = useCategoryLabel();

  useEffect(() => {
    loadCategories();
  }, []);

  // `quiet` is the background refresh of the live count: it doesn't dim the page.
  const load = useCallback(async (key: PeriodKey, quiet = false) => {
    setFailed(false);
    if (!quiet) setLoading(true);
    const days = PERIODS.find((p) => p.key === key)?.days || 30;
    const { from, to } = rangeOf(days);
    try {
      setReport(await fetchAnalyticsReport(from, to));
    } catch {
      setFailed(true);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  // The live count refreshes every minute while the page is open.
  useEffect(() => {
    const timer = window.setInterval(() => load(period, true), 60_000);
    return () => window.clearInterval(timer);
  }, [load, period]);

  const countries = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' });
    } catch {
      return null;
    }
  }, [lang]);

  const pageLabel = useCallback(
    (key: string) => {
      const known: Record<string, string> = {
        work: t('ANALYTICS.PAGE_WORK'),
        project: t('ANALYTICS.PAGE_PROJECT'),
        services: t('HEADER.SERVICES'),
        about: t('HEADER.ABOUT'),
        contact: t('HEADER.CONTACT'),
        legal: t('ANALYTICS.PAGE_LEGAL'),
        not_found: t('ANALYTICS.PAGE_NOT_FOUND'),
      };
      return known[key] || key;
    },
    [t]
  );

  if (failed && !report) {
    return (
      <div className="admin-state">
        <p>{t('PRIVATE.LOAD_FAILED')}</p>
        <button type="button" className="btn btn--ghost" onClick={() => load(period)}>
          {t('PRIVATE.RETRY')}
        </button>
      </div>
    );
  }

  const totals: Totals | undefined = report?.totals;
  const previous = report?.previous;
  const empty = !!report && report.totals.pageviews === 0;
  const visitorsOf = (v: number, views: number) =>
    t('ANALYTICS.VISITORS_VIEWS', { visitors: v, views });
  const groupRows = (
    rows: { key: string; visitors: number; views: number }[],
    label = (k: string) => k as React.ReactNode
  ): BarRow[] =>
    rows.map((r) => ({
      key: r.key,
      label: label(r.key),
      value: r.visitors,
      detail: visitorsOf(r.visitors, r.views),
    }));
  const funnel = report?.funnel;
  const conversion = funnel && funnel.contact_visitors ? funnel.sent / funnel.contact_visitors : 0;
  const weekdays = Array.from({ length: 7 }, (_, d) =>
    new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2024, 0, 1 + d))
  );

  const allHidden = hidden.length === SECTIONS.length;

  return (
    <HiddenSections.Provider value={hidden}>
      <div className={`stats${loading && report ? ' is-refreshing' : ''}`} aria-busy={loading}>
        <div className="stats__toolbar">
          <div className="stats__periods" role="group" aria-label={t('ANALYTICS.PERIOD')}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className="ledger-chip"
                aria-pressed={period === p.key}
                onClick={() => setPeriod(p.key)}
              >
                {t(`ANALYTICS.PERIOD_${p.key}`)}
              </button>
            ))}
          </div>
          <div className="stats__tools">
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={() => setCustomizing(true)}
            >
              <IconEdit size={16} /> {t('ANALYTICS.CUSTOMIZE')}
            </button>
            <p className="stats__live" aria-live="polite">
              <span className="stats__live-dot" aria-hidden="true" />
              {report ? (
                t('ANALYTICS.LIVE', { count: report.live })
              ) : (
                <span className="skeleton stats__live-skeleton" aria-hidden="true" />
              )}
            </p>
          </div>
        </div>

        {empty && <div className="billing-notice stats__empty">{t('ANALYTICS.EMPTY')}</div>}

        {!hidden.includes('kpis') && (
          <div className="kpis">
            {(
              [
                ['visitors', t('ANALYTICS.VISITORS'), (v: number) => v.toLocaleString(lang), false],
                ['sessions', t('ANALYTICS.SESSIONS'), (v: number) => v.toLocaleString(lang), false],
                [
                  'pageviews',
                  t('ANALYTICS.PAGEVIEWS'),
                  (v: number) => v.toLocaleString(lang),
                  false,
                ],
                ['avg_duration_ms', t('ANALYTICS.AVG_TIME'), duration, false],
                ['bounce_rate', t('ANALYTICS.BOUNCE'), percent, true],
                ['messages', t('ANALYTICS.MESSAGES'), (v: number) => v.toLocaleString(lang), false],
              ] as const
            ).map(([key, label, format, inverse]) => (
              <div key={key} className="kpi">
                <p className="kpi__label">{label}</p>
                {totals ? (
                  <p className="kpi__value tabular">{format(totals[key])}</p>
                ) : (
                  <>
                    <span className="skeleton kpi__skeleton-value" />
                    <span className="skeleton kpi__skeleton-delta" />
                  </>
                )}
                {totals && previous && (
                  <Delta now={totals[key]} before={previous[key]} inverse={inverse} />
                )}
              </div>
            ))}
          </div>
        )}

        <Card
          section="timeline"
          title={t('ANALYTICS.OVER_TIME')}
          hint={t('ANALYTICS.OVER_TIME_HINT')}
          wide
        >
          <div className="stats__metrics" role="group" aria-label={t('ANALYTICS.METRIC')}>
            {METRICS.map((m) => (
              <button
                key={m}
                type="button"
                className="ledger-chip"
                aria-pressed={metric === m}
                onClick={() => setMetric(m)}
              >
                {t(`ANALYTICS.${m.toUpperCase()}`)}
              </button>
            ))}
          </div>
          {report ? (
            <Timeline
              points={bucket(report.daily, metric, lang)}
              valueLabel={t(`ANALYTICS.${metric.toUpperCase()}`)}
            />
          ) : (
            <div className="skeleton" style={{ height: 240 }} />
          )}
        </Card>

        <Card
          section="projects"
          title={t('ANALYTICS.PROJECTS')}
          hint={t('ANALYTICS.PROJECTS_HINT')}
          wide
        >
          {!report ? (
            <TableSkeleton />
          ) : report.projects.length ? (
            <div className="stats-table__wrap">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>{t('ANALYTICS.PROJECT')}</th>
                    <th className="num">{t('ANALYTICS.VISITORS')}</th>
                    <th className="num">{t('ANALYTICS.PAGEVIEWS')}</th>
                    <th className="num">{t('ANALYTICS.READING_TIME')}</th>
                    <th className="num">{t('ANALYTICS.READ_THROUGH')}</th>
                    <th className="num">{t('ANALYTICS.IMAGES_OPENED')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(allProjects ? report.projects : report.projects.slice(0, 10)).map((p, i) => {
                    const max = report.projects[0].visitors || 1;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="stats-table__rank tabular">{i + 1}</span>
                          <Link to={`/private/edit-project/${p.id}`} className="stats-table__name">
                            {p.title}
                          </Link>
                          <span className="stats-table__bar" aria-hidden="true">
                            <span style={{ width: `${(p.visitors / max) * 100}%` }} />
                          </span>
                        </td>
                        <td className="num tabular">{p.visitors.toLocaleString(lang)}</td>
                        <td className="num tabular">{p.views.toLocaleString(lang)}</td>
                        <td className="num tabular">{duration(p.avg_duration_ms)}</td>
                        <td className="num tabular">
                          {p.read_through === null ? '—' : percent(p.read_through)}
                        </td>
                        <td className="num tabular">{p.images_opened.toLocaleString(lang)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {report.projects.length > 10 && (
                <button
                  type="button"
                  className="bar-list__more"
                  onClick={() => setAllProjects((v) => !v)}
                >
                  {allProjects
                    ? t('ANALYTICS.SHOW_LESS')
                    : t('ANALYTICS.SHOW_ALL_COUNT', { count: report.projects.length })}
                </button>
              )}
            </div>
          ) : (
            <p className="bar-list__empty">{t('ANALYTICS.NO_DATA')}</p>
          )}
        </Card>

        {!report ? (
          <GridSkeleton />
        ) : (
          <div className="stats__grid">
            <Card section="pages" title={t('ANALYTICS.PAGES')} hint={t('ANALYTICS.PAGES_HINT')}>
              <BarList rows={groupRows(report.pages, pageLabel)} empty={t('ANALYTICS.NO_DATA')} />
            </Card>

            <Card
              section="sources"
              title={t('ANALYTICS.SOURCES')}
              hint={t('ANALYTICS.SOURCES_HINT')}
              info={<SourcesInfo />}
            >
              <BarList
                rows={groupRows(report.sources, (k) =>
                  k === 'Direct' ? t('ANALYTICS.DIRECT') : k
                )}
                empty={t('ANALYTICS.NO_DATA')}
                moreLabel={t('ANALYTICS.SHOW_ALL')}
                lessLabel={t('ANALYTICS.SHOW_LESS')}
              />
              {report.referrers.length > 0 && (
                <>
                  <h3 className="stats-card__sub">{t('ANALYTICS.REFERRERS')}</h3>
                  <BarList
                    rows={groupRows(report.referrers)}
                    empty=""
                    limit={5}
                    moreLabel={t('ANALYTICS.SHOW_ALL')}
                    lessLabel={t('ANALYTICS.SHOW_LESS')}
                  />
                </>
              )}
              {report.campaigns.length > 0 && (
                <>
                  <h3 className="stats-card__sub">{t('ANALYTICS.CAMPAIGNS')}</h3>
                  <BarList rows={groupRows(report.campaigns)} empty="" limit={5} />
                </>
              )}
            </Card>

            <Card
              section="contact"
              title={t('ANALYTICS.CONTACT')}
              hint={t('ANALYTICS.CONTACT_HINT')}
            >
              {funnel && (
                <ol className="funnel">
                  {(
                    [
                      ['contact_visitors', t('ANALYTICS.FUNNEL_VISITED')],
                      ['started', t('ANALYTICS.FUNNEL_STARTED')],
                      ['sent', t('ANALYTICS.FUNNEL_SENT')],
                    ] as const
                  ).map(([key, label]) => (
                    <li key={key} className="funnel__step">
                      <span className="funnel__label">{label}</span>
                      <span className="funnel__value tabular">
                        {funnel[key].toLocaleString(lang)}
                      </span>
                      <span className="bar-list__track" aria-hidden="true">
                        <span
                          className="bar-list__bar"
                          style={{
                            width: `${funnel.contact_visitors ? (funnel[key] / funnel.contact_visitors) * 100 : 0}%`,
                          }}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="funnel__rate">
                {t('ANALYTICS.CONVERSION')}{' '}
                <strong className="tabular">{percent(conversion)}</strong>
              </p>
              <h3 className="stats-card__sub">{t('ANALYTICS.SERVICES_CHOSEN')}</h3>
              <BarList
                rows={report.services_chosen.map((r) => ({
                  key: r.key,
                  label: r.key,
                  value: r.count,
                }))}
                empty={t('ANALYTICS.NO_DATA')}
                limit={6}
              />
            </Card>

            <Card
              section="countries"
              title={t('ANALYTICS.COUNTRIES')}
              hint={t('ANALYTICS.COUNTRIES_HINT')}
              info={<CountriesInfo />}
            >
              <BarList
                rows={groupRows(report.countries, (code) => (
                  <>
                    <span className="bar-list__flag" aria-hidden="true">
                      {flag(code)}
                    </span>
                    {code === '??' ? t('ANALYTICS.UNKNOWN') : countries?.of(code) || code}
                  </>
                ))}
                empty={t('ANALYTICS.NO_DATA')}
                moreLabel={t('ANALYTICS.SHOW_ALL')}
                lessLabel={t('ANALYTICS.SHOW_LESS')}
              />
            </Card>

            <Card section="devices" title={t('ANALYTICS.DEVICES')}>
              <BarList
                rows={groupRows(report.devices, (k) => t(`ANALYTICS.DEVICE_${k}`))}
                empty={t('ANALYTICS.NO_DATA')}
              />
              <h3 className="stats-card__sub">{t('ANALYTICS.LANGUAGES')}</h3>
              <BarList
                rows={groupRows(report.languages, (k) => t(`ANALYTICS.LANG_${k}`))}
                empty={t('ANALYTICS.NO_DATA')}
              />
            </Card>

            <Card section="clicks" title={t('ANALYTICS.CLICKS')} hint={t('ANALYTICS.CLICKS_HINT')}>
              <BarList
                rows={[
                  ...report.outbound.map((r) => ({
                    key: r.key,
                    label: t(`ANALYTICS.OUT_${r.key}`),
                    value: r.count,
                  })),
                  ...(report.suggested_clicks
                    ? [
                        {
                          key: 'suggested',
                          label: t('ANALYTICS.SUGGESTED'),
                          value: report.suggested_clicks,
                        },
                      ]
                    : []),
                ]}
                empty={t('ANALYTICS.NO_DATA')}
              />
            </Card>

            <Card
              section="interest"
              title={t('ANALYTICS.INTEREST')}
              hint={t('ANALYTICS.INTEREST_HINT')}
            >
              <h3 className="stats-card__sub stats-card__sub--first">
                {t('ANALYTICS.CATEGORIES')}
              </h3>
              <BarList
                rows={report.categories.map((r) => {
                  const category = getCategory(r.key);
                  return {
                    key: r.key,
                    label: category ? categoryLabel(category) : r.key,
                    value: r.count,
                  };
                })}
                empty={t('ANALYTICS.NO_DATA')}
                limit={6}
              />
              <h3 className="stats-card__sub">{t('ANALYTICS.SERVICES_OPENED')}</h3>
              <BarList
                rows={report.services_opened.map((r) => ({
                  key: r.key,
                  label: r.key,
                  value: r.count,
                }))}
                empty={t('ANALYTICS.NO_DATA')}
                limit={6}
              />
            </Card>

            <Card
              section="entry_exit"
              title={t('ANALYTICS.ENTRY_EXIT')}
              hint={t('ANALYTICS.ENTRY_EXIT_HINT')}
            >
              <h3 className="stats-card__sub stats-card__sub--first">{t('ANALYTICS.ENTRY')}</h3>
              <BarList
                rows={groupRows(report.entry_pages, pageLabel)}
                empty={t('ANALYTICS.NO_DATA')}
                limit={5}
              />
              <h3 className="stats-card__sub">{t('ANALYTICS.EXIT')}</h3>
              <BarList
                rows={report.exit_pages.map((r) => ({
                  key: r.key,
                  label: pageLabel(r.key),
                  value: r.sessions,
                }))}
                empty={t('ANALYTICS.NO_DATA')}
                limit={5}
              />
            </Card>

            <Card section="when" title={t('ANALYTICS.WHEN')} hint={t('ANALYTICS.WHEN_HINT')} wide>
              <Heatmap
                grid={report.when}
                days={weekdays}
                format={(day, hour, value) =>
                  t('ANALYTICS.WHEN_CELL', { day, hour: `${hour}:00`, count: value })
                }
              />
            </Card>

            {report.not_found.length > 0 && (
              <Card
                section="not_found"
                title={t('ANALYTICS.NOT_FOUND')}
                hint={t('ANALYTICS.NOT_FOUND_HINT')}
                wide
              >
                <BarList
                  rows={report.not_found.map((r) => ({
                    key: r.key,
                    label: <code>{r.key}</code>,
                    value: r.views,
                  }))}
                  empty=""
                />
              </Card>
            )}
          </div>
        )}
        {allHidden && (
          <div className="billing-notice">
            {t('ANALYTICS.ALL_HIDDEN')}{' '}
            <button type="button" className="text-link" onClick={() => setCustomizing(true)}>
              {t('ANALYTICS.CUSTOMIZE')}
            </button>
          </div>
        )}

        <p className="stats__credit">
          <GeoCredit />
        </p>

        <CustomizeDialog
          open={customizing}
          hidden={hidden}
          onClose={() => setCustomizing(false)}
          onSave={saveHidden}
        />
      </div>
    </HiddenSections.Provider>
  );
}

export default AnalyticsPage;
