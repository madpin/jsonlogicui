/**
 * Parse JSON with comments (JSON5-like)
 * Supports // single-line comments and /* multi-line comments
 */
export function parseJsonWithComments(text: string): unknown {
  // Remove single-line comments
  let cleaned = text.replace(/\/\/.*$/gm, '');
  
  // Remove multi-line comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Parse as regular JSON
  return JSON.parse(cleaned);
}

/**
 * Check if the parsed JSON is a multi-rule object (has keys with rule values)
 */
export function isMultiRuleObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  
  // Check if first key is a JSONLogic operator
  const jsonLogicOperators = [
    'var', 'missing', 'missing_some',
    'if', '?:', '==', '===', '!=', '!==', '!', '!!', 'or', 'and',
    '>', '>=', '<', '<=', 'max', 'min', '+', '-', '*', '/', '%',
    'map', 'filter', 'reduce', 'all', 'some', 'none', 'merge', 'in',
    'cat', 'substr', 'log', 'method', 'preserve'
  ];
  
  // If first key is an operator, it's a single rule
  if (jsonLogicOperators.includes(keys[0])) {
    return false;
  }
  
  // Otherwise it's a multi-rule object
  return true;
}

/**
 * Extract individual rules from a multi-rule object
 */
export function extractRules(value: unknown): { key: string; rule: unknown }[] {
  if (!isMultiRuleObject(value)) {
    return [{ key: 'rule', rule: value }];
  }
  
  return Object.entries(value).map(([key, rule]) => ({ key, rule }));
}
