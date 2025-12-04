// JSONLogic Type Definitions

// All supported JSONLogic operators
export const JSON_LOGIC_OPERATORS = [
  // Logical operators
  'if', '==', '===', '!=', '!==', '!', '!!', 'or', 'and',
  // Numeric operators
  '>', '>=', '<', '<=', 'max', 'min', '+', '-', '*', '/', '%',
  // Array operators
  'map', 'filter', 'reduce', 'all', 'none', 'some', 'merge', 'in',
  // String operators
  'cat', 'substr',
  // Data access
  'var', 'missing', 'missing_some',
  // Misc
  'log'
] as const;

export type JsonLogicOperator = typeof JSON_LOGIC_OPERATORS[number];

// Primitive types that can appear in JSONLogic
export type JsonLogicPrimitive = string | number | boolean | null;

// A JSONLogic rule can be:
// - A primitive value (string, number, boolean, null)
// - An array of rules
// - An object with a single operator key
export type JsonLogicRule = 
  | JsonLogicPrimitive
  | JsonLogicRule[]
  | { [K in JsonLogicOperator]?: JsonLogicRule | JsonLogicRule[] }
  | { var: string | number | [string | number, JsonLogicRule?] };

// Result of JSON validation
export interface JsonValidationResult {
  valid: boolean;
  error?: string;
  parsedValue?: unknown;
}

// Result of JSONLogic validation
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  message: string;
  path: string[];
  operator?: string;
}

export interface ValidationWarning {
  message: string;
  path: string[];
  suggestion?: string;
}

// Evaluation trace for debugging
export interface EvaluationTrace {
  rule: JsonLogicRule;
  data: Record<string, unknown>;
  result: unknown;
  steps: EvaluationStep[];
  duration: number;
}

export interface EvaluationStep {
  id: string;
  operator: string;
  operands: unknown[];
  result: unknown;
  path: string[];
  children: EvaluationStep[];
}

// Variable information extracted from rules
export interface VariableInfo {
  name: string;
  path: string[];
  defaultValue?: unknown;
  inferredType?: VariableType;
  constraints: Constraint[];
}

export type VariableType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'unknown';

// Constraints extracted from rules
export type Constraint = 
  | NumericConstraint 
  | StringConstraint 
  | ArrayConstraint 
  | BooleanConstraint;

export interface NumericConstraint {
  type: 'numeric';
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=' | 'between';
  value: number;
  upperBound?: number; // For 'between' operator
}

export interface StringConstraint {
  type: 'string';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'length';
  value: string | string[] | number;
}

export interface ArrayConstraint {
  type: 'array';
  operator: 'contains' | 'length' | 'all' | 'some' | 'none';
  value: unknown;
}

export interface BooleanConstraint {
  type: 'boolean';
  operator: 'equals' | 'truthy' | 'falsy';
  value?: boolean;
}

// Helper type guard functions
export function isJsonLogicOperator(key: string): key is JsonLogicOperator {
  return JSON_LOGIC_OPERATORS.includes(key as JsonLogicOperator);
}

export function isJsonLogicRule(value: unknown): value is JsonLogicRule {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonLogicRule);
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return true;
    if (keys.length === 1 && isJsonLogicOperator(keys[0])) {
      return true;
    }
    // Allow objects with multiple keys for multi-rule scenarios
    return keys.every(key => isJsonLogicOperator(key));
  }
  return false;
}
