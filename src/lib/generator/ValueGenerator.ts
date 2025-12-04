import { 
  Constraint, 
  NumericConstraint, 
  StringConstraint, 
  VariableType 
} from '@/types/jsonlogic';

/**
 * Generate a random number within constraints
 */
export function generateNumber(constraints: NumericConstraint[] = []): number {
  let min = -1000;
  let max = 1000;
  let exactValue: number | null = null;
  
  for (const constraint of constraints) {
    switch (constraint.operator) {
      case '>':
        min = Math.max(min, constraint.value + 1);
        break;
      case '>=':
        min = Math.max(min, constraint.value);
        break;
      case '<':
        max = Math.min(max, constraint.value - 1);
        break;
      case '<=':
        max = Math.min(max, constraint.value);
        break;
      case '==':
        exactValue = constraint.value;
        break;
      case '!=':
        // Will handle after generating
        break;
      case 'between':
        min = Math.max(min, constraint.value);
        max = Math.min(max, constraint.upperBound || max);
        break;
    }
  }
  
  if (exactValue !== null) {
    return exactValue;
  }
  
  // Generate random number in range
  if (min > max) {
    // Constraints are impossible, return midpoint of original constraints
    return Math.round((constraints[0]?.value || 0));
  }
  
  // Check if we need integers or can use floats
  const useIntegers = constraints.some(c => Number.isInteger(c.value));
  
  if (useIntegers) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  return Math.random() * (max - min) + min;
}

/**
 * Generate a string based on constraints
 */
export function generateString(constraints: StringConstraint[] = []): string {
  for (const constraint of constraints) {
    switch (constraint.operator) {
      case 'equals':
        return constraint.value as string;
      case 'in':
        const options = constraint.value as string[];
        return options[Math.floor(Math.random() * options.length)];
      case 'length':
        const length = constraint.value as number;
        return generateRandomString(length);
      case 'contains':
        return `prefix_${constraint.value}_suffix`;
      case 'startsWith':
        return `${constraint.value}_suffix`;
      case 'endsWith':
        return `prefix_${constraint.value}`;
    }
  }
  
  // Default: generate random string
  return generateRandomString(8);
}

function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a boolean value
 */
export function generateBoolean(): boolean {
  return Math.random() > 0.5;
}

/**
 * Generate an array based on constraints
 */
export function generateArray(itemType: VariableType = 'number', length = 5): unknown[] {
  const result: unknown[] = [];
  
  for (let i = 0; i < length; i++) {
    switch (itemType) {
      case 'number':
        result.push(generateNumber());
        break;
      case 'string':
        result.push(generateString());
        break;
      case 'boolean':
        result.push(generateBoolean());
        break;
      default:
        result.push(generateNumber());
    }
  }
  
  return result;
}

/**
 * Generate boundary values for testing
 */
export function generateBoundaryValues(constraints: Constraint[]): unknown[] {
  const values: unknown[] = [];
  
  for (const constraint of constraints) {
    if (constraint.type === 'numeric') {
      const nc = constraint as NumericConstraint;
      switch (nc.operator) {
        case '>':
          values.push(nc.value, nc.value + 1, nc.value - 1);
          break;
        case '>=':
          values.push(nc.value, nc.value - 1, nc.value + 1);
          break;
        case '<':
          values.push(nc.value, nc.value - 1, nc.value + 1);
          break;
        case '<=':
          values.push(nc.value, nc.value + 1, nc.value - 1);
          break;
        case '==':
          values.push(nc.value, nc.value + 1, nc.value - 1);
          break;
      }
    }
  }
  
  return [...new Set(values)];
}

/**
 * Generate a value based on inferred type
 */
export function generateValueByType(
  type: VariableType, 
  constraints: Constraint[] = []
): unknown {
  switch (type) {
    case 'number':
      return generateNumber(constraints.filter(c => c.type === 'numeric') as NumericConstraint[]);
    case 'string':
      return generateString(constraints.filter(c => c.type === 'string') as StringConstraint[]);
    case 'boolean':
      return generateBoolean();
    case 'array':
      return generateArray();
    case 'object':
      return {};
    default:
      // Try to infer from constraints
      if (constraints.some(c => c.type === 'numeric')) {
        return generateNumber(constraints.filter(c => c.type === 'numeric') as NumericConstraint[]);
      }
      if (constraints.some(c => c.type === 'string')) {
        return generateString(constraints.filter(c => c.type === 'string') as StringConstraint[]);
      }
      return generateNumber();
  }
}
