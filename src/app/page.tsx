'use client';

import { useState, useCallback, useEffect } from 'react';
import { Play, Moon, Sun, Github, BookOpen, Wand2, Blocks, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { JsonEditor } from '@/components/editor/JsonEditor';
import { DataEditor } from '@/components/editor/DataEditor';
import { ValidationStatus } from '@/components/editor/ValidationStatus';
import { ResultDisplay } from '@/components/editor/ResultDisplay';
import { ExamplePicker } from '@/components/examples/ExamplePicker';
import { DataGenerator } from '@/components/generator/DataGenerator';
import { ResizablePanel } from '@/components/ui/resizable-panel';
import { RuleBuilder } from '@/components/builder/RuleBuilder';
import { MultiRuleViewer } from '@/components/visualization/MultiRuleViewer';
import { validateJson, validateJsonLogic, validateMultiRuleJsonLogic, MultiRuleValidationResult } from '@/lib/jsonlogic/validator';
import { evaluateWithTrace } from '@/lib/jsonlogic/evaluator';
import { extractVariables } from '@/lib/jsonlogic/analyzer';
import { JsonLogicRule, ValidationResult, JsonValidationResult } from '@/types/jsonlogic';

// Multi-rule example with comments
const DEFAULT_RULE = `// Multi-rule JSONLogic Example
// Each key produces a separate output value
//
// This example determines:
// - group_id: Which tab group to show
// - tab_label: Human-readable label for the tab
{
  "group_id": {
    "if": [
      // Condition: Check if rep role matches opportunity role
      { "==": [{ "var": "rep.role" }, { "var": "opportunity.target_role" }] },
      // If true: Return "TAB_A" (focus tab)
      "TAB_A",
      // If false: Return "TAB_B" (collaboration tab)
      "TAB_B"
    ]
  },
  "tab_label": {
    "if": [
      // Same condition as above
      { "==": [{ "var": "rep.role" }, { "var": "opportunity.target_role" }] },
      // Labels for each case
      "My Focus",
      "Collaboration Opportunities"
    ]
  }
}`;

const DEFAULT_DATA = `{
  "rep": {
    "role": "sales"
  },
  "opportunity": {
    "target_role": "sales"
  }
}`;

export default function Home() {
  const [ruleText, setRuleText] = useState(DEFAULT_RULE);
  const [dataText, setDataText] = useState(DEFAULT_DATA);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('visualize');
  const [showExamples, setShowExamples] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Validation states
  const [jsonValidation, setJsonValidation] = useState<JsonValidationResult>({ valid: true });
  const [logicValidation, setLogicValidation] = useState<ValidationResult | null>(null);
  const [multiRuleValidation, setMultiRuleValidation] = useState<MultiRuleValidationResult | null>(null);
  const [dataValidation, setDataValidation] = useState<JsonValidationResult>({ valid: true });

  // Evaluation state
  const [result, setResult] = useState<unknown>(undefined);
  const [evalError, setEvalError] = useState<string | undefined>();
  const [evalDuration, setEvalDuration] = useState<number | undefined>();

  // Parsed value (can be single rule or multi-rule object)
  const [parsedValue, setParsedValue] = useState<unknown>(() => {
    try {
      // Strip comments for initial parse
      const stripped = ruleText.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      return JSON.parse(stripped);
    } catch {
      return null;
    }
  });
  
  const [variables, setVariables] = useState<string[]>([]);

  // Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Validate and parse rule with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const jsonResult = validateJson(ruleText);
      setJsonValidation(jsonResult);

      if (jsonResult.valid && jsonResult.parsedValue !== undefined) {
        // Use multi-rule validation which handles both single and multi-rule
        const multiResult = validateMultiRuleJsonLogic(jsonResult.parsedValue);
        setMultiRuleValidation(multiResult);
        
        // Also set single-rule validation for backwards compatibility
        const logicResult = validateJsonLogic(jsonResult.parsedValue);
        setLogicValidation(logicResult);

        setParsedValue(jsonResult.parsedValue);
        
        // Extract variables from all rules
        try {
          const allVars: string[] = [];
          if (multiResult.isMultiRule) {
            // Multi-rule object
            for (const { key } of multiResult.rules) {
              const rule = (jsonResult.parsedValue as Record<string, unknown>)[key];
              allVars.push(...extractVariables(rule as JsonLogicRule));
            }
          } else {
            allVars.push(...extractVariables(jsonResult.parsedValue as JsonLogicRule));
          }
          setVariables([...new Set(allVars)]);
        } catch {
          setVariables([]);
        }
      } else {
        setLogicValidation(null);
        setMultiRuleValidation(null);
        setParsedValue(null);
        setVariables([]);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [ruleText]);

  // Validate data
  useEffect(() => {
    const result = validateJson(dataText);
    setDataValidation(result);
  }, [dataText]);

  // Evaluate rule(s)
  const handleEvaluate = useCallback(() => {
    if (!parsedValue || !dataValidation.valid) {
      setEvalError('Invalid rule or data');
      return;
    }

    try {
      const data = JSON.parse(dataText) as Record<string, unknown>;
      
      // Check if it's a multi-rule object
      const jsonLogicOps = ['var', 'if', '?:', '==', '===', '!=', '!==', '!', '!!', 'or', 'and', '>', '>=', '<', '<=', 'max', 'min', '+', '-', '*', '/', '%', 'map', 'filter', 'reduce', 'all', 'some', 'none', 'merge', 'in', 'cat', 'substr', 'log'];
      const keys = typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue) 
        ? Object.keys(parsedValue) 
        : [];
      
      if (keys.length > 0 && !jsonLogicOps.includes(keys[0])) {
        // Multi-rule: evaluate each rule
        const results: Record<string, unknown> = {};
        let totalDuration = 0;
        
        for (const [key, rule] of Object.entries(parsedValue as Record<string, unknown>)) {
          const trace = evaluateWithTrace(rule as JsonLogicRule, data);
          results[key] = trace.result;
          totalDuration += trace.duration || 0;
        }
        
        setResult(results);
        setEvalDuration(totalDuration);
      } else {
        // Single rule
        const trace = evaluateWithTrace(parsedValue as JsonLogicRule, data);
        setResult(trace.result);
        setEvalDuration(trace.duration);
      }
      
      setEvalError(undefined);
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'Evaluation failed');
      setResult(undefined);
      setEvalDuration(undefined);
    }
  }, [parsedValue, dataText, dataValidation.valid]);

  // Handle example selection
  const handleExampleSelect = useCallback((rule: string, data: string) => {
    setRuleText(rule);
    setDataText(data);
    setShowExamples(false);
  }, []);

  // Handle generated data selection
  const handleDataSelect = useCallback((data: string) => {
    setDataText(data);
    setShowGenerator(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleEvaluate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEvaluate]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">JSONLogic UI</h1>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">Visual Editor & Debugger</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowExamples(!showExamples)}
            className={showExamples ? 'bg-accent' : ''}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowGenerator(!showGenerator)}
            className={showGenerator ? 'bg-accent' : ''}
          >
            <Wand2 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon-sm" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Examples/Generator */}
        {(showExamples || showGenerator) && (
          <ResizablePanel
            defaultWidth={288}
            minWidth={200}
            maxWidth={500}
            side="right"
            className="border-r flex flex-col"
          >
            {showExamples && (
              <ExamplePicker onSelect={handleExampleSelect} className="flex-1" />
            )}
            {showGenerator && !showExamples && (
              <DataGenerator rule={parsedValue as JsonLogicRule} onSelectData={handleDataSelect} className="flex-1" />
            )}
          </ResizablePanel>
        )}

        {/* Editor Panel */}
        <ResizablePanel
          defaultWidth={400}
          minWidth={300}
          maxWidth={700}
          side="right"
          className="flex flex-col border-r"
        >
          {/* Rule Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-medium">JSONLogic Rule</span>
            </div>
            <div className="flex-1 min-h-0">
              <JsonEditor value={ruleText} onChange={setRuleText} />
            </div>
          </div>

          {/* Validation Status */}
          <div className="border-t p-3">
            <ValidationStatus
              jsonValidation={jsonValidation}
              logicValidation={logicValidation}
              multiRuleValidation={multiRuleValidation}
            />
          </div>

          {/* Data Editor */}
          <div className="border-t">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-medium">Test Data</span>
              <Button size="sm" onClick={handleEvaluate} className="gap-1.5">
                <Play className="h-3 w-3" />
                Evaluate
              </Button>
            </div>
            <div className="h-[150px]">
              <DataEditor value={dataText} onChange={setDataText} variables={variables} />
            </div>
          </div>

          {/* Result */}
          <div className="border-t p-3">
            <ResultDisplay result={result} error={evalError} duration={evalDuration} />
          </div>
        </ResizablePanel>

        {/* Visualization Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <TabsList>
                <TabsTrigger value="visualize" className="gap-1.5">
                  <GitBranch className="h-3 w-3" />
                  Visualize
                </TabsTrigger>
                <TabsTrigger value="builder" className="gap-1.5">
                  <Blocks className="h-3 w-3" />
                  Builder
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="visualize" className="flex-1 m-0 overflow-hidden">
              <MultiRuleViewer parsedValue={parsedValue} />
            </TabsContent>

            <TabsContent value="builder" className="flex-1 m-0 overflow-hidden">
              <RuleBuilder
                initialRule={parsedValue as JsonLogicRule || undefined}
                onRuleChange={(rule) => {
                  if (rule) {
                    setRuleText(JSON.stringify(rule, null, 2));
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
