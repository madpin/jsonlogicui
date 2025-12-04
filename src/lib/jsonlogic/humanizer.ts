import { JsonLogicRule } from '@/types/jsonlogic';

/**
 * Convert a JSONLogic rule to human-readable pseudo-code
 */
export function humanizeRule(rule: JsonLogicRule, indent = 0): string {
  const pad = '  '.repeat(indent);
  
  if (rule === null) return `${pad}null`;
  if (typeof rule === 'string') return `${pad}"${rule}"`;
  if (typeof rule === 'number') return `${pad}${rule}`;
  if (typeof rule === 'boolean') return `${pad}${rule}`;
  if (Array.isArray(rule)) {
    if (rule.length === 0) return `${pad}[]`;
    const items = rule.map(item => humanizeRule(item, 0)).join(', ');
    return `${pad}[${items}]`;
  }
  
  if (typeof rule !== 'object') return `${pad}${String(rule)}`;
  
  const keys = Object.keys(rule);
  if (keys.length === 0) return `${pad}{}`;
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  // Handle different operators
  switch (operator) {
    case 'var':
      return humanizeVar(operands, pad);
    case 'if':
    case '?:':
      return humanizeIf(operands, pad, indent);
    case 'and':
      return humanizeLogical('AND', operands, pad, indent);
    case 'or':
      return humanizeLogical('OR', operands, pad, indent);
    case '!':
      return humanizeNot(operands, pad);
    case '!!':
      return humanizeTruthy(operands, pad);
    case '==':
    case '===':
      return humanizeComparison('==', operands, pad);
    case '!=':
    case '!==':
      return humanizeComparison('!=', operands, pad);
    case '>':
    case '>=':
    case '<':
    case '<=':
      return humanizeComparison(operator, operands, pad);
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
      return humanizeArithmetic(operator, operands, pad);
    case 'in':
      return humanizeIn(operands, pad);
    case 'cat':
      return humanizeCat(operands, pad);
    case 'substr':
      return humanizeSubstr(operands, pad);
    case 'merge':
      return humanizeMerge(operands, pad);
    case 'map':
      return humanizeArrayOp('MAP', operands, pad, indent);
    case 'filter':
      return humanizeArrayOp('FILTER', operands, pad, indent);
    case 'reduce':
      return humanizeReduce(operands, pad, indent);
    case 'all':
      return humanizeArrayOp('ALL', operands, pad, indent);
    case 'some':
      return humanizeArrayOp('SOME', operands, pad, indent);
    case 'none':
      return humanizeArrayOp('NONE', operands, pad, indent);
    case 'min':
      return humanizeMinMax('MIN', operands, pad);
    case 'max':
      return humanizeMinMax('MAX', operands, pad);
    case 'missing':
      return humanizeMissing(operands, pad);
    case 'missing_some':
      return humanizeMissingSome(operands, pad);
    case 'log':
      return humanizeLog(operands, pad);
    default:
      return `${pad}${operator}(${JSON.stringify(operands)})`;
  }
}

function humanizeVar(operands: unknown, pad: string): string {
  if (typeof operands === 'string') {
    return `${pad}${operands || 'data'}`;
  }
  if (Array.isArray(operands)) {
    const [path, defaultVal] = operands;
    if (defaultVal !== undefined) {
      return `${pad}${path || 'data'} ?? ${JSON.stringify(defaultVal)}`;
    }
    return `${pad}${path || 'data'}`;
  }
  return `${pad}data`;
}

