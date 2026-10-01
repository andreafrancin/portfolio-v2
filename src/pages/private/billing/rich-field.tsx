import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyStyle,
  parseRich,
  RichColor,
  Run,
  runsIn,
  serializeRich,
} from '../../../lib/rich-text';
import { IconClose } from '../../../components/icons';

interface RichFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  multiline?: boolean;
  rows?: number;
  defaultBold?: boolean;
  defaultColor?: RichColor;
  italic?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLDivElement>['inputMode'];
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function toHtml(runs: Run[]): string {
  const html = runs
    .map((r) => {
      const text = escapeHtml(r.text).replace(/\n/g, '<br>');
      const attrs = [
        r.bold !== undefined ? `data-b="${r.bold ? 1 : 0}"` : '',
        r.color ? `data-c="${r.color}"` : '',
      ]
        .filter(Boolean)
        .join(' ');
      return attrs ? `<span ${attrs}>${text}</span>` : text;
    })
    .join('');
  return runs.length && runs[runs.length - 1].text.endsWith('\n') ? `${html}<br>` : html;
}

const BLOCK = /^(DIV|P|LI)$/;

function styleOf(node: Node, root: HTMLElement): Pick<Run, 'bold' | 'color'> {
  let bold: boolean | undefined;
  let color: RichColor | undefined;
  for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
    if (bold === undefined) {
      if (el.dataset.b) bold = el.dataset.b === '1';
      else if (el.tagName === 'B' || el.tagName === 'STRONG') bold = true;
      else if (el.style.fontWeight)
        bold = Number(el.style.fontWeight) >= 600 || el.style.fontWeight === 'bold';
    }
    if (color === undefined) {
      if (el.dataset.c) color = el.dataset.c as RichColor;
      else if (el.style.color || el.getAttribute('color')) {
        const c = (el.style.color || el.getAttribute('color') || '').replace(/\s/g, '');
        color = /188,14,77|189,23,82|bc0e4d|bd1752/i.test(c) ? 'pink' : 'black';
      }
    }
  }
  return { bold, color };
}

function fromDom(root: HTMLElement): Run[] {
  const runs: Run[] = [];
  const walk = (node: Node) => {
    node.childNodes.forEach((child, i) => {
      if (child.nodeType === Node.TEXT_NODE) {
        runs.push({ text: child.textContent || '', ...styleOf(child, root) });
      } else if (child.nodeName === 'BR') {
        const isFiller = node === root && i === node.childNodes.length - 1;
        if (!isFiller) runs.push({ text: '\n', ...styleOf(child, root) });
      } else if (child instanceof HTMLElement) {
        if (BLOCK.test(child.tagName) && runs.length) runs.push({ text: '\n' });
        walk(child);
      }
    });
  };
  walk(root);
  return runs;
}

function offsetOf(root: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  const holder = document.createElement('div');
  holder.appendChild(range.cloneContents());
  return fromDom(holder).reduce((n, r) => n + r.text.length, 0);
}

function positionOf(root: HTMLElement, target: number): [Node, number] {
  let remaining = target;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length || 0;
      if (remaining <= len) return [node, remaining];
      remaining -= len;
    } else if (node.nodeName === 'BR') {
      if (remaining === 0) {
        const parent = node.parentNode!;
        return [parent, Array.prototype.indexOf.call(parent.childNodes, node)];
      }
      remaining -= 1;
    }
    node = walker.nextNode();
  }
  return [root, root.childNodes.length];
}

