import { JsonLogicRule, isJsonLogicOperator } from '@/types/jsonlogic';

type MermaidOrientation = 'TD' | 'TB' | 'LR' | 'RL';

interface ConversionOptions {
  orientation?: MermaidOrientation;
  includeValues?: boolean;
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
}

let nodeCounter = 0;

function generateNodeId(): string {
  return `n${++nodeCounter}`;
}

function escapeLabel(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/[<>{}]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\|/g, '/')
    .slice(0, 50);
}

function formatVarName(operands: unknown): string {
  if (typeof operands === 'string') return operands || 'data';
  if (typeof operands === 'number') return String(operands);
  if (Array.isArray(operands)) return String(operands[0]) || 'data';
  return 'data';
}

/**
 * Convert JSONLogic rule to Mermaid flowchart syntax
 */
export function toMermaidFlowchart(
  rule: JsonLogicRule,
  options: ConversionOptions = {}
): string {
  const { orientation = 'TD', includeValues = true } = options;
  nodeCounter = 0;
  
  const lines: string[] = [`flowchart ${orientation}`];
  const connections: string[] = [];
  
  // Add styling
  lines.push('');
  lines.push('  %% Styling');
  lines.push('  classDef condition fill:#fef3c7,stroke:#f59e0b,color:#92400e');
  lines.push('  classDef result fill:#d1fae5,stroke:#10b981,color:#065f46');
  lines.push('  classDef variable fill:#dbeafe,stroke:#3b82f6,color:#1e40af');
  lines.push('  classDef operator fill:#f3e8ff,stroke:#a855f7,color:#6b21a8');
  lines.push('');
  
  processNode(rule, null, lines, connections, includeValues);
  
  return [...lines, '', ...connections].join('\n');
}

function processNode(
  rule: JsonLogicRule,
  parentId: string | null,
  lines: string[],
  connections: string[],
  includeValues: boolean
): string {
  // Handle null
  if (rule === null) {
    const id = generateNodeId();
    lines.push(`    ${id}([null])`);
    if (parentId) connections.push(`    ${parentId} --> ${id}`);
    return id;
  }
  
  // Handle primitives
  if (typeof rule === 'string') {
    const id = generateNodeId();
    const label = escapeLabel(`"${rule}"`);
    lines.push(`    ${id}([${label}])`);
    if (parentId) connections.push(`    ${parentId} --> ${id}`);
    return id;
  }
  
  if (typeof rule === 'number' || typeof rule === 'boolean') {
    const id = generateNodeId();
    lines.push(`    ${id}([${rule}])`);
    if (parentId) connections.push(`    ${parentId} --> ${id}`);
    return id;
  }
  
  // Handle arrays
  if (Array.isArray(rule)) {
    const id = generateNodeId();
    lines.push(`    ${id}[[Array]]`);
    if (parentId) connections.push(`    ${parentId} --> ${id}`);
    
    if (includeValues) {
      rule.forEach((item) => {
        processNode(item, id, lines, connections, includeValues);
      });
    }
    return id;
  }
  
  // Handle objects (operators)
  const keys = Object.keys(rule);
  if (keys.length === 0) {
    const id = generateNodeId();
    lines.push(`    ${id}([{}])`);
    if (parentId) connections.push(`    ${parentId} --> ${id}`);
    return id;
  }
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  // Special handling for different operators
  if (operator === 'var') {
    return processVarNode(operands, parentId, lines, connections);
  }
  
  if (operator === 'if') {
    return processIfNode(operands, parentId, lines, connections, includeValues);
  }
  
  if (['>', '>=', '<', '<=', '==', '===', '!=', '!=='].includes(operator)) {
    return processComparisonNode(operator, operands, parentId, lines, connections, includeValues);
  }
  
  if (['and', 'or'].includes(operator)) {
    return processLogicalNode(operator, operands, parentId, lines, connections, includeValues);
  }
  
  // Generic operator
  const id = generateNodeId();
  lines.push(`    ${id}{{${escapeLabel(operator)}}}`);
  if (parentId) connections.push(`    ${parentId} --> ${id}`);
  
  if (Array.isArray(operands)) {
    operands.forEach((op) => {
      processNode(op as JsonLogicRule, id, lines, connections, includeValues);
    });
  } else if (operands !== null && operands !== undefined) {
    processNode(operands as JsonLogicRule, id, lines, connections, includeValues);
  }
  
  return id;
}

