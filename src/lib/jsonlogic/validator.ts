import { 
  JsonValidationResult, 
  ValidationResult, 
  ValidationError,
  ValidationWarning,
  isJsonLogicOperator,
  JSON_LOGIC_OPERATORS
} from '@/types/jsonlogic';

/**
 * Strip comments from JSON-like string (supports // and /* *\/ comments)
 */
export function stripComments(input: string): string {
  // Remove single-line comments (// ...)
  let result = input.replace(/\/\/.*$/gm, '');
  
  // Remove multi-line comments (/* ... */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  return result;
}

/**
 * Validates if a string is valid JSON (with optional comment support)
 */
export function validateJson(input: string): JsonValidationResult {
  if (!input.trim()) {
    return { valid: false, error: 'Input is empty' };
  }
  
  // First try with comments stripped
  const stripped = stripComments(input);
  
  try {
    const parsed = JSON.parse(stripped);
    return { valid: true, parsedValue: parsed };
  } catch (e) {
    // Try original input in case it's valid JSON
    try {
      const parsed = JSON.parse(input);
      return { valid: true, parsedValue: parsed };
    } catch {
      const error = e instanceof Error ? e.message : 'Invalid JSON';
      return { valid: false, error };
    }
  }
}

/**
 * Check if the value is a multi-rule object (keys are rule names, not operators)
 */
export function isMultiRuleObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  
  // If first key is an operator, it's a single rule
  return !isJsonLogicOperator(keys[0]);
}

/**
 * Result for multi-rule validation
 */
export interface MultiRuleValidationResult {
  isMultiRule: boolean;
  rules: {
    key: string;
    result: ValidationResult;
  }[];
  overallValid: boolean;
}

/**
 * Validates if a parsed value is valid JSONLogic (single rule or multi-rule object)
 */
export function validateJsonLogic(rule: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check if it's a multi-rule object
  if (isMultiRuleObject(rule)) {
    // For multi-rule, we don't report errors at the top level
    // The UI should use validateMultiRuleJsonLogic instead
    return {
      valid: true,
      errors: [],
      warnings: [{
        message: 'Multi-rule object detected',
        path: [],
        suggestion: 'Each key contains a separate JSONLogic rule'
      }]
    };
  }
  
  validateNode(rule, [], errors, warnings);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a multi-rule object, returning results for each rule
 */
export function validateMultiRuleJsonLogic(value: unknown): MultiRuleValidationResult {
  if (!isMultiRuleObject(value)) {
    // Single rule
    const result = validateSingleRule(value);
    return {
      isMultiRule: false,
      rules: [{ key: 'rule', result }],
      overallValid: result.valid
    };
  }
  
  // Multi-rule object
  const rules: { key: string; result: ValidationResult }[] = [];
  let overallValid = true;
  
  for (const [key, rule] of Object.entries(value as Record<string, unknown>)) {
    const result = validateSingleRule(rule);
    rules.push({ key, result });
    if (!result.valid) {
      overallValid = false;
    }
  }
  
  return {
    isMultiRule: true,
    rules,
    overallValid
  };
}

/**
 * Validates a single JSONLogic rule
 */
function validateSingleRule(rule: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  validateNode(rule, [], errors, warnings);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateNode(
  node: unknown, 
  path: string[], 
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Primitives are always valid
  if (node === null || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return;
  }
  
  // Arrays: validate each element
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      validateNode(item, [...path, `[${index}]`], errors, warnings);
    });
    return;
  }
  
  // Objects: must have operator keys
  if (typeof node === 'object') {
    const keys = Object.keys(node);
    
    if (keys.length === 0) {
      warnings.push({
        message: 'Empty object found',
        path,
        suggestion: 'Consider using null or removing this object'
      });
      return;
    }
    
    // Check for multiple operator keys (valid but worth noting)
    const operatorKeys = keys.filter(isJsonLogicOperator);
    const unknownKeys = keys.filter(k => !isJsonLogicOperator(k));
    
    if (unknownKeys.length > 0) {
      unknownKeys.forEach(key => {
        errors.push({
          message: `Unknown operator: "${key}"`,
          path: [...path, key],
          operator: key
        });
      });
    }
    
    if (operatorKeys.length > 1) {
      warnings.push({
        message: `Multiple operators in single object: ${operatorKeys.join(', ')}`,
        path,
        suggestion: 'JSONLogic typically expects one operator per object'
      });
    }
    
    // Validate each operator's arguments
    operatorKeys.forEach(op => {
      const value = (node as Record<string, unknown>)[op];
      validateOperatorArgs(op, value, [...path, op], errors, warnings);
    });
  }
}

