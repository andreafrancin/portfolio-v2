'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
// Estilos requeridos por @uiw/react-md-editor
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface MarkdownEditorProps {
  initialValue: string;
  onChange: any;
  height: number;
  colorMode: string;
  className: string;
}

export default function MarkdownEditor({
  initialValue,
  onChange,
  height = 480,
  colorMode = 'auto',
  className = '',
  ...props
}: MarkdownEditorProps) {
  const [value, setValue] = useState(initialValue);

  const mode = 'light';

  const handleChange = useCallback((val: any) => {
    setValue(val);
    onChange?.(val);
  }, []);

  const copyCommand = useMemo(
    () => ({
      name: 'copy-md',
      keyCommand: 'copy-md',
      buttonProps: { 'aria-label': 'Copiar Markdown' },
      icon: (
        <span style={{ fontSize: 12, padding: '0 6px' }} title="Copiar Markdown">
          Copiar
        </span>
      ),
      execute: async (state: any) => {
        try {
          await navigator.clipboard.writeText(state?.text || value || '');
        } catch (_) {
          // noop
        }
      },
    }),
    [value]
  );

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`} data-color-mode={mode} {...props}>
      <div className="rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Content</h2>
        </div>
        <div data-color-mode={mode} className="[&_.w-md-editor]:!border-0">
          <MDEditor
            value={value}
            onChange={handleChange}
            height={height}
            preview="edit"
            commands={[
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.hr,
              commands.divider,
              commands.heading,
              commands.link,
              commands.quote,
              commands.image,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.divider,
              copyCommand,
              commands.help,
            ]}
          />
        </div>
      </div>
    </div>
  );
}
