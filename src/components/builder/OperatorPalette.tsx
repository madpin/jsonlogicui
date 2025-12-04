'use client';

import { useState } from 'react';
import { 
  Scale, GitBranch, Calculator, List, Type, Database, 
  ChevronRight, Search 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ruleTemplates, templateCategories, RuleTemplate } from '@/lib/builder/templates';
import { cn } from '@/lib/utils';

interface OperatorPaletteProps {
  onSelectTemplate: (template: RuleTemplate) => void;
  className?: string;
}

const categoryIcons: Record<string, typeof Scale> = {
  Scale,
  GitBranch,
  Calculator,
  List,
  Type,
  Database,
};

export function OperatorPalette({ onSelectTemplate, className }: OperatorPaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState<RuleTemplate['category'] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = ruleTemplates.filter(template => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-md border-0 focus:ring-1 focus:ring-ring"
          />
        </div>
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
        {templateCategories.map(cat => {
          const Icon = categoryIcons[cat.icon] || Scale;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="h-7 text-xs gap-1"
            >
              <Icon className="h-3 w-3" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Templates List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={cn(
                'w-full text-left p-2 rounded-md transition-colors',
                'hover:bg-accent group'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{template.name}</div>
                  <p className="text-xs text-muted-foreground truncate">
                    {template.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Preview */}
              <pre className="mt-1 text-[10px] text-muted-foreground bg-muted p-1 rounded overflow-hidden whitespace-nowrap text-ellipsis">
                {JSON.stringify(template.template)}
              </pre>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
