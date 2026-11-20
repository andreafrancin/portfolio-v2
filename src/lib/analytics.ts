// Anonymous, cookie-free visit counting. Nothing is stored on the visitor's device: the backend
// recognises a visitor only within one day, from a code it cannot trace back to them.

export type AnalyticsEvent =
  | 'contact_start'
  | 'contact_sent'
  | 'copy_email'
  | 'email_click'
  | 'instagram_click'
  | 'linkedin_click'
  | 'lightbox_open'
  | 'filter_category'
  | 'services_group'
  | 'suggested_click';

// Sent as text/plain so the browser needs no extra CORS round trip. The backend works out the
// country itself and keeps no IP address.
const ENDPOINT = `${__API_BASE_URL__}v/`;

const PRIVATE_PATH = /^\/(private|login)(\/|$)/;

interface CurrentPage {
  id: Promise<number | null>;
  // Known once the backend answers; a page being closed cannot wait for a promise.
  resolvedId: number | null;
  visibleMs: number;
  visibleSince: number | null;
  maxScroll: number;
}

let current: CurrentPage | null = null;
let firstPage = true;
let listening = false;

function isSignedIn(): boolean {
  try {
    return !!localStorage.getItem('access_token');
  } catch {
    return false;
  }
}

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

// Visits from the studio itself, from signed-in sessions and from people who asked not to be
// measured are never counted.
function shouldTrack(path = window.location.pathname): boolean {
  return !PRIVATE_PATH.test(path) && !isSignedIn() && !optedOut();
}

function send(body: object): void {
  const payload = JSON.stringify(body);
  if (navigator.sendBeacon?.(ENDPOINT, new Blob([payload], { type: 'text/plain' }))) return;
  fetch(ENDPOINT, { method: 'POST', body: payload, keepalive: true }).catch(() => undefined);
}

function scrollPercent(): number {
  const doc = document.documentElement;
  const seen = window.scrollY + window.innerHeight;
  return doc.scrollHeight > 0 ? Math.min(100, Math.round((seen / doc.scrollHeight) * 100)) : 100;
}

function visibleTime(page: CurrentPage): number {
  return page.visibleMs + (page.visibleSince !== null ? Date.now() - page.visibleSince : 0);
}

// Report how long the page was really in view and how far down it was read.
// `stillOnScreen` is true when the page is being closed or hidden, so its scroll can still be read.
function reportLeave(page: CurrentPage | null, stillOnScreen = false): void {
  if (!page) return;
  const duration = visibleTime(page);
  const scroll = Math.max(page.maxScroll, stillOnScreen ? scrollPercent() : 0);
  if (page.resolvedId) {
    send({ t: 'leave', id: page.resolvedId, duration, scroll });
    return;
  }
  page.id.then((id) => {
    if (id) send({ t: 'leave', id, duration, scroll });
  });
}

function listen(): void {
  if (listening) return;
  listening = true;

  window.addEventListener(
    'scroll',
    () => {
      if (current) current.maxScroll = Math.max(current.maxScroll, scrollPercent());
    },
    { passive: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (!current) return;
    if (document.visibilityState === 'hidden') {
      current.visibleMs = visibleTime(current);
      current.visibleSince = null;
      reportLeave(current, true);
    } else {
      current.visibleSince = Date.now();
    }
  });

  window.addEventListener('pagehide', () => reportLeave(current, true));

  // Clicks that leave the site towards Andrea: Instagram, LinkedIn and email links, wherever they are.
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a');
      const href = link?.getAttribute('href') || '';
      if (href.startsWith('mailto:')) trackEvent('email_click');
      else if (href.includes('instagram.com')) trackEvent('instagram_click');
      else if (href.includes('linkedin.com')) trackEvent('linkedin_click');
    },
    true
  );
}

export function trackPageview(path: string, language: string): void {
  if (!shouldTrack(path.split('?')[0])) {
    reportLeave(current);
    current = null;
    return;
  }
  listen();
  reportLeave(current);

  const params = new URLSearchParams(window.location.search);
  const body = {
    t: 'pageview',
    path,
    language,
    referrer: firstPage ? document.referrer : '',
    utm_source: params.get('utm_source') || params.get('ref') || '',
    utm_campaign: params.get('utm_campaign') || '',
  };
  firstPage = false;

  const id = fetch(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then((response) => (response.status === 201 ? response.json() : null))
    .then((data) => (data && typeof data.id === 'number' ? data.id : null))
    .catch(() => null);

  const page: CurrentPage = {
    id,
    resolvedId: null,
    visibleMs: 0,
    visibleSince: document.visibilityState === 'visible' ? Date.now() : null,
    maxScroll: 0,
  };
  current = page;
  id.then((value) => {
    page.resolvedId = value;
  });
  // Measure once the content has loaded: a short page is read whole without any scrolling.
  window.setTimeout(() => {
    if (current === page) page.maxScroll = Math.max(page.maxScroll, scrollPercent());
  }, 1500);
}

export function trackEvent(name: AnalyticsEvent, value = ''): void {
  if (!shouldTrack()) return;
  send({ t: 'event', name, value, path: window.location.pathname });
}
