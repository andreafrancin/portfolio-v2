import { useEffect, useRef, useState } from 'react';
import type * as PdfJsModule from 'pdfjs-dist';

type PdfJs = typeof PdfJsModule;

// Wide enough to stay sharp on high-density screens at the size the preview is shown.
const RENDER_WIDTH = 1400;

let pdfJs: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfJs ??= import(/* webpackChunkName: "pdfjs" */ 'pdfjs-dist').then((module) => {
    module.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    return module;
  });
  return pdfJs;
}

interface Sheet {
  url: string;
  ratio: number;
}

async function drawPages(blob: Blob): Promise<Sheet[]> {
  const pdfjs = await loadPdfJs();
  const document = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
  const sheets: Sheet[] = [];

  try {
    for (let number = 1; number <= document.numPages; number += 1) {
      const page = await document.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });
      const canvas = window.document.createElement('canvas');

      const context = canvas.getContext('2d');

      if (!context) throw new Error('Canvas is not available');

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvasContext: context, viewport }).promise;

      const image = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (image) {
        sheets.push({ url: URL.createObjectURL(image), ratio: base.width / base.height });
      }
    }
  } finally {
    void document.destroy();
  }

  return sheets;
}

function releaseSheets(sheets: Sheet[]): void {
  sheets.forEach((sheet) => URL.revokeObjectURL(sheet.url));
}

interface Layer {
  key: number;
  sheets: Sheet[];
}

interface Layers {
  current: Layer | null;
  previous: Layer | null;
}

const NO_LAYERS: Layers = { current: null, previous: null };

interface PdfSheetsProps {
  blob: Blob | null;
  title: string;
  onError: () => void;
}

// The PDF is drawn as images instead of shown in the browser's viewer: no grey frame, no flash
// and no jump back to the first page each time the document changes. A new version fades in
// over the previous one.
function PdfSheets({ blob, title, onError }: PdfSheetsProps) {
  const [layers, setLayers] = useState<Layers>(NO_LAYERS);
  const layersRef = useRef<Layers>(NO_LAYERS);
  const counter = useRef(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const showLayers = (next: Layers) => {
    layersRef.current = next;
    setLayers(next);
  };

  useEffect(() => {
    if (!blob) return;
    let cancelled = false;

    drawPages(blob)
      .then((sheets) => {
        if (cancelled) {
          releaseSheets(sheets);
          return;
        }
        const { current, previous } = layersRef.current;
        if (previous) releaseSheets(previous.sheets);
        counter.current += 1;
        showLayers({ current: { key: counter.current, sheets }, previous: current });
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current();
      });

    return () => {
      cancelled = true;
    };
  }, [blob]);

  useEffect(
    () => () => {
      const { current, previous } = layersRef.current;
      [current, previous].forEach((layer) => layer && releaseSheets(layer.sheets));
    },
    []
  );

  // Once the new version has faded in, the old one underneath is no longer needed.
  const dropPrevious = () => {
    const { current, previous } = layersRef.current;
    if (!previous) return;
    releaseSheets(previous.sheets);
    showLayers({ current, previous: null });
  };

  const { current, previous } = layers;

  if (!current) {
    return <div className="pdf-sheets__placeholder skeleton" aria-hidden="true" />;
  }

  const renderLayer = (layer: Layer, className: string, onShown?: () => void) => (
    <div key={layer.key} className={className} onAnimationEnd={onShown}>
      {layer.sheets.map((sheet, index) => (
        <img
          key={index}
          className="pdf-sheets__page"
          src={sheet.url}
          alt={index === 0 ? title : ''}
          style={{ aspectRatio: String(sheet.ratio) }}
          draggable={false}
        />
      ))}
    </div>
  );

  return (
    <div className="pdf-sheets">
      {previous && renderLayer(previous, 'pdf-sheets__layer pdf-sheets__layer--leaving')}
      {renderLayer(
        current,
        `pdf-sheets__layer${previous ? ' pdf-sheets__layer--entering' : ''}`,
        dropPrevious
      )}
    </div>
  );
}

export default PdfSheets;
