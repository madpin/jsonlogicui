'use client';

import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { JsonLogicRule } from '@/types/jsonlogic';
import { humanizeRule } from '@/lib/jsonlogic/humanizer';
import { cn } from '@/lib/utils';

interface HumanReadableProps {
  rule: JsonLogicRule | null;
  className?: string;
}

export function HumanReadable({ rule, className }: HumanReadableProps) {
  const humanized = useMemo(() => {
    if (!rule) return null;
    try {
      return humanizeRule(rule);
    } catch (e) {
      console.error('Failed to humanize rule:', e);
      return null;
    }
  }, [rule]);

  if (!rule || !humanized) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground text-sm', className)}>
        Enter a valid JSONLogic rule to see human-readable format
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Human Readable</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
          {humanized}
        </pre>
      </div>
    </div>
  );
}
