'use client';

import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultDisplayProps {
  result: unknown;
  error?: string;
  duration?: number;
  className?: string;
}

export function ResultDisplay({
  result,
  error,
  duration,
  className,
}: ResultDisplayProps) {
  const isError = !!error;
  const resultString = isError 
    ? error 
    : result === undefined 
      ? 'No result' 
      : JSON.stringify(result, null, 2);

  const resultType = typeof result;
  const isBooleanTrue = resultType === 'boolean' && result === true;
  const isBooleanFalse = resultType === 'boolean' && result === false;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Result Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isError ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : isBooleanTrue ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isBooleanFalse ? (
            <XCircle className="h-4 w-4 text-orange-500" />
          ) : (
            <Zap className="h-4 w-4 text-blue-500" />
          )}
          <span className="text-sm font-medium">
            Result {!isError && `(${resultType})`}
          </span>
        </div>
        {duration !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {duration.toFixed(2)}ms
          </div>
        )}
      </div>

      {/* Result Value */}
      <div
        className={cn(
          'rounded-md p-3 font-mono text-sm',
          isError
            ? 'bg-red-500/10 text-red-500'
            : isBooleanTrue
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : isBooleanFalse
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                : 'bg-muted text-foreground'
        )}
      >
        <pre className="whitespace-pre-wrap break-all">{resultString}</pre>
      </div>
    </div>
  );
}
