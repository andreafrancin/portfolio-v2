import { createContext, useContext } from 'react';
import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import {
  BillingDocument,
  DocLanguage,
  computeTotals,
  documentNumber,
  formatDocDate,
  formatMoney,
  formatRate,
  Issuer,
  parseAmount,
  sectionPrice,
  sectionQuantity,
} from '../../../../lib/billing';
import { parseRich, Run, runsText, splitLines, trimRuns } from '../../../../lib/rich-text';

export interface FontSources {
  thin: string;
  light: string;
  regular: string;
  semibold: string;
  bold: string;
  extrabold: string;
  italic: string;
  semiboldItalic: string;
}

let registered = false;
export function registerBillingFonts(src: FontSources) {
  if (registered) return;
  registered = true;
  Font.register({
    family: 'Raleway',
    fonts: [
      { src: src.thin, fontWeight: 100 },
      { src: src.light, fontWeight: 300 },
      { src: src.regular, fontWeight: 400 },
      { src: src.semibold, fontWeight: 600 },
      { src: src.bold, fontWeight: 700 },
      { src: src.extrabold, fontWeight: 800 },
      { src: src.italic, fontWeight: 400, fontStyle: 'italic' },
      { src: src.semiboldItalic, fontWeight: 600, fontStyle: 'italic' },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
}

const MAGENTA = '#bd1752';
const BLACK = '#000000';
const LEFT = 62.36;
const RIGHT = 595.28 - 532.91;
const COL = 134.36;
const COL_TEXT = 141.73;
const COL_BULLETS = 138.9;
const TABLE_LEFT = 132.88;
const TABLE_COLS = [80.02, 87.57, 73.7, 73.7, 85.28];
const LOGO = { width: 104.04, height: 59.16, top: 29.04 };
const ASCENT = 0.18;
const COND_TRACKING = 0.05;

const at = (y: number, size: number) => y - ASCENT * size;

const LABELS = {
  ca: {
    quoteNo: 'pressupost nº',
    invoiceNo: 'factura nº',
    client: 'client/a',
    subtotal: 'subtotal',
    base: 'base imposable',
    iva: 'iva',
    irpf: 'irpf',
    totalTable: 'total factura',
    totalPrice: 'preu total',
    conditions: 'Condicions:',
    payment: 'Pagament per transferència bancària:',
    quote: 'Pressupost',
    invoice: 'Factura',
    privacy: (name: string, email: string) =>
      `Protecció de dades: ${name}, responsable del tractament, fa servir les dades d’aquest document per gestionar l’encàrrec i complir les obligacions fiscals, i les conserva durant els terminis legals. Pots exercir els drets d’accés, rectificació, supressió, oposició, limitació i portabilitat a ${email}.`,
  },
  es: {
    quoteNo: 'presupuesto nº',
    invoiceNo: 'factura nº',
    client: 'cliente',
    subtotal: 'subtotal',
    base: 'base imponible',
    iva: 'iva',
    irpf: 'irpf',
    totalTable: 'total factura',
    totalPrice: 'precio total',
    conditions: 'Condiciones:',
    payment: 'Pago por transferencia bancaria:',
    quote: 'Presupuesto',
    invoice: 'Factura',
    privacy: (name: string, email: string) =>
      `Protección de datos: ${name}, responsable del tratamiento, usa los datos de este documento para gestionar el encargo y cumplir las obligaciones fiscales, y los conserva durante los plazos legales. Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en ${email}.`,
  },
  en: {
    quoteNo: 'quote no.',
    invoiceNo: 'invoice no.',
    client: 'client',
    subtotal: 'subtotal',
    base: 'taxable base',
    iva: 'vat',
    irpf: 'irpf',
    totalTable: 'total',
    totalPrice: 'total price',
    conditions: 'Terms:',
    payment: 'Payment by bank transfer:',
    quote: 'Quote',
    invoice: 'Invoice',
    privacy: (name: string, email: string) =>
      `Data protection: ${name}, as data controller, uses the data in this document to manage the commission and meet tax obligations, and keeps it for the legal periods. You can exercise your rights of access, rectification, erasure, objection, restriction and portability at ${email}.`,
  },
} as const;

type Labels = (typeof LABELS)[DocLanguage];
const LabelsContext = createContext<Labels>(LABELS.ca);
const useLabels = () => useContext(LabelsContext);

function SmallCaps({
  children,
  size,
  style,
  tracking = 0.097,
}: {
  children: string;
  size: number;
  style?: Style;
  tracking?: number;
}) {
  const runs: { text: string; lower: boolean }[] = [];
  for (const ch of children) {
    const lower = ch !== ch.toUpperCase() && ch === ch.toLowerCase();
    const last = runs[runs.length - 1];
    if (last && last.lower === lower) last.text += ch;
    else runs.push({ text: ch, lower });
  }
  return (
    <Text style={[{ fontSize: size, letterSpacing: size * tracking }, style || {}]}>
      {runs.map((r, i) =>
        r.lower ? (
          <Text key={i} style={{ fontSize: size * 0.68 }}>
            {r.text.toUpperCase()}
          </Text>
        ) : (
          <Text key={i}>{r.text}</Text>
        )
      )}
    </Text>
  );
}

const nonEmptyLines = (text: string) =>
  (text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function runStyle(r: Run, base: Style): Style {
  const style: Style = {};
  const weight = Number(base.fontWeight ?? 300);
  const italic = base.fontStyle === 'italic';
  if (r.bold === true && weight < 600) style.fontWeight = italic ? 600 : 700;
  if (r.bold === false && weight >= 600) style.fontWeight = italic ? 400 : 300;
  if (r.color) style.color = r.color === 'pink' ? MAGENTA : BLACK;
  return style;
}

function Rich({ text, style, prefix }: { text: string | Run[]; style: Style; prefix?: string }) {
  const runs = typeof text === 'string' ? parseRich(text) : text;
  if (!runs.some((r) => r.bold !== undefined || r.color)) {
    return (
      <Text style={style}>
        {prefix}
        {runsText(runs)}
      </Text>
    );
  }
  return (
    <Text style={style}>
      {prefix}
      {runs.map((r, i) => (
        <Text key={i} style={runStyle(r, style)}>
          {r.text}
        </Text>
      ))}
    </Text>
  );
}

const trimRich = (text: string): Run[] => trimRuns(parseRich(text));

const isBlank = (text: string) => !runsText(parseRich(text)).trim();

function sliceRuns(runs: Run[], start: number, end: number): Run[] {
  const out: Run[] = [];
  let pos = 0;
  for (const r of runs) {
    const a = Math.max(start, pos) - pos;
    const b = Math.min(end, pos + r.text.length) - pos;
    if (b > a) out.push({ ...r, text: r.text.slice(a, b) });
    pos += r.text.length;
  }
  return out;
}

function richParagraphs(text: string): Run[][] {
  const runs = parseRich((text || '').replace(/\r/g, ''));
  const plain = runsText(runs);
  const out: Run[][] = [];
  const gap = /\n\s*\n/g;
  let from = 0;
  let m: RegExpExecArray | null;
  const take = (start: number, end: number) => {
    const piece = plain.slice(start, end);
    const kept = piece.replace(/\s+$/g, '').length;
    if (piece.trim()) out.push(sliceRuns(runs, start, start + kept));
  };
  while ((m = gap.exec(plain))) {
    take(from, m.index);
    from = m.index + m[0].length;
  }
  take(from, plain.length);
  return out;
}

const richLines = (text: string): Run[][] =>
  splitLines(parseRich((text || '').replace(/\r/g, '')))
    .map(trimRuns)
    .filter((l) => runsText(l).length > 0);

function stripBullet(line: Run[]): Run[] {
  if (!line.length) return line;
  const [first, ...rest] = line;
  const text = first.text.replace(/^[·•\-]\s*/, '');
  return text ? [{ ...first, text }, ...rest] : rest;
}

function TaxTable({
  base,
  iva,
  irpf,
  total,
  ivaRate,
  irpfRate,
}: {
  base: number;
  iva: number;
  irpf: number;
  total: number;
  ivaRate: string;
  irpfRate: string;
}) {
  const L = useLabels();
  const heads = [
    L.subtotal,
    L.base,
    `+${formatRate(ivaRate)} % ${L.iva}`,
    `-${formatRate(irpfRate)}% ${L.irpf}`,
    L.totalTable,
  ];
  const values = [
    formatMoney(base),
    formatMoney(base),
    `+ ${formatMoney(iva)}`,
    `- ${formatMoney(irpf)}`,
    formatMoney(total),
  ];
  const cell = (w: number, h: number, i: number, row: number): Style => ({
    width: w,
    height: h,
    borderTopWidth: 0.25,
    borderLeftWidth: 0.25,
    borderRightWidth: i === TABLE_COLS.length - 1 ? 0.25 : 0,
    borderBottomWidth: row === 1 ? 0.25 : 0,
    borderColor: BLACK,
    justifyContent: 'center',
    alignItems: 'center',
  });
  return (
    <View style={{ marginLeft: TABLE_LEFT - LEFT, width: 400.27 }}>
      <View style={{ flexDirection: 'row' }}>
        {heads.map((h, i) => (
          <View key={h} style={[cell(TABLE_COLS[i], 16.93, i, 0), { paddingBottom: 2.6 }]}>
            <SmallCaps size={9.5} tracking={0.122} style={{ fontWeight: i === 4 ? 800 : 700 }}>
              {h}
            </SmallCaps>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {values.map((v, i) => (
          <View key={i} style={[cell(TABLE_COLS[i], 23.56, i, 1), { paddingTop: 3 }]}>
            <Text style={{ fontSize: 10, fontWeight: i === 4 ? 800 : 600 }}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SummaryTotals({
  base,
  iva,
  total,
  ivaRate,
  baseOnly = false,
}: {
  base: number;
  iva: number;
  total: number;
  ivaRate: string;
  baseOnly?: boolean;
}) {
  const L = useLabels();
  const rows: [string, string, boolean][] = baseOnly
    ? [[L.base, formatMoney(base), true]]
    : [
        [L.base, formatMoney(base), false],
        [`+ ${formatRate(ivaRate)} ${L.iva} ${formatRate(ivaRate)}%`, formatMoney(iva), false],
        [L.totalPrice, formatMoney(total), true],
      ];
  return (
    <View style={{ marginLeft: 380.83 - LEFT, width: 532.91 - 380.83 }}>
      {rows.map(([label, value, strong]) => (
        <View
          key={label}
          style={{ flexDirection: 'row', justifyContent: 'space-between', height: 12 }}
        >
          <SmallCaps size={10} style={{ fontWeight: strong ? 700 : 400 }}>
            {label}
          </SmallCaps>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Separator({ marginTop, marginBottom }: { marginTop: number; marginBottom: number }) {
  return (
    <View
      style={{
        marginLeft: TABLE_LEFT - LEFT,
        width: 532.57 - TABLE_LEFT,
        borderTopWidth: 0.5,
        borderTopColor: MAGENTA,
        marginTop,
        marginBottom,
      }}
    />
  );
}

function Authorization({ text, marginTop }: { text: string; marginTop: number }) {
  if (isBlank(text)) return null;
  return (
    <Rich
      text={trimRich(text)}
      style={{
        marginTop,
        marginLeft: 133.23 - LEFT,
        width: 535.31 - 133.23 - 2,
        fontSize: 8,
        lineHeight: 1.2,
        textAlign: 'justify',
      }}
    />
  );
}

function Conditions({ text }: { text: string }) {
  const L = useLabels();
  if (isBlank(text)) return null;
  return (
    <View style={{ position: 'absolute', left: LEFT, right: 595.28 - 534.85, bottom: 60.5 }} fixed>
      <Text style={{ fontSize: 7.5, fontWeight: 700, lineHeight: 1.2 }}>{L.conditions}</Text>
      <Rich
        text={trimRich(text)}
        style={{
          fontSize: 7.5,
          lineHeight: 1.2,
          textAlign: 'justify',
          letterSpacing: COND_TRACKING,
        }}
      />
    </View>
  );
}

function PrivacyNote({ issuer }: { issuer: Issuer }) {
  const L = useLabels();
  if (!issuer.legal_name.trim() || !issuer.email.trim()) return null;
  return (
    <Text
      style={{
        position: 'absolute',
        left: LEFT,
        right: RIGHT,
        bottom: 20,
        fontSize: 5.5,
        lineHeight: 1.25,
        color: '#6b6b6b',
        textAlign: 'justify',
      }}
      fixed
    >
      {L.privacy(issuer.legal_name.trim(), issuer.email.trim())}
    </Text>
  );
}

function QuoteHeader({
  issuer,
  doc,
  logo,
}: {
  issuer: Issuer;
  doc: BillingDocument;
  logo: string;
}) {
  const L = useLabels();
  return (
    <>
      <View style={{ position: 'absolute', top: at(34.8, 10), left: LEFT }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: MAGENTA, lineHeight: 1.2 }}>
          {issuer.legal_name}
        </Text>
        {issuer.tax_id ? (
          <Text style={{ fontSize: 10, fontWeight: 700, color: MAGENTA, lineHeight: 1.2 }}>
            NIF {issuer.tax_id}
          </Text>
        ) : null}
      </View>
      <View style={{ position: 'absolute', top: at(70.4, 9), left: LEFT }}>
        <Text style={{ fontSize: 9, fontStyle: 'italic', color: MAGENTA, lineHeight: 1.2 }}>
          {issuer.address}
        </Text>
        <Text
          style={{
            fontSize: 9,
            fontStyle: 'italic',
            fontWeight: 600,
            color: MAGENTA,
            lineHeight: 1.2,
          }}
        >
          {[issuer.phone, issuer.website, issuer.email].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Image
        src={logo}
        style={{
          position: 'absolute',
          top: LOGO.top,
          right: RIGHT,
          width: LOGO.width,
          height: LOGO.height,
        }}
      />
      <Text style={{ position: 'absolute', top: at(124.3, 9), left: LEFT, fontSize: 9 }}>
        {issuer.city ? `${issuer.city}, ` : ''}
        {formatDocDate(doc.date)}
      </Text>
      <View style={{ position: 'absolute', top: at(124.3, 9), right: RIGHT }}>
        <SmallCaps size={9}>{`${L.quoteNo}: ${documentNumber(doc.year, doc.sequence)}`}</SmallCaps>
      </View>
    </>
  );
}

function InvoiceHeader({
  issuer,
  doc,
  logo,
}: {
  issuer: Issuer;
  doc: BillingDocument;
  logo: string;
}) {
  const L = useLabels();
  const logoLeft = 87.57;
  const center = logoLeft + LOGO.width / 2;
  return (
    <>
      <Image
        src={logo}
        style={{
          position: 'absolute',
          top: LOGO.top,
          left: logoLeft,
          width: LOGO.width,
          height: LOGO.height,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: at(102.3, 10),
          left: center - 100,
          width: 200,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontStyle: 'italic',
            fontWeight: 600,
            color: MAGENTA,
            lineHeight: 1.2,
          }}
        >
          {issuer.legal_name}
        </Text>
        {issuer.tax_id ? (
          <Text
            style={{
              fontSize: 10,
              fontStyle: 'italic',
              fontWeight: 600,
              color: MAGENTA,
              lineHeight: 1.2,
            }}
          >
            NIF {issuer.tax_id}
          </Text>
        ) : null}
      </View>
      <Text style={{ position: 'absolute', top: at(100.7, 9), right: RIGHT, fontSize: 9 }}>
        {issuer.city ? `${issuer.city}, ` : ''}
        {formatDocDate(doc.date)}
      </Text>
      <View style={{ position: 'absolute', top: at(114.8, 9), right: RIGHT }}>
        <SmallCaps
          size={9}
        >{`${L.invoiceNo}: ${documentNumber(doc.year, doc.sequence)}`}</SmallCaps>
      </View>
    </>
  );
}

function ClientRow({ doc, invoice }: { doc: BillingDocument; invoice: boolean }) {
  const L = useLabels();
  const c = doc.client_snapshot;
  const nameLeft = invoice ? 130.11 : COL;
  const labelLeft = invoice ? 58.11 : LEFT;
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: nameLeft - labelLeft, marginLeft: labelLeft - LEFT }}>
          <SmallCaps size={11}>{L.client}</SmallCaps>
        </View>
        <Text style={{ fontSize: 11, fontWeight: 700, width: 532.91 - nameLeft }}>{c.name}</Text>
      </View>
      {invoice && (c.tax_id || c.address) ? (
        <View style={{ marginLeft: 132.52 - LEFT, marginTop: 186 - 160.2 - 11 - 1.7 }}>
          {[c.tax_id, ...nonEmptyLines(c.address)].filter(Boolean).map((l, i) => (
            <Text key={i} style={{ fontSize: 10, lineHeight: 1.2 }}>
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ConceptBody({ doc }: { doc: BillingDocument }) {
  const { lead, concept, sections } = doc.content;
  return (
    <View>
      {!isBlank(lead) ? (
        <Rich
          text={trimRich(lead)}
          style={{
            marginTop: 207.1 - 168.6 - 11 - 1.7,
            marginLeft: 133.23 - LEFT,
            fontSize: 10,
            fontWeight: 400,
          }}
        />
      ) : null}
      {!isBlank(concept) ? (
        <Rich
          text={trimRich(concept)}
          style={{
            marginTop: 227.6 - 207.1 - 10 - 1.7,
            marginLeft: COL - LEFT,
            width: 472.6 - COL + 20,
            fontSize: 10,
            fontWeight: 600,
            color: MAGENTA,
            lineHeight: 1.2,
          }}
        />
      ) : null}
      {sections.map((s, i) => {
        const price = sectionPrice(s);
        const paras = richParagraphs(s.body);
        return (
          <View
            key={s.id}
            style={{ marginTop: i === 0 ? 266.4 - 239.6 - 12 : 333.0 - 305.2 - 11 }}
            wrap={false}
          >
            <View style={{ flexDirection: 'row', marginLeft: COL - LEFT }}>
              <Rich
                text={s.title}
                style={{ flex: 1, fontSize: 10, fontWeight: 700, color: MAGENTA, paddingRight: 16 }}
              />
              {price !== null ? (
                <Text style={{ fontSize: 10, fontWeight: 700 }}>{formatMoney(price)}</Text>
              ) : null}
            </View>
            {paras.map((p, j) => (
              <Rich
                key={j}
                text={p}
                style={{
                  marginTop: j === 0 ? 283.6 - 266.4 - 10 - 1.6 : 10.8,
                  marginLeft: COL_TEXT - LEFT,
                  width: 532.91 - COL_TEXT,
                  fontSize: 9,
                  lineHeight: 1.2,
                }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function NumberedBody({ doc }: { doc: BillingDocument }) {
  const { lead, concept, sections } = doc.content;
  return (
    <View>
      <View
        style={{
          marginTop: 207 - 168.6 - 11 - 1.4,
          marginLeft: 133.23 - LEFT,
          width: 532.91 - 133.23,
        }}
      >
        {!isBlank(lead) ? (
          <Rich text={trimRich(lead)} style={{ fontSize: 10, color: MAGENTA, lineHeight: 1.2 }} />
        ) : null}
        {!isBlank(concept) ? (
          <Rich
            text={trimRich(concept)}
            style={{
              fontSize: 10,
              fontStyle: 'italic',
              fontWeight: 600,
              color: MAGENTA,
              lineHeight: 1.2,
            }}
          />
        ) : null}
      </View>
      {sections.map((s, i) => {
        const price = sectionPrice(s);
        const bullets = richLines(s.body).map(stripBullet);
        return (
          <View
            key={s.id}
            style={{ marginTop: i === 0 ? 248.8 - 219.1 - 12 : 399.5 - 369.6 - 13.6 }}
            wrap={false}
          >
            <View style={{ flexDirection: 'row', marginLeft: 133.23 - LEFT }}>
              <Rich
                text={s.title}
                prefix={`${i + 1}. `}
                style={{ flex: 1, fontSize: 10, fontWeight: 800, paddingRight: 16 }}
              />
              {price !== null ? (
                <Text style={{ fontSize: 10, fontWeight: 800 }}>{formatMoney(price)}</Text>
              ) : null}
            </View>
            {!isBlank(s.subtitle) ? (
              <Rich
                text={trimRich(s.subtitle)}
                style={{
                  marginTop: 271.7 - 248.8 - 10 - 1.5,
                  marginLeft: COL_BULLETS - LEFT,
                  width: 532.91 - COL_BULLETS - 10,
                  fontSize: 9,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: MAGENTA,
                  lineHeight: 1.2,
                }}
              />
            ) : null}
            {bullets.length > 0 ? (
              <View
                style={{
                  marginTop: !isBlank(s.subtitle) ? 304.6 - 282.5 - 10.8 : 418.9 - 399.5 - 10 - 1.5,
                  marginLeft: COL_BULLETS - LEFT,
                  width: 532.91 - COL_BULLETS,
                }}
              >
                {bullets.map((b, j) => (
                  <Rich
                    key={j}
                    text={b}
                    prefix="· "
                    style={{ fontSize: 9, fontWeight: 100, lineHeight: 13 / 9 }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function InvoiceBody({ doc }: { doc: BillingDocument }) {
  return (
    <View>
      {doc.content.sections.map((s, i) => {
        const price = sectionPrice(s);
        const qty = sectionQuantity(s);
        return (
          <View key={s.id} style={{ marginTop: i === 0 ? 0 : 24 }} wrap={false}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: COL - LEFT, fontSize: 10, fontWeight: 700 }}>{qty}</Text>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Rich text={s.title} style={{ fontSize: 10, fontWeight: 700, color: MAGENTA }} />
                {!isBlank(s.subtitle) ? (
                  <Rich
                    text={trimRich(s.subtitle)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: MAGENTA,
                      marginTop: 295.7 - 280.9 - 11.8,
                    }}
                  />
                ) : null}
              </View>
              {price !== null ? (
                <Text style={{ fontSize: 10, fontWeight: 700 }}>{formatMoney(price)}</Text>
              ) : null}
            </View>
            {richParagraphs(s.body).length > 0 ? (
              <View style={{ marginTop: 6, marginLeft: COL - LEFT, paddingRight: 60 }}>
                {richParagraphs(s.body).map((p, j) => (
                  <Rich
                    key={j}
                    text={p}
                    style={{ fontSize: 10, lineHeight: 1.2, marginTop: j === 0 ? 0 : 6 }}
                  />
                ))}
              </View>
            ) : null}
            {s.lines.length > 0 ? (
              <View style={{ marginTop: 319.7 - 295.7 - 11.8 }}>
                {s.lines.map((l) => {
                  const value = parseAmount(l.amount);
                  const amount = Number.isFinite(value) ? formatMoney(value) : '';
                  return (
                    <View key={l.id} style={{ flexDirection: 'row', height: 12 }}>
                      <Text style={{ width: COL - LEFT, fontSize: 10, fontWeight: 400 }}>
                        {l.quantity}
                      </Text>
                      <Rich text={l.text} style={{ flex: 1, fontSize: 10, fontWeight: 400 }} />
                      <Text style={{ fontSize: 10, fontWeight: 400 }}>{amount}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function BillingPdf({
  doc,
  issuer,
  logo,
  lang,
}: {
  doc: BillingDocument;
  issuer: Issuer;
  logo: string;
  lang?: DocLanguage;
}) {
  const L = LABELS[lang || doc.content.language || 'ca'];
  const invoice = doc.kind === 'invoice';
  const totals = computeTotals(doc);
  const table = doc.totals_style === 'table';
  const contentTop = invoice ? at(160.2, 11) : at(168.6, 11);
  const bottomReserve = invoice ? 80 : !isBlank(doc.conditions_text) ? 150 : 60;

  return (
    <Document
      title={`${invoice ? L.invoice : L.quote} ${documentNumber(doc.year, doc.sequence)}`}
      author={issuer.legal_name}
      creator="andreafrancin.com"
      producer="andreafrancin.com"
    >
      <LabelsContext.Provider value={L}>
        <Page
          size="A4"
          style={{
            fontFamily: 'Raleway',
            fontWeight: 300,
            color: BLACK,
            paddingTop: contentTop,
            paddingLeft: LEFT,
            paddingRight: RIGHT,
            paddingBottom: bottomReserve,
          }}
        >
          {invoice ? (
            <InvoiceHeader issuer={issuer} doc={doc} logo={logo} />
          ) : (
            <QuoteHeader issuer={issuer} doc={doc} logo={logo} />
          )}

          <ClientRow doc={doc} invoice={invoice} />

          {invoice ? (
            <View
              style={{
                marginTop:
                  doc.client_snapshot.tax_id || doc.client_snapshot.address
                    ? 280.9 - 222 - 10 - 2
                    : 280.9 - 160.2 - 11 - 2,
              }}
            >
              <InvoiceBody doc={doc} />
            </View>
          ) : doc.layout === 'numbered' ? (
            <NumberedBody doc={doc} />
          ) : (
            <ConceptBody doc={doc} />
          )}

          <View wrap={false}>
            {table ? (
              <>
                <Separator
                  marginTop={invoice ? 393.1 - 355.7 - 12.7 : 456.17 - 416.2 - 11.5}
                  marginBottom={invoice ? 420.29 - 393.1 + 0.7 : 477.8 - 456.17 + 0.7}
                />
                <TaxTable
                  base={totals.base}
                  iva={totals.iva}
                  irpf={totals.irpf}
                  total={totals.total}
                  ivaRate={doc.iva_rate}
                  irpfRate={doc.irpf_rate}
                />
              </>
            ) : (
              <>
                <Separator
                  marginTop={invoice ? 393.1 - 355.7 - 12.7 : 573.1 - 493.2 - 13}
                  marginBottom={invoice ? 420.29 - 393.1 + 0.7 : 587 - 573.1 - 2.6}
                />
                <SummaryTotals
                  base={totals.base}
                  iva={totals.iva}
                  total={totals.total}
                  ivaRate={doc.iva_rate}
                  baseOnly={doc.totals_style === 'base'}
                />
              </>
            )}

            {invoice && !isBlank(doc.payment_text) ? (
              <View
                style={{
                  marginTop: 489.1 - 460.78 - 1,
                  alignItems: 'center',
                  marginLeft: TABLE_LEFT - LEFT,
                  width: 400.27,
                }}
              >
                <Text style={{ fontSize: 10, lineHeight: 1.4 }}>{L.payment}</Text>
                <Rich text={trimRich(doc.payment_text)} style={{ fontSize: 10, fontWeight: 700 }} />
              </View>
            ) : null}

            <Authorization
              text={doc.authorization_text}
              marginTop={table ? 540.7 - 518.29 - 1 : 646.1 - 611 - 12}
            />
          </View>

          {invoice ? (
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: at(781, 9),
                alignItems: 'center',
              }}
              fixed
            >
              <Text style={{ fontSize: 9, fontStyle: 'italic', color: MAGENTA, lineHeight: 1.2 }}>
                {issuer.address}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: MAGENTA,
                  lineHeight: 1.2,
                }}
              >
                {[issuer.phone, issuer.website, issuer.email].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ) : (
            <Conditions text={doc.conditions_text} />
          )}
          <PrivacyNote issuer={issuer} />
        </Page>
      </LabelsContext.Provider>
    </Document>
  );
}
