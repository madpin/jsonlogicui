'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
  className?: string;
}

export function ResizablePanel({
  children,
  defaultWidth,
  minWidth = 200,
  maxWidth = 600,
  side = 'right',
  className,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (side === 'right') {
        newWidth = e.clientX - panelRect.left;
      } else {
        newWidth = panelRect.right - e.clientX;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth, side]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={panelRef}
      className={cn('relative flex-shrink-0', className)}
      style={{ width }}
    >
      {children}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-1 cursor-col-resize z-10 group',
          'hover:bg-primary/20 active:bg-primary/30',
          'transition-colors duration-150',
          side === 'right' ? 'right-0' : 'left-0'
        )}
        onMouseDown={startResizing}
      >
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-1 h-8 rounded-full',
            'bg-border group-hover:bg-primary/50 transition-colors',
            side === 'right' ? 'right-0' : 'left-0'
          )}
        />
      </div>
    </div>
  );
}
