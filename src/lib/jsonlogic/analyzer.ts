import { 
  JsonLogicRule, 
  VariableInfo, 
  VariableType, 
  Constraint,
  NumericConstraint,
  StringConstraint,
  ArrayConstraint,
  BooleanConstraint,
  isJsonLogicOperator
} from '@/types/jsonlogic';

/**
 * Extract all variable names from a JSONLogic rule
 */
export function extractVariables(rule: JsonLogicRule): string[] {
  const variables = new Set<string>();
  extractVariablesRecursive(rule, variables);
  return Array.from(variables);
}

function extractVariablesRecursive(rule: JsonLogicRule, variables: Set<string>): void {
  if (rule === null || typeof rule !== 'object') {
    return;
  }
  
  if (Array.isArray(rule)) {
    rule.forEach(item => extractVariablesRecursive(item, variables));
    return;
  }
  
  const keys = Object.keys(rule);
  if (keys.length === 0) return;
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  if (operator === 'var') {
    const varName = extractVarName(operands);
    if (varName) {
      variables.add(varName);
    }
  }
  
  // Recurse into operands
  if (Array.isArray(operands)) {
    operands.forEach(op => extractVariablesRecursive(op as JsonLogicRule, variables));
  } else if (operands !== null && typeof operands === 'object') {
    extractVariablesRecursive(operands as JsonLogicRule, variables);
  }
}

function extractVarName(operands: unknown): string | null {
  if (typeof operands === 'string') {
    return operands || null;
  }
  if (typeof operands === 'number') {
    return String(operands);
  }
  if (Array.isArray(operands) && operands.length > 0) {
    const first = operands[0];
    if (typeof first === 'string') {
      return first || null;
    }
    if (typeof first === 'number') {
      return String(first);
    }
  }
  return null;
}

/**
 * Extract detailed variable information including constraints
 */
export function extractVariableInfo(rule: JsonLogicRule): VariableInfo[] {
  const variableMap = new Map<string, VariableInfo>();
  extractVariableInfoRecursive(rule, [], variableMap, null);
  return Array.from(variableMap.values());
}

function extractVariableInfoRecursive(
  rule: JsonLogicRule,
  path: string[],
  variableMap: Map<string, VariableInfo>,
  parentOperator: string | null
): void {
  if (rule === null || typeof rule !== 'object') {
    return;
  }
  
  if (Array.isArray(rule)) {
    rule.forEach((item, i) => 
      extractVariableInfoRecursive(item, [...path, `[${i}]`], variableMap, parentOperator)
    );
    return;
  }
  
  const keys = Object.keys(rule);
  if (keys.length === 0) return;
  
  const operator = keys[0];
  const operands = (rule as Record<string, unknown>)[operator];
  
  if (operator === 'var') {
    const varName = extractVarName(operands);
    if (varName) {
      if (!variableMap.has(varName)) {
        variableMap.set(varName, {
          name: varName,
          path: path,
          constraints: [],
          inferredType: 'unknown'
        });
      }
      
      // Extract default value if present
      if (Array.isArray(operands) && operands.length > 1) {
        const info = variableMap.get(varName)!;
        info.defaultValue = operands[1];
      }
    }
  }
  
  // Extract constraints from comparison operators
  if (['>', '>=', '<', '<=', '==', '===', '!=', '!=='].includes(operator)) {
    extractComparisonConstraints(operator, operands, variableMap);
  }
  
  // Extract constraints from 'in' operator
  if (operator === 'in') {
    extractInConstraints(operands, variableMap);
  }
  
  // Extract type hints from operators
  if (['!', '!!'].includes(operator)) {
    extractBooleanConstraints(operands, variableMap);
  }
  
  // Recurse into operands
  if (Array.isArray(operands)) {
    operands.forEach((op, i) => 
      extractVariableInfoRecursive(op as JsonLogicRule, [...path, operator, `[${i}]`], variableMap, operator)
    );
  } else if (operands !== null && typeof operands === 'object') {
    extractVariableInfoRecursive(operands as JsonLogicRule, [...path, operator], variableMap, operator);
  }
}