function RichField({
  id,
  value,
  onChange,
  label,
  multiline = false,
  rows = 1,
  defaultBold = false,
  defaultColor = 'black',
  italic = false,
  placeholder,
  inputMode,
}: RichFieldProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const emitted = useRef<string | null>(null);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const [empty, setEmpty] = useState(!value);

  const render = useCallback((runs: Run[], select?: [number, number]) => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = toHtml(runs);
    setEmpty(runs.length === 0);
    if (select) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(...positionOf(el, select[0]));
      range.setEnd(...positionOf(el, select[1]));
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  useLayoutEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    render(parseRich(value));
  }, [value, render]);

  const emit = (runs: Run[]) => {
    const next = serializeRich(runs);
    emitted.current = next;
    setEmpty(runs.length === 0);
    if (next !== value) onChange(next);
  };

  const readSelection = (): [number, number] | null => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
    const a = offsetOf(el, range.startContainer, range.startOffset);
    const b = offsetOf(el, range.endContainer, range.endOffset);
    return [Math.min(a, b), Math.max(a, b)];
  };

  useEffect(() => {
    const onChangeSel = () => {
      if (document.activeElement !== ref.current) return;
      setSelection(readSelection());
    };
    document.addEventListener('selectionchange', onChangeSel);
    return () => document.removeEventListener('selectionchange', onChangeSel);
  }, []);

  const current = () => fromDom(ref.current!);
  const hasRange = !!selection && selection[1] > selection[0];
  const selected = hasRange ? runsIn(parseRich(value), selection![0], selection![1]) : [];
  const allBold = selected.length > 0 && selected.every((r) => r.bold ?? defaultBold);
  const allColor = (c: RichColor) =>
    selected.length > 0 && selected.every((r) => (r.color ?? defaultColor) === c);

  const format = (patch: { bold?: boolean | null; color?: RichColor | null }) => {
    const range = readSelection();
    if (!range || range[1] <= range[0]) return;
    const p = { ...patch };
    if (p.bold !== undefined && p.bold !== null && p.bold === defaultBold) p.bold = null;
    if (p.color !== undefined && p.color !== null && p.color === defaultColor) p.color = null;
    const runs = applyStyle(current(), range[0], range[1], p);
    render(runs, range);
    emit(runs);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        format({ bold: !allBold });
        return;
      }
      if (key === 'i' || key === 'u') e.preventDefault();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (multiline) document.execCommand('insertLineBreak');
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    let text = e.clipboardData.getData('text/plain').replace(/\r/g, '');
    if (!multiline) text = text.replace(/\n+/g, ' ');
    document.execCommand('insertText', false, text);
  };

  return (
    <div
      className={`rich-field${multiline ? ' rich-field--multiline' : ''}`}
      style={{ '--rich-rows': rows } as React.CSSProperties}
    >
      <div className="rich-field__tools" role="toolbar" aria-label={t('BILLING.FORMAT')}>
        <button
          type="button"
          className="rich-field__tool rich-field__tool--bold"
          aria-pressed={allBold}
          disabled={!hasRange}
          title={`${t('BILLING.FORMAT_BOLD')} (⌘B)`}
          aria-label={t('BILLING.FORMAT_BOLD')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format({ bold: !allBold })}
        >
          B
        </button>
        <button
          type="button"
          className="rich-field__tool"
          aria-pressed={allColor('black')}
          disabled={!hasRange}
          title={t('BILLING.FORMAT_BLACK')}
          aria-label={t('BILLING.FORMAT_BLACK')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format({ color: 'black' })}
        >
          <span className="rich-field__swatch rich-field__swatch--black" />
        </button>
        <button
          type="button"
          className="rich-field__tool"
          aria-pressed={allColor('pink')}
          disabled={!hasRange}
          title={t('BILLING.FORMAT_PINK')}
          aria-label={t('BILLING.FORMAT_PINK')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format({ color: 'pink' })}
        >
          <span className="rich-field__swatch rich-field__swatch--pink" />
        </button>
        <button
          type="button"
          className="rich-field__tool"
          disabled={!hasRange}
          title={t('BILLING.FORMAT_CLEAR')}
          aria-label={t('BILLING.FORMAT_CLEAR')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format({ bold: null, color: null })}
        >
          <IconClose size={14} />
        </button>
      </div>
      <div
        ref={ref}
        id={id}
        className={`input rich-field__input${empty ? ' is-empty' : ''}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={multiline}
        aria-label={label}
        inputMode={inputMode}
        data-placeholder={placeholder}
        data-bold={defaultBold ? '1' : '0'}
        data-color={defaultColor}
        data-italic={italic ? '1' : '0'}
        spellCheck
        onInput={() => emit(current())}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDrop={(e) => e.preventDefault()}
        onBlur={() => {
          const runs = current();
          render(runs);
          emit(runs);
          setSelection(null);
        }}
      />
    </div>
  );
}

export default RichField;
