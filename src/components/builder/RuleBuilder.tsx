'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Copy, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { OperatorPalette } from './OperatorPalette';
import { RuleBlock } from './RuleBlock';
import { RuleTemplate } from '@/lib/builder/templates';
import { JsonLogicRule } from '@/types/jsonlogic';
import { cn } from '@/lib/utils';

interface RuleBuilderProps {
  initialRule?: JsonLogicRule;
  onRuleChange: (rule: JsonLogicRule | null) => void;
  className?: string;
}

interface HistoryState {
  rule: JsonLogicRule | null;
}

export function RuleBuilder({ initialRule, onRuleChange, className }: RuleBuilderProps) {
  const [rule, setRule] = useState<JsonLogicRule | null>(initialRule || null);
  const [history, setHistory] = useState<HistoryState[]>([{ rule: initialRule || null }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showPalette, setShowPalette] = useState(true);

  // Update rule and add to history
  const updateRule = useCallback((newRule: JsonLogicRule | null) => {
    setRule(newRule);
    onRuleChange(newRule);
    
    // Add to history (truncate future if we're not at the end)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ rule: newRule });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, onRuleChange]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevRule = history[newIndex].rule;
      setRule(prevRule);
      onRuleChange(prevRule);
    }
  }, [history, historyIndex, onRuleChange]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextRule = history[newIndex].rule;
      setRule(nextRule);
      onRuleChange(nextRule);
    }
  }, [history, historyIndex, onRuleChange]);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: RuleTemplate) => {
    const newRule = JSON.parse(JSON.stringify(template.template)) as JsonLogicRule;
    updateRule(newRule);
  }, [updateRule]);

  // Handle rule update from block
  const handleBlockUpdate = useCallback((path: string[], value: unknown) => {
    if (!rule) return;
    
    const newRule = JSON.parse(JSON.stringify(rule)) as JsonLogicRule;
    let current: unknown = newRule;
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[key];
      }
    }
    
    if (typeof current === 'object' && current !== null) {
      const lastKey = path[path.length - 1];
      (current as Record<string, unknown>)[lastKey] = value;
    }
    
    updateRule(newRule);
  }, [rule, updateRule]);

  // Clear rule
  const handleClear = useCallback(() => {
    updateRule(null);
  }, [updateRule]);

  // Copy rule to clipboard
  const handleCopy = useCallback(async () => {
    if (rule) {
      await navigator.clipboard.writeText(JSON.stringify(rule, null, 2));
    }
  }, [rule]);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Operator Palette */}
      {showPalette && (
        <div className="w-64 border-r flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-medium">Operators</span>
          </div>
          <OperatorPalette onSelectTemplate={handleSelectTemplate} className="flex-1" />
        </div>
      )}

      {/* Builder Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPalette(!showPalette)}
              className={showPalette ? 'bg-accent' : ''}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={handleCopy} disabled={!rule}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleClear} disabled={!rule}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {rule ? (
              <RuleBlock
                rule={rule}
                path={[]}
                onUpdate={handleBlockUpdate}
                onDelete={handleClear}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-muted-foreground mb-4">
                  <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rule defined</p>
                  <p className="text-xs">Select an operator from the palette to start building</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
