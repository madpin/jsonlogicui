import { JsonLogicRule } from '@/types/jsonlogic';

export interface Example {
  id: string;
  name: string;
  description: string;
  category: 'comparisons' | 'arrays' | 'strings' | 'business' | 'logic';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rule: JsonLogicRule;
  sampleData: Record<string, unknown>;
  expectedResult: unknown;
  /** Detailed comment explaining the rule structure */
  comment: string;
}

export const examples: Example[] = [
  // ============================================
  // COMPARISONS - Basic comparison operators
  // ============================================
  {
    id: 'simple-comparison',
    name: 'Simple Comparison',
    description: 'Check if age is greater than or equal to 18',
    category: 'comparisons',
    difficulty: 'beginner',
    rule: { '>=': [{ var: 'age' }, 18] },
    sampleData: { age: 21 },
    expectedResult: true,
    comment: `// Greater-than-or-equal comparison
// 
// Structure: { ">=": [left, right] }
// - ">=": The comparison operator
// - { "var": "age" }: Gets the "age" value from data
// - 18: The threshold value to compare against
//
// Returns: true if age >= 18, false otherwise`,
  },
  {
    id: 'equality-check',
    name: 'Equality Check',
    description: 'Check if status equals "active"',
    category: 'comparisons',
    difficulty: 'beginner',
    rule: { '==': [{ var: 'status' }, 'active'] },
    sampleData: { status: 'active' },
    expectedResult: true,
    comment: `// Equality comparison (loose equality)
//
// Structure: { "==": [left, right] }
// - "==": Loose equality (type coercion allowed)
// - { "var": "status" }: Gets "status" from data
// - "active": The string to compare against
//
// Note: Use "===" for strict equality (no type coercion)`,
  },
  {
    id: 'between-check',
    name: 'Between Check',
    description: 'Check if value is between 10 and 100',
    category: 'comparisons',
    difficulty: 'beginner',
    rule: { and: [{ '>=': [{ var: 'value' }, 10] }, { '<=': [{ var: 'value' }, 100] }] },
    sampleData: { value: 50 },
    expectedResult: true,
    comment: `// Range check using AND logic
//
// Structure: { "and": [condition1, condition2] }
// - First condition: value >= 10 (lower bound)
// - Second condition: value <= 100 (upper bound)
//
// Both conditions must be true for the result to be true
// This is equivalent to: 10 <= value <= 100`,
  },
  
  // ============================================
  // LOGIC - Logical operators and conditionals
  // ============================================
  {
    id: 'and-condition',
    name: 'AND Condition',
    description: 'Check if user is adult AND has verified email',
    category: 'logic',
    difficulty: 'beginner',
    rule: { and: [{ '>=': [{ var: 'age' }, 18] }, { '==': [{ var: 'emailVerified' }, true] }] },
    sampleData: { age: 25, emailVerified: true },
    expectedResult: true,
    comment: `// Logical AND - all conditions must be true
//
// Structure: { "and": [condition1, condition2, ...] }
// - Evaluates conditions left to right
// - Short-circuits: stops at first false
// - Returns last evaluated value (truthy/falsy)
//
// Here: User must be 18+ AND have verified email`,
  },
  {
    id: 'or-condition',
    name: 'OR Condition',
    description: 'Check if user is admin OR moderator',
    category: 'logic',
    difficulty: 'beginner',
    rule: { or: [{ '==': [{ var: 'role' }, 'admin'] }, { '==': [{ var: 'role' }, 'moderator'] }] },
    sampleData: { role: 'admin' },
    expectedResult: true,
    comment: `// Logical OR - at least one condition must be true
//
// Structure: { "or": [condition1, condition2, ...] }
// - Evaluates conditions left to right
// - Short-circuits: stops at first true
// - Returns first truthy value or last value
//
// Here: User can be either admin OR moderator`,
  },
  {
    id: 'if-then-else',
    name: 'If-Then-Else',
    description: 'Return "adult" if age >= 18, otherwise "minor"',
    category: 'logic',
    difficulty: 'intermediate',
    rule: { if: [{ '>=': [{ var: 'age' }, 18] }, 'adult', 'minor'] },
    sampleData: { age: 16 },
    expectedResult: 'minor',
    comment: `// Conditional IF statement
//
// Structure: { "if": [condition, then_value, else_value] }
// - condition: The test to evaluate
// - then_value: Returned if condition is truthy
// - else_value: Returned if condition is falsy
//
// Similar to: condition ? then_value : else_value`,
  },
  {
    id: 'nested-if',
    name: 'Nested If',
    description: 'Categorize age into child, teen, adult, senior',
    category: 'logic',
    difficulty: 'intermediate',
    rule: {
      if: [
        { '<': [{ var: 'age' }, 13] }, 'child',
        { '<': [{ var: 'age' }, 20] }, 'teen',
        { '<': [{ var: 'age' }, 65] }, 'adult',
        'senior'
      ]
    },
    sampleData: { age: 35 },
    expectedResult: 'adult',
    comment: `// Chained IF-ELSE (like switch/case)
//
// Structure: { "if": [cond1, val1, cond2, val2, ..., default] }
// - Evaluates conditions in order
// - Returns value after first true condition
// - Last value (odd position) is the default/else
//
// Flow: age < 13 → child
//       age < 20 → teen
//       age < 65 → adult
//       else → senior`,
  },
  
  // ============================================
  // ARRAYS - Array operations and iterations
  // ============================================
  {
    id: 'in-array',
    name: 'In Array',
    description: 'Check if color is in allowed list',
    category: 'arrays',
    difficulty: 'beginner',
    rule: { in: [{ var: 'color' }, ['red', 'green', 'blue']] },
    sampleData: { color: 'green' },
    expectedResult: true,
    comment: `// Check if value exists in array
//
// Structure: { "in": [needle, haystack] }
// - needle: The value to search for
// - haystack: The array to search in
//
// Returns: true if needle is found in haystack
// Also works for substring in string`,
  },
  {
    id: 'array-some',
    name: 'Array Some',
    description: 'Check if any item in cart costs more than 100',
    category: 'arrays',
    difficulty: 'intermediate',
    rule: { some: [{ var: 'cart' }, { '>': [{ var: '' }, 100] }] },
    sampleData: { cart: [50, 75, 150, 25] },
    expectedResult: true,
    comment: `// Check if ANY array element matches condition
//
// Structure: { "some": [array, test_rule] }
// - array: The array to iterate over
// - test_rule: Applied to each element
// - { "var": "" }: References current element
//
// Returns: true if at least one element passes
// Short-circuits on first match`,
  },
  {
    id: 'array-all',
    name: 'Array All',
    description: 'Check if all scores are passing (>= 60)',
    category: 'arrays',
    difficulty: 'intermediate',
    rule: { all: [{ var: 'scores' }, { '>=': [{ var: '' }, 60] }] },
    sampleData: { scores: [75, 82, 91, 68] },
    expectedResult: true,
    comment: `// Check if ALL array elements match condition
//
// Structure: { "all": [array, test_rule] }
// - array: The array to iterate over
// - test_rule: Applied to each element
// - { "var": "" }: References current element
//
// Returns: true only if ALL elements pass
// Short-circuits on first failure`,
  },
  {
    id: 'array-filter',
    name: 'Array Filter',
    description: 'Filter items greater than 50',
    category: 'arrays',
    difficulty: 'intermediate',
    rule: { filter: [{ var: 'items' }, { '>': [{ var: '' }, 50] }] },
    sampleData: { items: [10, 60, 30, 80, 45, 90] },
    expectedResult: [60, 80, 90],
    comment: `// Filter array elements by condition
//
// Structure: { "filter": [array, test_rule] }
// - array: The source array
// - test_rule: Condition for each element
// - { "var": "" }: References current element
//
// Returns: New array with only matching elements
// Original array is not modified`,
  },
  {
    id: 'array-map',
    name: 'Array Map',
    description: 'Double each number in the array',
    category: 'arrays',
    difficulty: 'intermediate',
    rule: { map: [{ var: 'numbers' }, { '*': [{ var: '' }, 2] }] },
    sampleData: { numbers: [1, 2, 3, 4, 5] },
    expectedResult: [2, 4, 6, 8, 10],
    comment: `// Transform each array element
//
// Structure: { "map": [array, transform_rule] }
// - array: The source array
// - transform_rule: Applied to each element
// - { "var": "" }: References current element
//
// Returns: New array with transformed values
// Same length as input array`,
  },
  {
    id: 'array-reduce',
    name: 'Array Reduce',
    description: 'Sum all numbers in array',
    category: 'arrays',
    difficulty: 'advanced',
    rule: { reduce: [{ var: 'numbers' }, { '+': [{ var: 'current' }, { var: 'accumulator' }] }, 0] },
    sampleData: { numbers: [1, 2, 3, 4, 5] },
    expectedResult: 15,
    comment: `// Reduce array to single value
//
// Structure: { "reduce": [array, reducer, initial] }
// - array: The source array
// - reducer: Combines accumulator + current
// - initial: Starting value for accumulator
//
// Special vars in reducer:
// - { "var": "current" }: Current element
// - { "var": "accumulator" }: Running total
//
// Here: 0 + 1 + 2 + 3 + 4 + 5 = 15`,
  },
  
  // ============================================
  // STRINGS - String manipulation
  // ============================================
  {
    id: 'string-concat',
    name: 'String Concatenation',
    description: 'Combine first and last name',
    category: 'strings',
    difficulty: 'beginner',
    rule: { cat: [{ var: 'firstName' }, ' ', { var: 'lastName' }] },
    sampleData: { firstName: 'John', lastName: 'Doe' },
    expectedResult: 'John Doe',
    comment: `// Concatenate strings together
//
// Structure: { "cat": [str1, str2, str3, ...] }
// - Joins all arguments into one string
// - Non-strings are converted to strings
//
// Here: "John" + " " + "Doe" = "John Doe"`,
  },
  {
    id: 'string-substr',
    name: 'Substring',
    description: 'Get first 3 characters of a string',
    category: 'strings',
    difficulty: 'beginner',
    rule: { substr: [{ var: 'text' }, 0, 3] },
    sampleData: { text: 'Hello World' },
    expectedResult: 'Hel',
    comment: `// Extract substring from string
//
// Structure: { "substr": [string, start, length] }
// - string: The source string
// - start: Starting index (0-based)
// - length: Number of characters (optional)
//
// Negative start counts from end
// Here: "Hello World"[0:3] = "Hel"`,
  },
  
  // ============================================
  // BUSINESS RULES - Real-world examples
  // ============================================
  {
    id: 'discount-calculation',
    name: 'Discount Calculation',
    description: 'Apply 10% discount if total > 100, 20% if > 200',
    category: 'business',
    difficulty: 'intermediate',
    rule: {
      if: [
        { '>': [{ var: 'total' }, 200] },
        { '*': [{ var: 'total' }, 0.8] },
        { '>': [{ var: 'total' }, 100] },
        { '*': [{ var: 'total' }, 0.9] },
        { var: 'total' }
      ]
    },
    sampleData: { total: 150 },
    expectedResult: 135,
    comment: `// Tiered discount calculation
//
// Logic flow:
// 1. If total > 200 → 20% off (multiply by 0.8)
// 2. Else if total > 100 → 10% off (multiply by 0.9)
// 3. Else → no discount (return original)
//
// Example: $150 > $100, so 10% off
// $150 × 0.9 = $135`,
  },
  {
    id: 'eligibility-check',
    name: 'Loan Eligibility',
    description: 'Check if user is eligible for a loan',
    category: 'business',
    difficulty: 'advanced',
    rule: {
      and: [
        { '>=': [{ var: 'age' }, 21] },
        { '<=': [{ var: 'age' }, 65] },
        { '>=': [{ var: 'income' }, 30000] },
        { '>=': [{ var: 'creditScore' }, 650] },
        { '==': [{ var: 'employed' }, true] }
      ]
    },
    sampleData: { age: 35, income: 50000, creditScore: 720, employed: true },
    expectedResult: true,
    comment: `// Multi-criteria eligibility check
//
// ALL conditions must be true:
// 1. Age between 21-65 (two comparisons)
// 2. Income >= $30,000
// 3. Credit score >= 650
// 4. Currently employed
//
// If any condition fails, result is false
// Short-circuits on first failure`,
  },
  {
    id: 'shipping-cost',
    name: 'Shipping Cost Calculator',
    description: 'Calculate shipping based on weight and destination',
    category: 'business',
    difficulty: 'advanced',
    rule: {
      '*': [
        { var: 'weight' },
        {
          if: [
            { '==': [{ var: 'destination' }, 'domestic'] }, 2.5,
            { '==': [{ var: 'destination' }, 'international'] }, 8.0,
            5.0
          ]
        }
      ]
    },
    sampleData: { weight: 5, destination: 'international' },
    expectedResult: 40,
    comment: `// Dynamic shipping cost calculation
//
// Formula: weight × rate_per_unit
//
// Rate determined by destination:
// - "domestic" → $2.50/unit
// - "international" → $8.00/unit
// - other → $5.00/unit (default)
//
// Example: 5 kg × $8.00 = $40.00`,
  },
  {
    id: 'form-validation',
    name: 'Form Validation',
    description: 'Validate user registration form',
    category: 'business',
    difficulty: 'advanced',
    rule: {
      and: [
        { '!!': [{ var: 'email' }] },
        { '>=': [{ var: 'password.length' }, 8] },
        { '>=': [{ var: 'age' }, 13] },
        { '==': [{ var: 'termsAccepted' }, true] }
      ]
    },
    sampleData: { 
      email: 'user@example.com', 
      password: { length: 12 }, 
      age: 25, 
      termsAccepted: true 
    },
    expectedResult: true,
    comment: `// Form validation with multiple rules
//
// Validation checks:
// 1. { "!!": [...] } - Email is truthy (not empty)
// 2. Password length >= 8 characters
// 3. Age >= 13 (COPPA compliance)
// 4. Terms accepted === true
//
// Note: "password.length" uses dot notation
// to access nested property`,
  },
];

export function getExamplesByCategory(category: Example['category']): Example[] {
  return examples.filter(e => e.category === category);
}

export function getExamplesByDifficulty(difficulty: Example['difficulty']): Example[] {
  return examples.filter(e => e.difficulty === difficulty);
}

export function getExampleById(id: string): Example | undefined {
  return examples.find(e => e.id === id);
}

export const categories: { id: Example['category']; name: string; description: string }[] = [
  { id: 'comparisons', name: 'Comparisons', description: 'Basic comparison operators' },
  { id: 'logic', name: 'Logic', description: 'Logical operators and conditionals' },
  { id: 'arrays', name: 'Arrays', description: 'Array operations and iterations' },
  { id: 'strings', name: 'Strings', description: 'String manipulation' },
  { id: 'business', name: 'Business Rules', description: 'Real-world business logic examples' },
];