function validateOperatorArgs(
  operator: string,
  args: unknown,
  path: string[],
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Validate based on operator type
  switch (operator) {
    case 'var':
      validateVarOperator(args, path, errors);
      break;
    case 'if':
      validateIfOperator(args, path, errors, warnings);
      break;
    case 'and':
    case 'or':
      validateLogicalOperator(args, path, errors, warnings);
      break;
    case '==':
    case '===':
    case '!=':
    case '!==':
    case '>':
    case '>=':
    case '<':
    case '<=':
      validateComparisonOperator(args, path, errors, warnings);
      break;
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
      validateArithmeticOperator(args, path, errors, warnings);
      break;
    case 'map':
    case 'filter':
    case 'reduce':
      validateArrayIterator(operator, args, path, errors, warnings);
      break;
    default:
      // For other operators, just validate children recursively
      if (Array.isArray(args)) {
        args.forEach((arg, i) => validateNode(arg, [...path, `[${i}]`], errors, warnings));
      } else {
        validateNode(args, path, errors, warnings);
      }
  }
}

function validateVarOperator(args: unknown, path: string[], errors: ValidationError[]): void {
  if (args === '' || args === null) {
    // Empty var returns entire data object - valid
    return;
  }
  
  if (typeof args === 'string' || typeof args === 'number') {
    return;
  }
  
  if (Array.isArray(args)) {
    if (args.length === 0 || args.length > 2) {
      errors.push({
        message: 'var operator expects 1 or 2 arguments (path and optional default)',
        path,
        operator: 'var'
      });
    }
    return;
  }
  
  errors.push({
    message: 'var operator expects a string, number, or array argument',
    path,
    operator: 'var'
  });
}

function validateIfOperator(
  args: unknown, 
  path: string[], 
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!Array.isArray(args)) {
    errors.push({
      message: 'if operator expects an array of arguments',
      path,
      operator: 'if'
    });
    return;
  }
  
  if (args.length < 2) {
    errors.push({
      message: 'if operator requires at least 2 arguments (condition and then)',
      path,
      operator: 'if'
    });
    return;
  }
  
  if (args.length % 2 === 0) {
    warnings.push({
      message: 'if operator has no else clause',
      path,
      suggestion: 'Consider adding a default else value'
    });
  }
  
  args.forEach((arg, i) => validateNode(arg, [...path, `[${i}]`], errors, warnings));
}

function validateLogicalOperator(
  args: unknown,
  path: string[],
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!Array.isArray(args)) {
    // Single argument is valid for and/or
    validateNode(args, path, errors, warnings);
    return;
  }
  
  if (args.length === 0) {
    warnings.push({
      message: 'Logical operator with no arguments',
      path
    });
    return;
  }
  
  args.forEach((arg, i) => validateNode(arg, [...path, `[${i}]`], errors, warnings));
}

function validateComparisonOperator(
  args: unknown,
  path: string[],
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!Array.isArray(args)) {
    errors.push({
      message: 'Comparison operator expects an array of arguments',
      path
    });
    return;
  }
  
  if (args.length < 2) {
    errors.push({
      message: 'Comparison operator requires at least 2 arguments',
      path
    });
    return;
  }
  
  // Allow 3 arguments for between-style comparisons (e.g., 1 < x < 10)
  if (args.length > 3) {
    warnings.push({
      message: 'Comparison operator with more than 3 arguments',
      path
    });
  }
  
  args.forEach((arg, i) => validateNode(arg, [...path, `[${i}]`], errors, warnings));
}

function validateArithmeticOperator(
  args: unknown,
  path: string[],
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!Array.isArray(args)) {
    // Single argument is valid (e.g., unary minus)
    validateNode(args, path, errors, warnings);
    return;
  }
  
  args.forEach((arg, i) => validateNode(arg, [...path, `[${i}]`], errors, warnings));
}

function validateArrayIterator(
  operator: string,
  args: unknown,
  path: string[],
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!Array.isArray(args)) {
    errors.push({
      message: `${operator} operator expects an array of arguments`,
      path,
      operator
    });
    return;
  }
  
  const expectedArgs = operator === 'reduce' ? 3 : 2;
  if (args.length < expectedArgs) {
    errors.push({
      message: `${operator} operator requires ${expectedArgs} arguments`,
      path,
      operator
    });
  }
  
  args.forEach((arg, i) => validateNode(arg, [...path, `[${i}]`], errors, warnings));
}

/**
 * Get a list of all valid JSONLogic operators
 */
export function getOperatorList(): string[] {
  return [...JSON_LOGIC_OPERATORS];
}

/**
 * Get operator category
 */
export function getOperatorCategory(operator: string): string {
  const categories: Record<string, string[]> = {
    'Logic': ['if', '==', '===', '!=', '!==', '!', '!!', 'or', 'and'],
    'Numeric': ['>', '>=', '<', '<=', 'max', 'min', '+', '-', '*', '/', '%'],
    'Array': ['map', 'filter', 'reduce', 'all', 'none', 'some', 'merge', 'in'],
    'String': ['cat', 'substr'],
    'Data': ['var', 'missing', 'missing_some'],
    'Misc': ['log']
  };
  
  for (const [category, ops] of Object.entries(categories)) {
    if (ops.includes(operator)) {
      return category;
    }
  }
  
  return 'Unknown';
}
