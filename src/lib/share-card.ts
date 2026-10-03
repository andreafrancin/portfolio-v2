import { MEDIA_HOST } from '../config/site';
import logoUrl from '../assets/images/logo/logo-document.png';

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
  const titleSize = story ? 54 : 44;
  const metaSize = story ? 28 : 24;
  const siteSize = story ? 36 : 30;
  await Promise.all([
    document.fonts.load(`600 ${titleSize}px Inter`),
    document.fonts.load(`600 ${metaSize}px Inter`),
    document.fonts.load(`500 ${siteSize}px Inter`),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  paintBackground(ctx, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const [logo, img] = await Promise.all([
    loadImage(logoUrl).catch(() => null),
    input.imageUrl ? loadImage(sameOriginImage(input.imageUrl)).catch(() => null) : null,
  ]);

  const logoWidth = story ? 470 : 340;
  const logoSize = logo
    ? { w: logoWidth, h: Math.round((logo.height / logo.width) * logoWidth) }
    : null;
  const maxImage = story ? { w: 900, h: 860 } : { w: 900, h: 720 };
  const imageSize = img
    ? (() => {
        const scale = Math.min(maxImage.w / img.width, maxImage.h / img.height);
        return { w: Math.round(img.width * scale), h: Math.round(img.height * scale) };
      })()
    : null;

  ctx.font = `600 ${titleSize}px Inter, sans-serif`;
  const titleLine = Math.round(titleSize * 1.25);
  const lines = wrapLines(ctx, input.title, width - 180, 2);

  const gap = story
    ? { image: 60, title: 96, meta: 52, site: 72 }
    : { image: 34, title: 70, meta: 40, site: 54 };
  const hasMeta = input.categories.length > 0;
  const total =
    (logoSize ? logoSize.h : 0) +
    (imageSize ? gap.image + imageSize.h : 0) +
    gap.title +
    titleLine * (lines.length - 1) +
    (hasMeta ? gap.meta : 0) +
    gap.site;
  const safeTop = story ? 250 : 50;
  const safeBottom = story ? height - 250 : height - 50;
  let y = safeTop + Math.max(0, (safeBottom - safeTop - total) / 2);

  if (logo && logoSize) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(
      logo,
      Math.round((width - logoSize.w) / 2),
      Math.round(y),
      logoSize.w,
      logoSize.h
    );
    ctx.restore();
    y += logoSize.h;
  }

  if (img && imageSize) {
    y += gap.image;
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

  y += gap.title;
  ctx.fillStyle = INK;
  ctx.font = `600 ${titleSize}px Inter, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, width / 2, y + i * titleLine));
  y += titleLine * (lines.length - 1);

  if (hasMeta) {
    y += gap.meta;
    ctx.fillStyle = MUTED;
    ctx.font = `600 ${metaSize}px Inter, sans-serif`;
    const label = input.categories.join('  ·  ').toUpperCase();
    ctx.fillText(label.split('').join('\u200A'), width / 2, y);
  }

  y += gap.site;
  ctx.fillStyle = ACCENT;
  ctx.font = `500 ${siteSize}px Inter, sans-serif`;
  ctx.fillText(input.site, width / 2, y);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('empty'))), 'image/jpeg', 0.92)
  );
}
