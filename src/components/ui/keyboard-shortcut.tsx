'use client';

import { cn } from '@/lib/utils';

interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <span key={index}>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border rounded">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="mx-0.5 text-muted-foreground">+</span>}
        </span>
      ))}
    </span>
  );
}
