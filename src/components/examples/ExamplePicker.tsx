'use client';

import { useState } from 'react';
import { BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { examples, categories, Example } from '@/lib/examples';
import { cn } from '@/lib/utils';

interface ExamplePickerProps {
  onSelect: (rule: string, data: string) => void;
  className?: string;
}

const difficultyColors: Record<Example['difficulty'], string> = {
  beginner: 'bg-green-500/10 text-green-600 dark:text-green-400',
  intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  advanced: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function ExamplePicker({ onSelect, className }: ExamplePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Example['category'] | null>(null);
  const [hoveredExample, setHoveredExample] = useState<string | null>(null);

  const filteredExamples = selectedCategory
    ? examples.filter(e => e.category === selectedCategory)
    : examples;

  const handleExampleClick = (example: Example) => {
    // Add comment above the rule JSON
    const ruleStr = example.comment + '\n' + JSON.stringify(example.rule, null, 2);
    const dataStr = JSON.stringify(example.sampleData, null, 2);
    onSelect(ruleStr, dataStr);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Examples</span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1 p-2 border-b">
        <Button
          variant={selectedCategory === null ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="h-7 text-xs"
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="h-7 text-xs"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Examples List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredExamples.map(example => (
            <button
              key={example.id}
              onClick={() => handleExampleClick(example)}
              onMouseEnter={() => setHoveredExample(example.id)}
              onMouseLeave={() => setHoveredExample(null)}
              className={cn(
                'w-full text-left p-2 rounded-md transition-colors',
                'hover:bg-accent',
                hoveredExample === example.id && 'bg-accent'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {example.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px] px-1.5 py-0', difficultyColors[example.difficulty])}
                    >
                      {example.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {example.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer with random generator */}
      <div className="p-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => {
            const randomExample = examples[Math.floor(Math.random() * examples.length)];
            handleExampleClick(randomExample);
          }}
        >
          <Sparkles className="h-3 w-3" />
          Random Example
        </Button>
      </div>
    </div>
  );
}
