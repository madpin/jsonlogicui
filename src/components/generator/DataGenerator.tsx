'use client';

import { useState, useMemo } from 'react';
import { Wand2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonLogicRule, VariableInfo } from '@/types/jsonlogic';
import { extractVariableInfo } from '@/lib/jsonlogic/analyzer';
import { generateTestScenarios, TestScenario } from '@/lib/generator/ScenarioGenerator';
import { cn } from '@/lib/utils';

interface DataGeneratorProps {
  rule: JsonLogicRule | null;
  onSelectData: (data: string) => void;
  className?: string;
}

const scenarioTypeColors: Record<TestScenario['type'], string> = {
  happy: 'bg-green-500/10 text-green-600 dark:text-green-400',
  boundary: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  failure: 'bg-red-500/10 text-red-600 dark:text-red-400',
  random: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

const typeLabels: Record<VariableInfo['inferredType'] & string, string> = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  array: 'Array',
  object: 'Object',
  unknown: 'Unknown',
};

export function DataGenerator({ rule, onSelectData, className }: DataGeneratorProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [regenerateKey, setRegenerateKey] = useState(0);

  // Extract variables from rule
  const variables = useMemo(() => {
    if (!rule) return [];
    return extractVariableInfo(rule);
  }, [rule]);

  // Generate test scenarios
  const scenarios = useMemo(() => {
    if (!rule) return [];
    return generateTestScenarios(rule);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule, regenerateKey]);

  const handleSelectScenario = (scenario: TestScenario) => {
    setSelectedScenario(scenario.name);
    onSelectData(JSON.stringify(scenario.data, null, 2));
  };

  const handleRegenerate = () => {
    setRegenerateKey(k => k + 1);
  };

  if (!rule) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground text-sm', className)}>
        Enter a valid JSONLogic rule to generate test data
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Data Generator</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleRegenerate}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Detected Variables */}
      {variables.length > 0 && (
        <div className="p-3 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Detected Variables
          </div>
          <div className="flex flex-wrap gap-1">
            {variables.map(v => (
              <Badge key={v.name} variant="outline" className="text-xs gap-1">
                <span className="font-mono">{v.name}</span>
                <span className="text-muted-foreground">
                  ({typeLabels[v.inferredType || 'unknown']})
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Scenarios */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {scenarios.map((scenario, index) => (
            <button
              key={`${scenario.name}-${index}`}
              onClick={() => handleSelectScenario(scenario)}
              className={cn(
                'w-full text-left p-2 rounded-md transition-colors',
                'hover:bg-accent',
                selectedScenario === scenario.name && 'bg-accent'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {scenario.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px] px-1.5 py-0', scenarioTypeColors[scenario.type])}
                    >
                      {scenario.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scenario.description}
                  </p>
                </div>
                {selectedScenario === scenario.name && (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </div>
              
              {/* Preview data */}
              <pre className="mt-2 text-[10px] bg-muted p-1.5 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                {JSON.stringify(scenario.data)}
              </pre>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* No scenarios message */}
      {scenarios.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
          <span className="text-sm">No variables detected in rule</span>
        </div>
      )}
    </div>
  );
}
