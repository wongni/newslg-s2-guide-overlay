'use client';

import { useRef, useCallback, useMemo, useEffect } from 'react';

interface HighlightedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  glossary?: Record<string, string>;
  templateKeys?: string[];
  className?: string;
  multiline?: boolean;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function HighlightedInput({
  value,
  onChange,
  placeholder,
  glossary = {},
  templateKeys = [],
  className = '',
  multiline = false,
}: HighlightedInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Build combined regex for highlighting
  const highlightRegex = useMemo(() => {
    const patterns: string[] = [];
    // Template pattern: {{...}}
    patterns.push('\\{\\{[^}]+\\}\\}');
    // Glossary keywords sorted by length desc to match longer ones first
    const glossaryKeys = Object.keys(glossary);
    if (glossaryKeys.length > 0) {
      const sorted = [...glossaryKeys].sort((a, b) => b.length - a.length);
      for (const key of sorted) {
        patterns.push(escapeRegex(key));
      }
    }
    if (patterns.length === 0) return null;
    return new RegExp(`(${patterns.join('|')})`, 'g');
  }, [glossary]);

  // Render highlighted spans
  const highlightedContent = useMemo(() => {
    if (!value) {
      return <span className="text-zinc-400">{placeholder || '\u00A0'}</span>;
    }
    if (!highlightRegex) {
      return <span>{value}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const regex = new RegExp(highlightRegex.source, highlightRegex.flags);

    while ((match = regex.exec(value)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`t-${lastIndex}`}>{value.slice(lastIndex, match.index)}</span>
        );
      }

      const matchedText = match[0];
      const isTemplate = matchedText.startsWith('{{') && matchedText.endsWith('}}');

      if (isTemplate) {
        parts.push(
          <span
            key={`m-${match.index}`}
            className="bg-blue-100 dark:bg-blue-900/40 rounded-sm"
            style={{ color: 'inherit' }}
          >
            {matchedText}
          </span>
        );
      } else {
        parts.push(
          <span
            key={`m-${match.index}`}
            className="bg-amber-100 dark:bg-amber-900/40 rounded-sm"
            style={{ color: 'inherit' }}
          >
            {matchedText}
          </span>
        );
      }

      lastIndex = match.index + matchedText.length;
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(<span key={`t-${lastIndex}`}>{value.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : <span>{value}</span>;
  }, [value, highlightRegex, placeholder]);

  // Auto-resize for multiline
  const adjustHeight = useCallback(() => {
    if (multiline && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [multiline]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Sync scroll between textarea and highlight div
  const handleScroll = useCallback(() => {
    const input = multiline ? textareaRef.current : null;
    if (input && highlightRef.current) {
      highlightRef.current.scrollTop = input.scrollTop;
      highlightRef.current.scrollLeft = input.scrollLeft;
    }
  }, [multiline]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      const el = multiline ? textareaRef.current : inputRef.current;
      if (el) {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const newValue = value.slice(0, start) + text + value.slice(end);
        onChange(newValue);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          const pos = start + text.length;
          el.setSelectionRange(pos, pos);
        });
      }
    },
    [value, onChange, multiline]
  );

  const sharedClasses =
    'font-sans text-sm leading-[1.5] px-3 py-1.5 whitespace-pre-wrap break-words overflow-wrap-break-word';

  if (multiline) {
    return (
      <div className={`relative ${className}`}>
        {/* Highlight layer */}
        <div
          ref={highlightRef}
          aria-hidden="true"
          className={`${sharedClasses} absolute inset-0 pointer-events-none overflow-hidden rounded border border-transparent`}
        >
          {highlightedContent}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onPaste={handlePaste}
          placeholder=""
          rows={1}
          className={`${sharedClasses} relative z-10 w-full bg-transparent text-transparent caret-zinc-900 dark:caret-zinc-100 selection:bg-blue-200/50 dark:selection:bg-blue-800/50 resize-none outline-none border-none`}
          style={{ minHeight: '2.25rem' }}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Highlight layer */}
      <div
        ref={highlightRef}
        aria-hidden="true"
        className={`${sharedClasses} absolute inset-0 pointer-events-none overflow-hidden whitespace-nowrap rounded border border-transparent`}
      >
        {highlightedContent}
      </div>
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder=""
        className={`${sharedClasses} relative z-10 w-full bg-transparent text-transparent caret-zinc-900 dark:caret-zinc-100 selection:bg-blue-200/50 dark:selection:bg-blue-800/50 outline-none border-none whitespace-nowrap`}
      />
    </div>
  );
}
