'use client';

import { useCallback, useEffect, useRef } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  placeholder?: string;
}

export function JsonEditor({
  value,
  onChange,
  height = '100%',
  readOnly = false,
  minimap = true,
  lineNumbers = true,
}: JsonEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    
    // Format on mount if there's content
    if (value) {
      try {
        const formatted = JSON.stringify(JSON.parse(value), null, 2);
        if (formatted !== value) {
          editor.setValue(formatted);
        }
      } catch {
        // Invalid JSON, keep as is
      }
    }
  }, [value]);

  const handleChange: OnChange = useCallback((newValue) => {
    onChange(newValue || '');
  }, [onChange]);

  // Format document function
  const formatDocument = useCallback(() => {
    if (editorRef.current) {
      try {
        const currentValue = editorRef.current.getValue();
        const formatted = JSON.stringify(JSON.parse(currentValue), null, 2);
        editorRef.current.setValue(formatted);
      } catch {
        // Invalid JSON, can't format
      }
    }
  }, []);

  // Expose format function via keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        formatDocument();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formatDocument]);

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: minimap },
        lineNumbers: lineNumbers ? 'on' : 'off',
        fontSize: 14,
        fontFamily: 'var(--font-geist-mono), monospace',
        tabSize: 2,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        padding: { top: 8, bottom: 8 },
      }}
      loading={
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Loading editor...
        </div>
      }
    />
  );
}
