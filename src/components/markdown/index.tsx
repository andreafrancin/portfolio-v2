'use client';
import { useCallback, useMemo } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  className?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 480,
  className = '',
}: MarkdownEditorProps) {
  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? '');
    },
    [onChange]
  );

  const copyCommand = useMemo(
    () => ({
      name: 'copy-md',
      keyCommand: 'copy-md',
      buttonProps: { 'aria-label': 'Copy Markdown' },
      icon: (
        <span style={{ fontSize: 12, padding: '0 6px' }} title="Copy Markdown">
          Copy
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
    <div className={className} data-color-mode="light">
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
  );
}
