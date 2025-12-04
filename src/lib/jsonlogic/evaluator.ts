import jsonLogic from 'json-logic-js';
import { JsonLogicRule, EvaluationTrace, EvaluationStep } from '@/types/jsonlogic';

// Type assertion helper for json-logic-js compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyLogic = (rule: JsonLogicRule, data: Record<string, unknown>): unknown => 
  jsonLogic.apply(rule as any, data);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTruthyValue = (value: unknown): boolean => jsonLogic.truthy(value as any);

let stepIdCounter = 0;

function generateStepId(): string {
  return `step-${++stepIdCounter}`;
}

/**
 * Evaluate a JSONLogic rule against data
 */
export function evaluate(rule: JsonLogicRule, data: Record<string, unknown> = {}): unknown {
  try {
    return applyLogic(rule, data);
  } catch (error) {
    throw new Error(`Evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Evaluate a JSONLogic rule with detailed trace information
 */
export function evaluateWithTrace(
  rule: JsonLogicRule, 
  data: Record<string, unknown> = {}
): EvaluationTrace {
  stepIdCounter = 0;
  const startTime = performance.now();
  const steps: EvaluationStep[] = [];
  
  try {
    const result = traceEvaluation(rule, data, [], steps);
    const duration = performance.now() - startTime;
    
    return {
      rule,
      data,
      result,
      steps,
      duration
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      rule,
      data,
      result: error instanceof Error ? error.message : 'Evaluation error',
      steps,
      duration
    };
  }
}

function traceEvaluation(
  rule: JsonLogicRule,
  data: Record<string, unknown>,
  path: string[],
  steps: EvaluationStep[]
): unknown {
  // Primitives evaluate to themselves
  if (rule === null || typeof rule !== 'object') {
    return rule;
  }
  
  // Arrays: evaluate each element
  if (Array.isArray(rule)) {
    return rule.map((item, index) => 
      traceEvaluation(item, data, [...path, `[${index}]`], steps)
    );
  }
  
  // Object with operator
  const keys = Object.keys(rule);
  if (keys.length === 0) {
    return rule;
  }
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  // Create step for this operation
  const step: EvaluationStep = {
    id: generateStepId(),
    operator,
    operands: Array.isArray(operands) ? operands : [operands],
    result: undefined,
    path,
    children: []
  };
  
  // Evaluate operands recursively (for tracing)
  if (Array.isArray(operands)) {
    operands.forEach((op, i) => {
      if (op !== null && typeof op === 'object') {
        const childSteps: EvaluationStep[] = [];
        traceEvaluation(op as JsonLogicRule, data, [...path, operator, `[${i}]`], childSteps);
        step.children.push(...childSteps);
      }
    });
  } else if (operands !== null && typeof operands === 'object') {
    const childSteps: EvaluationStep[] = [];
    traceEvaluation(operands as JsonLogicRule, data, [...path, operator], childSteps);
    step.children.push(...childSteps);
  }
  
  // Evaluate the actual result using json-logic-js
  step.result = applyLogic(rule, data);
  steps.push(step);
  
  return step.result;
}

/**
 * Safe evaluation that catches errors and returns a result object
 */
export function safeEvaluate(
  rule: JsonLogicRule, 
  data: Record<string, unknown> = {}
): { success: boolean; result?: unknown; error?: string } {
  try {
    const result = evaluate(rule, data);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if a rule would evaluate to truthy
 */
export function isTruthy(rule: JsonLogicRule, data: Record<string, unknown> = {}): boolean {
  try {
    return isTruthyValue(evaluate(rule, data));
  } catch {
    return false;
  }
}

/**
 * Add a custom operation to json-logic-js
 */
export function addOperation(
  name: string, 
  fn: (...args: unknown[]) => unknown
): void {
  jsonLogic.add_operation(name, fn);
}

/**
 * Remove a custom operation
 */
export function removeOperation(name: string): void {
  jsonLogic.rm_operation(name);
}
