import { JsonLogicRule, isJsonLogicOperator } from '@/types/jsonlogic';
import { TreeNode, NodeType } from '@/types/tree';

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node-${++nodeIdCounter}`;
}

/**
 * Build a human-readable label for any JSONLogic rule
 */
function buildLabel(rule: JsonLogicRule, compact = false): string {
  if (rule === null) return 'null';
  if (typeof rule === 'string') return `"${rule}"`;
  if (typeof rule === 'number' || typeof rule === 'boolean') return String(rule);
  
  // Arrays - show compact format
  if (Array.isArray(rule)) {
    if (compact || rule.length > 3) {
      return `[${rule.length} items]`;
    }
    return `[${rule.map(r => buildLabel(r as JsonLogicRule, true)).join(', ')}]`;
  }
  
  if (typeof rule !== 'object') return String(rule);
  
  const keys = Object.keys(rule);
  if (keys.length === 0) return '{}';
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  // Variable - show with quotes for clarity
  if (operator === 'var') {
    if (typeof operands === 'string') return operands === '' ? '(item)' : `"${operands}"`;
    if (Array.isArray(operands)) return operands[0] === '' ? '(item)' : `"${operands[0]}"`;
    return 'data';
  }
  
  // Comparison operators - inline format
  if (['==', '===', '!=', '!==', '>', '>=', '<', '<='].includes(operator)) {
    if (Array.isArray(operands) && operands.length >= 2) {
      const left = buildLabel(operands[0] as JsonLogicRule, true);
      const right = buildLabel(operands[1] as JsonLogicRule, true);
      return `${left} ${operator} ${right}`;
    }
  }
  
  // Logical operators
  if (operator === 'and' && Array.isArray(operands)) {
    return operands.map(o => buildLabel(o as JsonLogicRule, true)).join(' AND ');
  }
  if (operator === 'or' && Array.isArray(operands)) {
    return operands.map(o => buildLabel(o as JsonLogicRule, true)).join(' OR ');
  }
  if (operator === '!' || operator === '!!') {
    const inner = Array.isArray(operands) ? operands[0] : operands;
    return `${operator === '!' ? 'NOT ' : 'BOOL '}${buildLabel(inner as JsonLogicRule, true)}`;
  }
  
  // In operator - show needle in [array]
  if (operator === 'in' && Array.isArray(operands) && operands.length >= 2) {
    const needle = buildLabel(operands[0] as JsonLogicRule, true);
    const haystack = operands[1];
    // Show array as [N items] for clarity
    const haystackLabel = Array.isArray(haystack) 
      ? `[${haystack.length} items]`
      : buildLabel(haystack as JsonLogicRule, true);
    return `${needle} in ${haystackLabel}`;
  }
  
  // Arithmetic
  if (['+', '-', '*', '/', '%'].includes(operator) && Array.isArray(operands)) {
    return operands.map(o => buildLabel(o as JsonLogicRule, true)).join(` ${operator} `);
  }
  
  // Array operations
  if (['map', 'filter', 'reduce', 'all', 'some', 'none'].includes(operator)) {
    const opNames: Record<string, string> = {
      map: 'MAP',
      filter: 'FILTER', 
      reduce: 'REDUCE',
      all: 'ALL',
      some: 'SOME',
      none: 'NONE'
    };
    return `${opNames[operator]}(...)`;
  }
  
  // Default: show operator name
  return `${operator}(...)`;
}

/**
 * Parse a JSONLogic rule into a tree structure for visualization
 */
export function parseRuleToTree(rule: JsonLogicRule, parentId?: string, depth = 0, path: string[] = []): TreeNode {
  nodeIdCounter = depth === 0 ? 0 : nodeIdCounter;
  
  // Handle null
  if (rule === null) {
    return createValueNode('null', null, parentId, depth, path);
  }
  
  // Handle primitives
  if (typeof rule === 'string') {
    return createValueNode(`"${rule}"`, rule, parentId, depth, path);
  }
  if (typeof rule === 'number') {
    return createValueNode(String(rule), rule, parentId, depth, path);
  }
  if (typeof rule === 'boolean') {
    return createValueNode(String(rule), rule, parentId, depth, path);
  }
  
  // Handle arrays (literal arrays, not operator arguments)
  if (Array.isArray(rule)) {
    const node: TreeNode = {
      id: generateNodeId(),
      type: 'array',
      label: `[${rule.length} items]`,
      value: rule,
      children: [],
      parent: parentId,
      depth,
      path,
      expanded: depth < 3,
      highlighted: false,
      selected: false,
    };
    
    node.children = rule.map((item, index) => 
      parseRuleToTree(item, node.id, depth + 1, [...path, `[${index}]`])
    );
    
    return node;
  }
  
  // Handle objects (operators)
  const keys = Object.keys(rule);
  if (keys.length === 0) {
    return createValueNode('{}', rule, parentId, depth, path);
  }
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  // Variable - show as leaf node with path
  if (operator === 'var') {
    return createVariableNode(operands, parentId, depth, path);
  }
  
  // IF / Ternary - decision tree structure
  if ((operator === 'if' || operator === '?:') && Array.isArray(operands)) {
    return createIfNode(operands, parentId, depth, path, rule);
  }
  
  // All other operators - show with human-readable label
  const label = buildLabel(rule);
  const node: TreeNode = {
    id: generateNodeId(),
    type: 'operator',
    label,
    operator,
    value: rule,
    children: [],
    parent: parentId,
    depth,
    path,
    expanded: depth < 4,
    highlighted: false,
    selected: false,
  };
  
  // For complex nested rules, show children
  if (Array.isArray(operands)) {
    // Only add children for complex nested operations
    const hasComplexChildren = operands.some(op => 
      typeof op === 'object' && op !== null && !isSimpleValue(op)
    );
    
    if (hasComplexChildren) {
      node.children = operands
        .filter(op => typeof op === 'object' && op !== null && !isSimpleValue(op))
        .map((op, index) => parseRuleToTree(op as JsonLogicRule, node.id, depth + 1, [...path, operator, `[${index}]`]));
    }
  } else if (operands !== null && operands !== undefined && typeof operands === 'object') {
    node.children = [parseRuleToTree(operands as JsonLogicRule, node.id, depth + 1, [...path, operator])];
  }
  
  return node;
}

/**
 * Check if a value is simple (primitive or simple var)
 */
function isSimpleValue(rule: unknown): boolean {
  if (rule === null || typeof rule !== 'object') return true;
  if (Array.isArray(rule)) return false;
  const keys = Object.keys(rule);
  if (keys.length === 1 && keys[0] === 'var') return true;
  return false;
}

/**
 * Create an IF node - the condition IS the node, with true/false result branches
 * Results are shown directly without Yes/No labels - colors distinguish them
 */
function createIfNode(
  operands: unknown[],
  parentId: string | undefined,
  depth: number,
  path: string[],
  rule: JsonLogicRule
): TreeNode {
  if (operands.length < 2) {
    return createValueNode('IF ?', rule, parentId, depth, path);
  }
  
  // Handle chained if-else (more than 3 operands) first
  // { "if": [cond1, val1, cond2, val2, ..., default] }
  if (operands.length > 3) {
    return createChainedIfNode(operands, parentId, depth, path, rule);
  }
  
  // The condition becomes the node label
  const condition = operands[0];
  const conditionLabel = buildLabel(condition as JsonLogicRule);
  
  const node: TreeNode = {
    id: generateNodeId(),
    type: 'operator',
    label: conditionLabel,
    operator: 'if',
    value: rule,
    children: [],
    parent: parentId,
    depth,
    path,
    expanded: true,
    highlighted: false,
    selected: false,
  };
  
  // True branch (then) - green colored value node
  const thenResult = operands[1];
  const trueNode = createResultNode(thenResult, node.id, depth + 1, [...path, 'then'], true);
  node.children.push(trueNode);
  
  // False branch (else) - if exists
  if (operands.length > 2) {
    const elseResult = operands[2];
    
    // Check if else is another IF (chained conditions)
    if (typeof elseResult === 'object' && elseResult !== null && !Array.isArray(elseResult)) {
      const elseKeys = Object.keys(elseResult);
      if (elseKeys[0] === 'if' || elseKeys[0] === '?:') {
        // Nested IF - parse it directly (no wrapper needed)
        const nestedIf = parseRuleToTree(elseResult as JsonLogicRule, node.id, depth + 1, [...path, 'else']);
        node.children.push(nestedIf);
      } else {
        // Regular else value
        const falseNode = createResultNode(elseResult, node.id, depth + 1, [...path, 'else'], false);
        node.children.push(falseNode);
      }
    } else {
      const falseNode = createResultNode(elseResult, node.id, depth + 1, [...path, 'else'], false);
      node.children.push(falseNode);
    }
  }
  
  return node;
}

/**
 * Create a chained IF node for multiple conditions
 */
function createChainedIfNode(
  operands: unknown[],
  parentId: string | undefined,
  depth: number,
  path: string[],
  rule: JsonLogicRule
): TreeNode {
  // First condition is the root
  const condition = operands[0];
  const conditionLabel = buildLabel(condition as JsonLogicRule);
  
  const node: TreeNode = {
    id: generateNodeId(),
    type: 'operator',
    label: conditionLabel,
    operator: 'if',
    value: rule,
    children: [],
    parent: parentId,
    depth,
    path,
    expanded: true,
    highlighted: false,
    selected: false,
  };
  
  // True branch
  const trueNode = createResultNode(operands[1], node.id, depth + 1, [...path, 'then'], true);
  node.children.push(trueNode);
  
  // False branch - contains the rest of the chain
  const remainingOperands = operands.slice(2);
  if (remainingOperands.length === 1) {
    // Final else (default value)
    const falseNode = createResultNode(remainingOperands[0], node.id, depth + 1, [...path, 'else'], false);
    node.children.push(falseNode);
  } else {
    // More conditions - create nested IF directly
    const nestedIf = createChainedIfNode(remainingOperands, node.id, depth + 1, [...path, 'else'], rule);
    node.children.push(nestedIf);
  }
  
  return node;
}

/**
 * Create a result node for IF branches
 * isTrueBranch determines the color (green for true, red/orange for false)
 */
function createResultNode(
  result: unknown,
  parentId: string,
  depth: number,
  path: string[],
  isTrueBranch: boolean
): TreeNode {
  // Determine the label based on result type
  let label: string;
  let nodeType: NodeType = 'value';
  
  if (result === null) {
    label = 'null';
  } else if (typeof result !== 'object') {
    label = typeof result === 'string' ? `"${result}"` : String(result);
  } else if (!Array.isArray(result)) {
    const keys = Object.keys(result);
    if (keys[0] === 'var') {
      label = buildLabel(result as JsonLogicRule);
      nodeType = 'variable';
    } else {
      // Complex result - parse recursively
      return parseRuleToTree(result as JsonLogicRule, parentId, depth, path);
    }
  } else {
    // Array result
    label = `[${result.length} items]`;
    nodeType = 'array';
  }
  
  return {
    id: generateNodeId(),
    type: nodeType,
    // Store branch type in path for color detection, label is clean
    label: label,
    // Use a custom marker in the path to identify true/false branches
    operator: isTrueBranch ? 'true_branch' : 'false_branch',
    value: result,
    children: [],
    parent: parentId,
    depth,
    path,
    expanded: true,
    highlighted: false,
    selected: false,
  };
}

function createValueNode(
  label: string, 
  value: unknown, 
  parentId: string | undefined, 
  depth: number,
  path: string[]
): TreeNode {
  return {
    id: generateNodeId(),
    type: 'value',
    label,
    value,
    children: [],
    parent: parentId,
    depth,
    path,
    expanded: true,
    highlighted: false,
    selected: false,
  };
}

function createVariableNode(
  operands: unknown, 
  parentId: string | undefined, 
  depth: number,
  path: string[]
): TreeNode {
  let varName: string;
  let defaultValue: unknown;
  
  if (typeof operands === 'string') {
    varName = operands || 'data';
  } else if (typeof operands === 'number') {
    varName = String(operands);
  } else if (Array.isArray(operands)) {
    varName = String(operands[0]) || 'data';
    defaultValue = operands[1];
  } else {
    varName = 'data';
  }
  
  // Create a more descriptive label for variables
  const displayLabel = varName === '' ? '(current item)' : `$${varName}`;
  
  const node: TreeNode = {
    id: generateNodeId(),
    type: 'variable',
    label: displayLabel,
    value: { var: operands },
    children: [],
    parent: parentId,
    depth,
    path,
    expanded: true,
    highlighted: false,
    selected: false,
  };
  
  // Add default value as child if present
  if (defaultValue !== undefined) {
    node.children = [
      createValueNode(
        `default: ${JSON.stringify(defaultValue)}`,
        defaultValue,
        node.id,
        depth + 1,
        [...path, 'var', '[1]']
      )
    ];
  }
  
  return node;
}

/**
 * Flatten tree to array for iteration
 */
export function flattenTree(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

/**
 * Find node by ID
 */
export function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Get path from root to node
 */
export function getPathToNode(root: TreeNode, targetId: string): TreeNode[] {
  const path: TreeNode[] = [];
  
  function traverse(node: TreeNode): boolean {
    path.push(node);
    if (node.id === targetId) return true;
    for (const child of node.children) {
      if (traverse(child)) return true;
    }
    path.pop();
    return false;
  }
  
  traverse(root);
  return path;
}

/**
 * Toggle node expansion
 */
export function toggleNodeExpansion(root: TreeNode, nodeId: string): TreeNode {
  const clone = JSON.parse(JSON.stringify(root)) as TreeNode;
  const node = findNodeById(clone, nodeId);
  if (node) {
    node.expanded = !node.expanded;
  }
  return clone;
}

/**
 * Expand all nodes
 */
export function expandAllNodes(root: TreeNode): TreeNode {
  const clone = JSON.parse(JSON.stringify(root)) as TreeNode;
  const nodes = flattenTree(clone);
  nodes.forEach(node => node.expanded = true);
  return clone;
}

/**
 * Collapse all nodes
 */
export function collapseAllNodes(root: TreeNode): TreeNode {
  const clone = JSON.parse(JSON.stringify(root)) as TreeNode;
  clone.expanded = true; // Keep root expanded
  const nodes = flattenTree(clone);
  nodes.slice(1).forEach(node => node.expanded = false);
  return clone;
}