function extractComparisonConstraints(
  operator: string,
  operands: unknown,
  variableMap: Map<string, VariableInfo>
): void {
  if (!Array.isArray(operands) || operands.length < 2) return;
  
  // Check for variable on left side
  const left = operands[0];
  const right = operands[1];
  
  if (isVarRule(left) && typeof right === 'number') {
    const varName = extractVarName((left as Record<string, unknown>).var);
    if (varName && variableMap.has(varName)) {
      const info = variableMap.get(varName)!;
      info.inferredType = 'number';
      info.constraints.push(createNumericConstraint(operator, right));
    }
  }
  
  // Check for variable on right side (reverse the operator)
  if (isVarRule(right) && typeof left === 'number') {
    const varName = extractVarName((right as Record<string, unknown>).var);
    if (varName && variableMap.has(varName)) {
      const info = variableMap.get(varName)!;
      info.inferredType = 'number';
      info.constraints.push(createNumericConstraint(reverseOperator(operator), left));
    }
  }
  
  // String comparison
  if (isVarRule(left) && typeof right === 'string') {
    const varName = extractVarName((left as Record<string, unknown>).var);
    if (varName && variableMap.has(varName)) {
      const info = variableMap.get(varName)!;
      info.inferredType = 'string';
      info.constraints.push({
        type: 'string',
        operator: 'equals',
        value: right
      } as StringConstraint);
    }
  }
}

function extractInConstraints(
  operands: unknown,
  variableMap: Map<string, VariableInfo>
): void {
  if (!Array.isArray(operands) || operands.length < 2) return;
  
  const [needle, haystack] = operands;
  
  if (isVarRule(needle) && Array.isArray(haystack)) {
    const varName = extractVarName((needle as Record<string, unknown>).var);
    if (varName && variableMap.has(varName)) {
      const info = variableMap.get(varName)!;
      // Infer type from array contents
      if (haystack.every(v => typeof v === 'string')) {
        info.inferredType = 'string';
        info.constraints.push({
          type: 'string',
          operator: 'in',
          value: haystack as string[]
        } as StringConstraint);
      } else if (haystack.every(v => typeof v === 'number')) {
        info.inferredType = 'number';
      }
    }
  }
}

function extractBooleanConstraints(
  operands: unknown,
  variableMap: Map<string, VariableInfo>
): void {
  if (isVarRule(operands)) {
    const varName = extractVarName((operands as Record<string, unknown>).var);
    if (varName && variableMap.has(varName)) {
      const info = variableMap.get(varName)!;
      if (info.inferredType === 'unknown') {
        info.inferredType = 'boolean';
      }
    }
  }
}

function isVarRule(value: unknown): boolean {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         'var' in value;
}

function createNumericConstraint(operator: string, value: number): NumericConstraint {
  const opMap: Record<string, NumericConstraint['operator']> = {
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    '==': '==',
    '===': '==',
    '!=': '!=',
    '!==': '!='
  };
  
  return {
    type: 'numeric',
    operator: opMap[operator] || '==',
    value
  };
}

function reverseOperator(operator: string): string {
  const reverseMap: Record<string, string> = {
    '>': '<',
    '>=': '<=',
    '<': '>',
    '<=': '>=',
    '==': '==',
    '===': '===',
    '!=': '!=',
    '!==': '!=='
  };
  return reverseMap[operator] || operator;
}

/**
 * Infer variable types from rule context
 */
export function inferVariableTypes(rule: JsonLogicRule): Map<string, VariableType> {
  const info = extractVariableInfo(rule);
  const types = new Map<string, VariableType>();
  
  info.forEach(v => {
    types.set(v.name, v.inferredType || 'unknown');
  });
  
  return types;
}

/**
 * Extract all constraints for a specific variable
 */
export function extractConstraints(rule: JsonLogicRule): Constraint[] {
  const info = extractVariableInfo(rule);
  return info.flatMap(v => v.constraints);
}

/**
 * Get the complexity score of a rule (for UI indicators)
 */
export function getRuleComplexity(rule: JsonLogicRule): { score: number; level: 'simple' | 'moderate' | 'complex' } {
  let score = 0;
  
  function countNodes(node: JsonLogicRule): void {
    if (node === null || typeof node !== 'object') {
      return;
    }
    
    if (Array.isArray(node)) {
      node.forEach(countNodes);
      return;
    }
    
    const keys = Object.keys(node);
    score += keys.length;
    
    keys.forEach(key => {
      const value = (node as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        value.forEach(v => countNodes(v as JsonLogicRule));
      } else if (value !== null && typeof value === 'object') {
        countNodes(value as JsonLogicRule);
      }
    });
  }
  
  countNodes(rule);
  
  let level: 'simple' | 'moderate' | 'complex';
  if (score <= 5) {
    level = 'simple';
  } else if (score <= 15) {
    level = 'moderate';
  } else {
    level = 'complex';
  }
  
  return { score, level };
}
