'use client';

import { useCallback, useRef } from 'react';
import Editor, { OnMount, OnChange, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface DataEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  variables?: string[];
}

export function DataEditor({
  value,
  onChange,
  height = '200px',
  variables = [],
}: DataEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editorInstance, monaco) => {
    editorRef.current = editorInstance;
    
    // Register variable completions if available
    if (variables.length > 0) {
      monaco.languages.registerCompletionItemProvider('json', {
        provideCompletionItems: (model: editor.ITextModel, position: Monaco['Position']) => {
          const wordInfo = model.getWordUntilPosition(position);
          const completionRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: wordInfo.startColumn,
            endColumn: wordInfo.endColumn,
          };

          return {
            suggestions: variables.map((varName) => ({
              label: varName,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: `"${varName}": `,
              range: completionRange,
              detail: 'Variable from JSONLogic rule',
            })),
          };
        },
      });
    }
  }, [variables]);

  const handleChange: OnChange = useCallback((newValue) => {
    onChange(newValue || '');
  }, [onChange]);

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        lineNumbers: 'on',
        fontSize: 13,
        fontFamily: 'var(--font-geist-mono), monospace',
        tabSize: 2,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        formatOnPaste: true,
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        padding: { top: 4, bottom: 4 },
        scrollbar: { vertical: 'auto', horizontal: 'auto' },
      }}
      loading={
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading editor...
        </div>
      }
    />
  );
}
