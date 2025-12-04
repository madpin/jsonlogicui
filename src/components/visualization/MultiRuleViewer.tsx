'use client';

import { useState, useMemo } from 'react';
import { TreeDeciduous, GitBranch, FileText, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { RuleTree } from '@/components/tree/RuleTree';
import { MermaidPreview } from '@/components/mermaid/MermaidPreview';
import { MermaidExport } from '@/components/mermaid/MermaidExport';
import { HumanReadable } from '@/components/editor/HumanReadable';
import { parseRuleToTree } from '@/lib/tree/parser';
import { toMermaidFlowchart } from '@/lib/mermaid/converter';
import { humanizeRule } from '@/lib/jsonlogic/humanizer';
import { JsonLogicRule } from '@/types/jsonlogic';
import { TreeNode } from '@/types/tree';
import { cn } from '@/lib/utils';

interface RuleEntry {
  key: string;
  rule: JsonLogicRule;
  tree: TreeNode | null;
  mermaid: string;
  humanized: string;
}

interface MultiRuleViewerProps {
  parsedValue: unknown;
  className?: string;
}

// Check if the first key is a JSONLogic operator
const JSON_LOGIC_OPERATORS = [
  'var', 'missing', 'missing_some',
  'if', '?:', '==', '===', '!=', '!==', '!', '!!', 'or', 'and',
  '>', '>=', '<', '<=', 'max', 'min', '+', '-', '*', '/', '%',
  'map', 'filter', 'reduce', 'all', 'some', 'none', 'merge', 'in',
  'cat', 'substr', 'log', 'method', 'preserve'
];

function isMultiRuleObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  
  // If first key is an operator, it's a single rule
  return !JSON_LOGIC_OPERATORS.includes(keys[0]);
}

export function MultiRuleViewer({ parsedValue, className }: MultiRuleViewerProps) {
  const [activeRuleKey, setActiveRuleKey] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<string>('tree');

  // Parse rules into entries
  const ruleEntries = useMemo<RuleEntry[]>(() => {
    if (!parsedValue) return [];
    
    try {
      if (isMultiRuleObject(parsedValue)) {
        // Multi-rule object
        return Object.entries(parsedValue as Record<string, unknown>).map(([key, rule]) => {
          const jsonRule = rule as JsonLogicRule;
          return {
            key,
            rule: jsonRule,
            tree: parseRuleToTree(jsonRule),
            mermaid: toMermaidFlowchart(jsonRule),
            humanized: humanizeRule(jsonRule),
          };
        });
      } else {
        // Single rule
        const jsonRule = parsedValue as JsonLogicRule;
        return [{
          key: 'rule',
          rule: jsonRule,
          tree: parseRuleToTree(jsonRule),
          mermaid: toMermaidFlowchart(jsonRule),
          humanized: humanizeRule(jsonRule),
        }];
      }
    } catch (e) {
      console.error('Failed to parse rules:', e);
      return [];
    }
  }, [parsedValue]);

  // Set initial active rule
  useMemo(() => {
    if (ruleEntries.length > 0 && !activeRuleKey) {
      setActiveRuleKey(ruleEntries[0].key);
    }
  }, [ruleEntries, activeRuleKey]);

  // Get current rule entry
  const currentEntry = ruleEntries.find(e => e.key === activeRuleKey) || ruleEntries[0];

  if (ruleEntries.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        Enter a valid JSONLogic rule to visualize
      </div>
    );
  }

  const hasMultipleRules = ruleEntries.length > 1;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Rule Keys Tabs (if multiple rules) */}
      {hasMultipleRules && (
        <div className="border-b bg-muted/30">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1 p-2">
              {ruleEntries.map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => setActiveRuleKey(entry.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent',
                    activeRuleKey === entry.key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground'
                  )}
                >
                  <Key className="h-3 w-3" />
                  {entry.key}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* View Type Tabs */}
      <Tabs value={activeViewTab} onValueChange={setActiveViewTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <TabsList>
            <TabsTrigger value="tree" className="gap-1.5">
              <TreeDeciduous className="h-3 w-3" />
              Tree
            </TabsTrigger>
            <TabsTrigger value="mermaid" className="gap-1.5">
              <GitBranch className="h-3 w-3" />
              Diagram
            </TabsTrigger>
            <TabsTrigger value="readable" className="gap-1.5">
              <FileText className="h-3 w-3" />
              Readable
            </TabsTrigger>
          </TabsList>
          {activeViewTab === 'mermaid' && currentEntry?.mermaid && (
            <MermaidExport code={currentEntry.mermaid} />
          )}
        </div>

        <TabsContent value="tree" className="flex-1 m-0 overflow-hidden">
          <RuleTree root={currentEntry?.tree || null} />
        </TabsContent>

        <TabsContent value="mermaid" className="flex-1 m-0 overflow-hidden">
          <MermaidPreview code={currentEntry?.mermaid || ''} />
        </TabsContent>

        <TabsContent value="readable" className="flex-1 m-0 overflow-hidden">
          <HumanReadable rule={currentEntry?.rule || null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
