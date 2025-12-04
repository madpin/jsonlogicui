import { JsonLogicRule, VariableInfo } from '@/types/jsonlogic';
import { extractVariableInfo } from '@/lib/jsonlogic/analyzer';
import { generateValueByType, generateBoundaryValues } from './ValueGenerator';

export interface TestScenario {
  name: string;
  description: string;
  data: Record<string, unknown>;
  type: 'happy' | 'boundary' | 'failure' | 'random';
}

/**
 * Generate test scenarios for a JSONLogic rule
 */
export function generateTestScenarios(rule: JsonLogicRule): TestScenario[] {
  const variables = extractVariableInfo(rule);
  const scenarios: TestScenario[] = [];
  
  // Happy path scenario
  scenarios.push(generateHappyPath(variables));
  
  // Boundary scenarios
  scenarios.push(...generateBoundaryScenarios(variables));
  
  // Failure scenarios
  scenarios.push(...generateFailureScenarios(variables));
  
  // Random variations
  scenarios.push(...generateRandomVariations(variables, 3));
  
  return scenarios;
}

/**
 * Generate a "happy path" scenario that should satisfy all constraints
 */
function generateHappyPath(variables: VariableInfo[]): TestScenario {
  const data: Record<string, unknown> = {};
  
  for (const variable of variables) {
    data[variable.name] = generateValueByType(
      variable.inferredType || 'unknown',
      variable.constraints
    );
  }
  
  return {
    name: 'Happy Path',
    description: 'Data that satisfies all detected constraints',
    data,
    type: 'happy',
  };
}

/**
 * Generate boundary test scenarios
 */
function generateBoundaryScenarios(variables: VariableInfo[]): TestScenario[] {
  const scenarios: TestScenario[] = [];
  
  for (const variable of variables) {
    if (variable.constraints.length === 0) continue;
    
    const boundaryValues = generateBoundaryValues(variable.constraints);
    
    for (const value of boundaryValues.slice(0, 3)) {
      const data: Record<string, unknown> = {};
      
      // Set boundary value for this variable
      data[variable.name] = value;
      
      // Set valid values for other variables
      for (const other of variables) {
        if (other.name !== variable.name) {
          data[other.name] = generateValueByType(
            other.inferredType || 'unknown',
            other.constraints
          );
        }
      }
      
      scenarios.push({
        name: `Boundary: ${variable.name} = ${JSON.stringify(value)}`,
        description: `Testing boundary value for ${variable.name}`,
        data,
        type: 'boundary',
      });
    }
  }
  
  return scenarios.slice(0, 5); // Limit boundary scenarios
}

/**
 * Generate failure scenarios that should fail validation
 */
function generateFailureScenarios(variables: VariableInfo[]): TestScenario[] {
  const scenarios: TestScenario[] = [];
  
  for (const variable of variables) {
    const data: Record<string, unknown> = {};
    
    // Generate invalid value for this variable
    for (const constraint of variable.constraints) {
      if (constraint.type === 'numeric') {
        // Generate value that violates the constraint
        switch (constraint.operator) {
          case '>':
          case '>=':
            data[variable.name] = constraint.value - 100;
            break;
          case '<':
          case '<=':
            data[variable.name] = constraint.value + 100;
            break;
          case '==':
            data[variable.name] = constraint.value + 1;
            break;
        }
      } else if (constraint.type === 'string' && constraint.operator === 'in') {
        data[variable.name] = 'invalid_value_not_in_list';
      }
    }
    
    // If no constraints, use null
    if (!data[variable.name]) {
      data[variable.name] = null;
    }
    
    // Set valid values for other variables
    for (const other of variables) {
      if (other.name !== variable.name) {
        data[other.name] = generateValueByType(
          other.inferredType || 'unknown',
          other.constraints
        );
      }
    }
    
    if (Object.keys(data).length > 0) {
      scenarios.push({
        name: `Failure: Invalid ${variable.name}`,
        description: `Testing with invalid value for ${variable.name}`,
        data,
        type: 'failure',
      });
    }
  }
  
  return scenarios.slice(0, 3); // Limit failure scenarios
}

/**
 * Generate random valid variations
 */
function generateRandomVariations(variables: VariableInfo[], count: number): TestScenario[] {
  const scenarios: TestScenario[] = [];
  
  for (let i = 0; i < count; i++) {
    const data: Record<string, unknown> = {};
    
    for (const variable of variables) {
      data[variable.name] = generateValueByType(
        variable.inferredType || 'unknown',
        variable.constraints
      );
    }
    
    scenarios.push({
      name: `Random Variation ${i + 1}`,
      description: 'Randomly generated valid data',
      data,
      type: 'random',
    });
  }
  
  return scenarios;
}

/**
 * Generate data object from variable info
 */
export function generateDataFromVariables(variables: VariableInfo[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  for (const variable of variables) {
    data[variable.name] = generateValueByType(
      variable.inferredType || 'unknown',
      variable.constraints
    );
  }
  
  return data;
}
