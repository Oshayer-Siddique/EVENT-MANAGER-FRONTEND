'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import type { SunEditorReactProps } from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';

const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

const DEFAULT_BUTTONS: NonNullable<SunEditorReactProps['setOptions']>['buttonList'] = [
  [
    'undo',
    'redo',
    'bold',
    'italic',
    'underline',
    'strike',
    'fontColor',
    'hiliteColor',
    'removeFormat',
  ],
  ['align', 'list', 'link', 'image', 'table'],
  ['fullScreen', 'showBlocks', 'codeView'],
];

interface RichTextEditorProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  minHeight?: string;
  labelClassName?: string;
}

export const RichTextEditor = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  minHeight = '220px',
  labelClassName,
}: RichTextEditorProps) => {
  const sanitizedValue = useMemo(() => value ?? '', [value]);

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className={`font-medium ${labelClassName ?? 'text-foreground'}`}>
        {label}
      </Label>
      <div className="rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
        <SunEditor
          key={id}
          setContents={sanitizedValue}
          defaultValue={sanitizedValue}
          onBlur={() => onBlur?.()}
          onChange={content => onChange(content)}
          placeholder={placeholder}
          setOptions={{
            minHeight,
            buttonList: DEFAULT_BUTTONS,
            katex: false,
            resizingBar: true,
            defaultStyle:
              'font-size: 14px; line-height: 1.6; color: #0f172a; font-family: "Inter", "Helvetica", sans-serif;',
            formats: ['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'pre'],
          }}
        />
      </div>
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default RichTextEditor;