function humanizeIf(operands: unknown, pad: string, indent: number): string {
  if (!Array.isArray(operands)) return `${pad}IF ???`;
  
  const lines: string[] = [];
  
  for (let i = 0; i < operands.length; i += 2) {
    const condition = operands[i];
    const result = operands[i + 1];
    
    if (i === 0) {
      lines.push(`${pad}IF (${humanizeRule(condition as JsonLogicRule, 0).trim()}):`);
      lines.push(`${pad}  → ${humanizeRule(result as JsonLogicRule, 0).trim()}`);
    } else if (i + 1 < operands.length) {
      lines.push(`${pad}ELSE IF (${humanizeRule(condition as JsonLogicRule, 0).trim()}):`);
      lines.push(`${pad}  → ${humanizeRule(result as JsonLogicRule, 0).trim()}`);
    } else {
      // Last item is the else case (odd number of operands)
      lines.push(`${pad}ELSE:`);
      lines.push(`${pad}  → ${humanizeRule(condition as JsonLogicRule, 0).trim()}`);
    }
  }
  
  // Handle case where there's an explicit else (even number of operands >= 3)
  if (operands.length >= 3 && operands.length % 2 === 1) {
    // Already handled above
  } else if (operands.length >= 3 && operands.length % 2 === 0) {
    // No else clause
  }
  
  return lines.join('\n');
}

function humanizeLogical(op: string, operands: unknown, pad: string, indent: number): string {
  if (!Array.isArray(operands)) return `${pad}${op} ???`;
  
  const conditions = operands.map(o => humanizeRule(o as JsonLogicRule, 0).trim());
  
  if (conditions.length <= 2) {
    return `${pad}(${conditions.join(` ${op} `)})`;
  }
  
  // Multi-line for many conditions
  const lines = [`${pad}(${op}:`];
  conditions.forEach(c => lines.push(`${pad}  - ${c}`));
  lines.push(`${pad})`);
  return lines.join('\n');
}

function humanizeNot(operands: unknown, pad: string): string {
  if (Array.isArray(operands) && operands.length > 0) {
    return `${pad}NOT (${humanizeRule(operands[0] as JsonLogicRule, 0).trim()})`;
  }
  return `${pad}NOT (${humanizeRule(operands as JsonLogicRule, 0).trim()})`;
}

function humanizeTruthy(operands: unknown, pad: string): string {
  if (Array.isArray(operands) && operands.length > 0) {
    return `${pad}BOOL(${humanizeRule(operands[0] as JsonLogicRule, 0).trim()})`;
  }
  return `${pad}BOOL(${humanizeRule(operands as JsonLogicRule, 0).trim()})`;
}

function humanizeComparison(op: string, operands: unknown, pad: string): string {
  if (!Array.isArray(operands) || operands.length < 2) return `${pad}??? ${op} ???`;
  
  const left = humanizeRule(operands[0] as JsonLogicRule, 0).trim();
  const right = humanizeRule(operands[1] as JsonLogicRule, 0).trim();
  
  // Handle between: { "<": [1, { "var": "x" }, 10] }
  if (operands.length === 3 && ['<', '<=', '>', '>='].includes(op)) {
    const middle = humanizeRule(operands[1] as JsonLogicRule, 0).trim();
    const end = humanizeRule(operands[2] as JsonLogicRule, 0).trim();
    return `${pad}(${left} ${op} ${middle} ${op} ${end})`;
  }
  
  return `${pad}(${left} ${op} ${right})`;
}

function humanizeArithmetic(op: string, operands: unknown, pad: string): string {
  if (!Array.isArray(operands)) {
    return `${pad}${humanizeRule(operands as JsonLogicRule, 0).trim()}`;
  }
  
  if (operands.length === 1 && op === '-') {
    return `${pad}-${humanizeRule(operands[0] as JsonLogicRule, 0).trim()}`;
  }
  
  const parts = operands.map(o => humanizeRule(o as JsonLogicRule, 0).trim());
  return `${pad}(${parts.join(` ${op} `)})`;
}

function humanizeIn(operands: unknown, pad: string): string {
  if (!Array.isArray(operands) || operands.length < 2) return `${pad}??? IN ???`;
  
  const needle = humanizeRule(operands[0] as JsonLogicRule, 0).trim();
  const haystack = humanizeRule(operands[1] as JsonLogicRule, 0).trim();
  
  return `${pad}(${needle} IN ${haystack})`;
}

