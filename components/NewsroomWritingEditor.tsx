'use client';

import { useRef, type RefObject } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  disabled?: boolean;
  placeholder?: string;
  minRows?: number;
};

export default function NewsroomWritingEditor({
  value, onChange, textareaRef, disabled = false,
  placeholder = 'Start writing your story...', minRows = 24,
}: Props) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = textareaRef ?? internalRef;
  // Keep visual preferences local to the writing session.
  const styleState = useRef({ fontFamily: 'Georgia', fontSize: '17', lineHeight: '1.9', width: 'wide' });
  const refresh = () => {
    const node = editorRef.current;
    if (node) {
      node.style.fontFamily = styleState.current.fontFamily;
      node.style.fontSize = styleState.current.fontSize + 'px';
      node.style.lineHeight = styleState.current.lineHeight;
      node.style.maxWidth = styleState.current.width === 'narrow' ? '720px' : styleState.current.width === 'wide' ? '100%' : '900px';
    }
  };

  function insert(before: string, after = '') {
    const node = editorRef.current;
    if (!node || disabled) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const selected = value.slice(start, end);
    const replacement = before + (selected || 'your text') + after;
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      node.focus();
      const cursor = start + before.length + (selected ? selected.length : 9);
      node.setSelectionRange(cursor, cursor);
    });
  }

  function prefixLine(prefix: string) {
    const node = editorRef.current;
    if (!node || disabled) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const selectedEnd = value.indexOf('\n', end);
    const lineEnd = selectedEnd === -1 ? value.length : selectedEnd;
    const selected = value.slice(lineStart, lineEnd);
    const replacement = selected.split('\n').map(line => prefix + line).join('\n');
    onChange(value.slice(0, lineStart) + replacement + value.slice(lineEnd));
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(lineStart, lineStart + replacement.length); });
  }

  function setStyle(key: 'fontFamily' | 'fontSize' | 'lineHeight' | 'width', next: string) {
    styleState.current = { ...styleState.current, [key]: next };
    refresh();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-3">
        <button type="button" disabled={disabled} onClick={() => insert('**', '**')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-40" title="Bold">B</button>
        <button type="button" disabled={disabled} onClick={() => insert('*', '*')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm italic disabled:opacity-40" title="Italic">I</button>
        <button type="button" disabled={disabled} onClick={() => prefixLine('## ')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-40" title="Section heading">H2</button>
        <button type="button" disabled={disabled} onClick={() => prefixLine('> ')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40" title="Quote">Quote</button>
        <button type="button" disabled={disabled} onClick={() => prefixLine('- ')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40" title="Bulleted list">List</button>
        <button type="button" disabled={disabled} onClick={() => insert('[', '](https://)')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40" title="Link">Link</button>
        <button type="button" disabled={disabled} onClick={() => insert('\n\n---\n\n')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40" title="Divider">Divider</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-xs text-gray-600">
        <label className="flex items-center gap-2">Font
          <select defaultValue="Georgia" onChange={e => setStyle('fontFamily', e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
            <option value="Georgia">Georgia</option><option value="Arial">Arial</option><option value="Verdana">Verdana</option><option value="Times New Roman">Times New Roman</option><option value="system-ui">System</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Size
          <select defaultValue="17" onChange={e => setStyle('fontSize', e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
            <option value="15">15 px</option><option value="17">17 px</option><option value="19">19 px</option><option value="21">21 px</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Spacing
          <select defaultValue="1.9" onChange={e => setStyle('lineHeight', e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
            <option value="1.6">Compact</option><option value="1.9">Comfortable</option><option value="2.15">Relaxed</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Writing space
          <select defaultValue="wide" onChange={e => setStyle('width', e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs">
            <option value="wide">Wide</option><option value="narrow">Narrow</option><option value="medium">Medium</option>
          </select>
        </label>
      </div>
      <div className="p-4 sm:p-6">
        <textarea
          ref={editorRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          required
          rows={minRows}
          placeholder={placeholder}
          className="mx-auto block w-full resize-y border-0 bg-transparent px-1 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 disabled:opacity-60"
          style={{ fontFamily: 'Georgia', fontSize: '17px', lineHeight: 1.9, maxWidth: '100%' }}
        />
      </div>
      <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">Formatting is saved with the story. Font and writing-space preferences affect your editor view.</div>
    </section>
  );
}