function processVarNode(
  operands: unknown,
  parentId: string | null,
  lines: string[],
  connections: string[]
): string {
  const id = generateNodeId();
  let varName: string;
  
  if (typeof operands === 'string') {
    varName = operands || 'data';
  } else if (typeof operands === 'number') {
    varName = String(operands);
  } else if (Array.isArray(operands)) {
    varName = String(operands[0]) || 'data';
  } else {
    varName = 'data';
  }
  
  lines.push(`    ${id}[/${escapeLabel(varName)}/]`);
  if (parentId) connections.push(`    ${parentId} --> ${id}`);
  return id;
}

function processIfNode(
  operands: unknown,
  parentId: string | null,
  lines: string[],
  connections: string[],
  includeValues: boolean
): string {
  if (!Array.isArray(operands) || operands.length < 2) {
    const id = generateNodeId();
    lines.push(`    ${id}{{"IF ?"}}`);
    lines.push(`    class ${id} condition`);
    if (parentId) connections.push(`    ${parentId} --> ${id}`);
    return id;
  }
  
  // Build condition label
  const conditionLabel = buildConditionLabel(operands[0] as JsonLogicRule);
  const id = generateNodeId();
  lines.push(`    ${id}{"${escapeLabel(conditionLabel)}"}`);
  lines.push(`    class ${id} condition`);
  if (parentId) connections.push(`    ${parentId} --> ${id}`);
  
  // Process then branch (true case)
  if (operands[1] !== undefined) {
    const thenId = processResultNode(operands[1] as JsonLogicRule, lines, connections, includeValues);
    connections.push(`    ${id} -->|"✓ Yes"| ${thenId}`);
  }
  
  // Process else branch (false case)
  if (operands[2] !== undefined) {
    const elseId = processResultNode(operands[2] as JsonLogicRule, lines, connections, includeValues);
    connections.push(`    ${id} -->|"✗ No"| ${elseId}`);
  }
  
  return id;
}

function buildConditionLabel(condition: JsonLogicRule): string {
  if (typeof condition !== 'object' || condition === null) {
    return String(condition);
  }
  
  if (Array.isArray(condition)) {
    return JSON.stringify(condition);
  }
  
  const keys = Object.keys(condition);
  if (keys.length === 0) return '{}';
  
  const operator = keys[0];
  const operands = (condition as Record<string, unknown>)[operator];
  
  // Handle comparison operators
  if (['==', '===', '!=', '!==', '>', '>=', '<', '<='].includes(operator)) {
    if (Array.isArray(operands) && operands.length >= 2) {
      const left = formatOperand(operands[0]);
      const right = formatOperand(operands[1]);
      return `${left} ${operator} ${right}`;
    }
  }
  
  // Handle 'in' operator
  if (operator === 'in') {
    if (Array.isArray(operands) && operands.length >= 2) {
      const needle = formatOperand(operands[0]);
      const haystack = formatOperand(operands[1]);
      return `${needle} in ${haystack}`;
    }
  }
  
  // Handle logical operators
  if (operator === 'and') {
    if (Array.isArray(operands)) {
      return operands.map(o => buildConditionLabel(o as JsonLogicRule)).join(' AND ');
    }
  }
  
  if (operator === 'or') {
    if (Array.isArray(operands)) {
      return operands.map(o => buildConditionLabel(o as JsonLogicRule)).join(' OR ');
    }
  }
  
  if (operator === '!') {
    const inner = Array.isArray(operands) ? operands[0] : operands;
    return `NOT ${buildConditionLabel(inner as JsonLogicRule)}`;
  }
  
  // Default
  return `${operator}(...)`;
}

