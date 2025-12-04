'use client';

import { CheckCircle2, XCircle, AlertTriangle, Info, Key } from 'lucide-react';
import { ValidationResult, JsonValidationResult } from '@/types/jsonlogic';
import { MultiRuleValidationResult } from '@/lib/jsonlogic/validator';
import { cn } from '@/lib/utils';

interface ValidationStatusProps {
  jsonValidation: JsonValidationResult;
  logicValidation: ValidationResult | null;
  multiRuleValidation?: MultiRuleValidationResult | null;
  className?: string;
}

export function ValidationStatus({
  jsonValidation,
  logicValidation,
  multiRuleValidation,
  className,
}: ValidationStatusProps) {
  const hasJsonError = !jsonValidation.valid;
  const isMultiRule = multiRuleValidation?.isMultiRule ?? false;
  
  // For multi-rule, use multiRuleValidation; otherwise use logicValidation
  const overallValid = isMultiRule 
    ? multiRuleValidation?.overallValid ?? false
    : logicValidation?.valid ?? false;
  
  const hasLogicErrors = isMultiRule
    ? !multiRuleValidation?.overallValid
    : logicValidation && logicValidation.errors.length > 0;
    
  const hasWarnings = !isMultiRule && logicValidation && logicValidation.warnings.length > 0;
  const isFullyValid = jsonValidation.valid && overallValid;

  return (
    <div className={cn('space-y-2', className)}>
      {/* JSON Syntax Status */}
      <div className="flex items-center gap-2">
        {jsonValidation.valid ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          JSON Syntax: {jsonValidation.valid ? 'Valid' : 'Invalid'}
        </span>
      </div>

      {/* JSON Error Details */}
      {hasJsonError && jsonValidation.error && (
        <div className="ml-6 rounded-md bg-red-500/10 p-2 text-sm text-red-500">
          {jsonValidation.error}
        </div>
      )}

      {/* Multi-Rule Validation */}
      {jsonValidation.valid && isMultiRule && multiRuleValidation && (
        <>
          <div className="flex items-center gap-2">
            {isFullyValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              Multi-Rule: {multiRuleValidation.rules.length} rules {isFullyValid ? '(all valid)' : '(has errors)'}
            </span>
          </div>
          
          {/* Individual rule status */}
          <div className="ml-6 space-y-1">
            {multiRuleValidation.rules.map(({ key, result }) => (
              <div
                key={key}
                className={cn(
                  'flex items-start gap-2 rounded-md p-2 text-sm',
                  result.valid 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-500'
                )}
              >
                {result.valid ? (
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Key className="h-3 w-3" />
                    <span className="font-medium">{key}</span>
                    <span className="text-xs opacity-75">
                      {result.valid ? '✓ valid' : '✗ invalid'}
                    </span>
                  </div>
                  {/* Show errors for this rule */}
                  {result.errors.length > 0 && (
                    <div className="mt-1 text-xs space-y-0.5">
                      {result.errors.map((error, i) => (
                        <div key={i}>
                          {error.message}
                          {error.path.length > 0 && (
                            <span className="opacity-75"> at {error.path.join('.')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Single Rule JSONLogic Validity Status */}
      {jsonValidation.valid && !isMultiRule && (
        <div className="flex items-center gap-2">
          {isFullyValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : hasLogicErrors ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            JSONLogic: {isFullyValid ? 'Valid' : hasLogicErrors ? 'Invalid' : 'Valid with warnings'}
          </span>
        </div>
      )}

      {/* Logic Errors (single rule) */}
      {!isMultiRule && hasLogicErrors && logicValidation && (
        <div className="ml-6 space-y-1">
          {logicValidation.errors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md bg-red-500/10 p-2 text-sm text-red-500"
            >
              <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <div>
                <span>{error.message}</span>
                {error.path.length > 0 && (
                  <span className="ml-1 text-red-400">
                    at {error.path.join('.')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && logicValidation && (
        <div className="ml-6 space-y-1">
          {logicValidation.warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md bg-yellow-500/10 p-2 text-sm text-yellow-600 dark:text-yellow-400"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <div>
                <span>{warning.message}</span>
                {warning.suggestion && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    {warning.suggestion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