function humanizeCat(operands: unknown, pad: string): string {
  if (!Array.isArray(operands)) {
    return `${pad}CONCAT(${humanizeRule(operands as JsonLogicRule, 0).trim()})`;
  }
  
  const parts = operands.map(o => humanizeRule(o as JsonLogicRule, 0).trim());
  return `${pad}CONCAT(${parts.join(', ')})`;
}

function humanizeSubstr(operands: unknown, pad: string): string {
  if (!Array.isArray(operands)) return `${pad}SUBSTR(???)`;
  
  const [str, start, len] = operands;
  const strPart = humanizeRule(str as JsonLogicRule, 0).trim();
  
  if (len !== undefined) {
    return `${pad}SUBSTR(${strPart}, ${start}, ${len})`;
  }
  return `${pad}SUBSTR(${strPart}, ${start})`;
}

function humanizeMerge(operands: unknown, pad: string): string {
  if (!Array.isArray(operands)) {
    return `${pad}MERGE(${humanizeRule(operands as JsonLogicRule, 0).trim()})`;
  }
  
  const parts = operands.map(o => humanizeRule(o as JsonLogicRule, 0).trim());
  return `${pad}MERGE(${parts.join(', ')})`;
}

function humanizeArrayOp(op: string, operands: unknown, pad: string, indent: number): string {
  if (!Array.isArray(operands) || operands.length < 2) return `${pad}${op}(???)`;
  
  const [arr, logic] = operands;
  const arrPart = humanizeRule(arr as JsonLogicRule, 0).trim();
  const logicPart = humanizeRule(logic as JsonLogicRule, 0).trim();
  
  return `${pad}${op}(${arrPart}, ${logicPart})`;
}

function humanizeReduce(operands: unknown, pad: string, indent: number): string {
  if (!Array.isArray(operands) || operands.length < 3) return `${pad}REDUCE(???)`;
  
  const [arr, logic, initial] = operands;
  const arrPart = humanizeRule(arr as JsonLogicRule, 0).trim();
  const logicPart = humanizeRule(logic as JsonLogicRule, 0).trim();
  const initialPart = humanizeRule(initial as JsonLogicRule, 0).trim();
  
  return `${pad}REDUCE(${arrPart}, ${logicPart}, initial=${initialPart})`;
}

function humanizeMinMax(op: string, operands: unknown, pad: string): string {
  if (!Array.isArray(operands)) {
    return `${pad}${op}(${humanizeRule(operands as JsonLogicRule, 0).trim()})`;
  }
  
  const parts = operands.map(o => humanizeRule(o as JsonLogicRule, 0).trim());
  return `${pad}${op}(${parts.join(', ')})`;
}

function humanizeMissing(operands: unknown, pad: string): string {
  if (!Array.isArray(operands)) {
    return `${pad}MISSING(${JSON.stringify(operands)})`;
  }
  return `${pad}MISSING(${operands.join(', ')})`;
}

function humanizeMissingSome(operands: unknown, pad: string): string {
  if (!Array.isArray(operands) || operands.length < 2) return `${pad}MISSING_SOME(???)`;
  
  const [min, keys] = operands;
  return `${pad}MISSING_SOME(need ${min} of: ${(keys as string[]).join(', ')})`;
}

function humanizeLog(operands: unknown, pad: string): string {
  return `${pad}LOG(${humanizeRule(operands as JsonLogicRule, 0).trim()})`;
}

/**
 * Get a short summary of a rule (for tab labels, etc.)
 */
export function summarizeRule(rule: JsonLogicRule): string {
  if (rule === null) return 'null';
  if (typeof rule !== 'object') return String(rule);
  if (Array.isArray(rule)) return `Array[${rule.length}]`;
  
  const keys = Object.keys(rule);
  if (keys.length === 0) return '{}';
  
  const operator = keys[0];
  return operator.toUpperCase();
}