function formatOperand(operand: unknown): string {
  if (typeof operand !== 'object' || operand === null) {
    if (typeof operand === 'string') return `'${operand}'`;
    return String(operand);
  }
  
  if (Array.isArray(operand)) {
    return `[${operand.length} items]`;
  }
  
  const keys = Object.keys(operand);
  if (keys.length === 0) return '{}';
  
  const operator = keys[0];
  if (operator === 'var') {
    return formatVarName((operand as Record<string, unknown>).var);
  }
  
  return `${operator}(...)`;
}

function processResultNode(
  rule: JsonLogicRule,
  lines: string[],
  connections: string[],
  includeValues: boolean
): string {
  // If it's a nested if, process it as a condition
  if (typeof rule === 'object' && rule !== null && !Array.isArray(rule)) {
    const keys = Object.keys(rule);
    if (keys.length > 0 && (keys[0] === 'if' || keys[0] === '?:')) {
      return processIfNode((rule as Record<string, unknown>)[keys[0]], null, lines, connections, includeValues);
    }
  }
  
  // Otherwise it's a result value
  const id = generateNodeId();
  let label: string;
  
  if (rule === null) {
    label = 'null';
  } else if (typeof rule === 'string') {
    label = `"${escapeLabel(rule)}"`;
  } else if (typeof rule === 'number' || typeof rule === 'boolean') {
    label = String(rule);
  } else if (typeof rule === 'object' && !Array.isArray(rule)) {
    const keys = Object.keys(rule);
    if (keys[0] === 'var') {
      label = formatVarName((rule as Record<string, unknown>).var);
      lines.push(`    ${id}[/"${escapeLabel(label)}"/]`);
      lines.push(`    class ${id} variable`);
      return id;
    }
    label = `${keys[0]}(...)`;
  } else {
    label = JSON.stringify(rule).slice(0, 30);
  }
  
  lines.push(`    ${id}(["${escapeLabel(label)}"])`);
  lines.push(`    class ${id} result`);
  return id;
}

function processComparisonNode(
  operator: string,
  operands: unknown,
  parentId: string | null,
  lines: string[],
  connections: string[],
  includeValues: boolean
): string {
  const id = generateNodeId();
  lines.push(`    ${id}{${escapeLabel(operator)}}`);
  if (parentId) connections.push(`    ${parentId} --> ${id}`);
  
  if (Array.isArray(operands)) {
    operands.forEach((op, index) => {
      const childId = processNode(op as JsonLogicRule, id, lines, connections, includeValues);
    });
  }
  
  return id;
}

function processLogicalNode(
  operator: string,
  operands: unknown,
  parentId: string | null,
  lines: string[],
  connections: string[],
  includeValues: boolean
): string {
  const id = generateNodeId();
  const shape = operator === 'and' ? `{{${operator}}}` : `{{${operator}}}`;
  lines.push(`    ${id}${shape}`);
  if (parentId) connections.push(`    ${parentId} --> ${id}`);
  
  if (Array.isArray(operands)) {
    operands.forEach((op) => {
      processNode(op as JsonLogicRule, id, lines, connections, includeValues);
    });
  }
  
  return id;
}

/**
 * Convert JSONLogic rule to Mermaid decision tree (for if/else heavy rules)
 */
export function toMermaidDecisionTree(
  rule: JsonLogicRule,
  options: ConversionOptions = {}
): string {
  // For decision trees, we use the same flowchart but with different styling
  return toMermaidFlowchart(rule, { ...options, orientation: 'TD' });
}

/**
 * Get Mermaid theme configuration
 */
export function getMermaidConfig(theme: ConversionOptions['theme'] = 'default'): object {
  const configs: Record<string, object> = {
    default: {
      theme: 'default',
    },
    dark: {
      theme: 'dark',
    },
    forest: {
      theme: 'forest',
    },
    neutral: {
      theme: 'neutral',
    },
  };
  
  return configs[theme] || configs.default;
}
