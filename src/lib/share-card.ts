import { MEDIA_HOST } from '../config/site';

export type CardFormat = 'story' | 'post';

const SIZES: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1350 },
};

const INK = '#141516';
const MUTED = '#6d6673';
const ACCENT = '#bc0e4d';

export function sameOriginImage(url: string): string {
  try {
    const u = new URL(url);
    if (u.host === MEDIA_HOST) return `/media${u.pathname}`;
  } catch {}
  return url;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.includes(' ')) {
      last = last.slice(0, last.lastIndexOf(' '));
    }
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function paintBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const glows: [number, number, number, string][] = [
    [width * 0.1, height * 0.04, width * 0.75, 'rgba(251, 211, 225, 0.75)'],
    [width * 0.95, height * 0.55, width * 0.7, 'rgba(221, 222, 255, 0.7)'],
    [width * 0.3, height * 1.02, width * 0.7, 'rgba(214, 240, 230, 0.6)'],
  ];
  for (const [x, y, r, color] of glows) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
}

export interface CardInput {
  title: string;
  categories: string[];
  imageUrl: string | null;
  site: string;
}

export async function renderShareCard(format: CardFormat, input: CardInput): Promise<Blob> {
  const { width, height } = SIZES[format];
  const story = format === 'story';
  await Promise.all([
    document.fonts.load(`${story ? 92 : 78}px Gloss`),
    document.fonts.load('500 36px Inter'),
    document.fonts.load('600 30px Inter'),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  paintBackground(ctx, width, height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  let img: HTMLImageElement | null = null;
  if (input.imageUrl) {
    try {
      img = await loadImage(sameOriginImage(input.imageUrl));
    } catch {
      img = null;
    }
  }

  const brandSize = story ? 64 : 52;
  const titleSize = story ? 92 : 78;
  const titleLine = titleSize * 1.18;
  const metaSize = story ? 30 : 26;
  const siteSize = story ? 38 : 32;
  const maxImage = story ? { w: 900, h: 980 } : { w: 860, h: 720 };
  const imageSize = img
    ? (() => {
        const scale = Math.min(maxImage.w / img.width, maxImage.h / img.height);
        return { w: Math.round(img.width * scale), h: Math.round(img.height * scale) };
      })()
    : null;

  ctx.font = `${titleSize}px Gloss, cursive`;
  const lines = wrapLines(ctx, input.title, width - 160, 2);

  const gaps = story
    ? { brand: 70, title: 140, meta: 96, site: 104 }
    : { brand: 50, title: 115, meta: 80, site: 84 };
  const total =
    brandSize +
    gaps.brand +
    (imageSize ? imageSize.h : 0) +
    gaps.title +
    titleLine * (lines.length - 1) +
    (input.categories.length ? gaps.meta : 0) +
    gaps.site;
  const safeTop = story ? 260 : 60;
  const safeBottom = story ? height - 260 : height - 50;
  let y = safeTop + Math.max(0, (safeBottom - safeTop - total) / 2) + brandSize;

  ctx.fillStyle = INK;
  ctx.font = `${brandSize}px Gloss, cursive`;
  ctx.fillText('Andrea Francín', width / 2, y);
  y += gaps.brand;

  if (img && imageSize) {
    const x = Math.round((width - imageSize.w) / 2);
    const top = Math.round(y);
    ctx.save();
    ctx.shadowColor = 'rgba(70, 25, 50, 0.28)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 26;
    roundedRect(ctx, x, top, imageSize.w, imageSize.h, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundedRect(ctx, x, top, imageSize.w, imageSize.h, 28);
    ctx.clip();
    ctx.drawImage(img, x, top, imageSize.w, imageSize.h);
    ctx.restore();
    y += imageSize.h;
  }

  y += gaps.title;
  ctx.fillStyle = INK;
  ctx.font = `${titleSize}px Gloss, cursive`;
  lines.forEach((line, i) => ctx.fillText(line, width / 2, y + i * titleLine));
  y += titleLine * (lines.length - 1);

  if (input.categories.length) {
    y += gaps.meta;
    ctx.fillStyle = MUTED;
    ctx.font = `600 ${metaSize}px Inter, sans-serif`;
    const label = input.categories.join('  ·  ').toUpperCase();
    ctx.fillText(label.split('').join('\u200A'), width / 2, y);
  }

  y += gaps.site;
  ctx.fillStyle = ACCENT;
  ctx.font = `500 ${siteSize}px Inter, sans-serif`;
  ctx.fillText(input.site, width / 2, y);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('empty'))), 'image/jpeg', 0.92)
  );
}
