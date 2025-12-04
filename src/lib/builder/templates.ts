import { JsonLogicRule } from '@/types/jsonlogic';

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'comparison' | 'logic' | 'arithmetic' | 'array' | 'string' | 'data';
  template: JsonLogicRule;
  slots: TemplateSlot[];
}

export interface TemplateSlot {
  path: string[];
  name: string;
  type: 'variable' | 'value' | 'rule';
  defaultValue?: unknown;
  placeholder?: string;
}

export const ruleTemplates: RuleTemplate[] = [
  // Comparison templates
  {
    id: 'greater-than',
    name: 'Greater Than',
    description: 'Check if a value is greater than another',
    category: 'comparison',
    template: { '>': [{ var: '' }, 0] },
    slots: [
      { path: ['>', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'variable_name' },
      { path: ['>', '1'], name: 'Value', type: 'value', defaultValue: 0 },
    ],
  },
  {
    id: 'greater-equal',
    name: 'Greater or Equal',
    description: 'Check if a value is greater than or equal to another',
    category: 'comparison',
    template: { '>=': [{ var: '' }, 0] },
    slots: [
      { path: ['>=', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'variable_name' },
      { path: ['>=', '1'], name: 'Value', type: 'value', defaultValue: 0 },
    ],
  },
  {
    id: 'less-than',
    name: 'Less Than',
    description: 'Check if a value is less than another',
    category: 'comparison',
    template: { '<': [{ var: '' }, 0] },
    slots: [
      { path: ['<', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'variable_name' },
      { path: ['<', '1'], name: 'Value', type: 'value', defaultValue: 0 },
    ],
  },
  {
    id: 'equals',
    name: 'Equals',
    description: 'Check if two values are equal',
    category: 'comparison',
    template: { '==': [{ var: '' }, ''] },
    slots: [
      { path: ['==', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'variable_name' },
      { path: ['==', '1'], name: 'Value', type: 'value', defaultValue: '' },
    ],
  },
  {
    id: 'not-equals',
    name: 'Not Equals',
    description: 'Check if two values are not equal',
    category: 'comparison',
    template: { '!=': [{ var: '' }, ''] },
    slots: [
      { path: ['!=', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'variable_name' },
      { path: ['!=', '1'], name: 'Value', type: 'value', defaultValue: '' },
    ],
  },

  // Logic templates
  {
    id: 'if-then-else',
    name: 'If-Then-Else',
    description: 'Conditional logic with if/then/else',
    category: 'logic',
    template: { if: [true, 'then_value', 'else_value'] },
    slots: [
      { path: ['if', '0'], name: 'Condition', type: 'rule', defaultValue: true },
      { path: ['if', '1'], name: 'Then', type: 'value', defaultValue: 'then_value' },
      { path: ['if', '2'], name: 'Else', type: 'value', defaultValue: 'else_value' },
    ],
  },
  {
    id: 'and',
    name: 'AND',
    description: 'All conditions must be true',
    category: 'logic',
    template: { and: [true, true] },
    slots: [
      { path: ['and', '0'], name: 'Condition 1', type: 'rule', defaultValue: true },
      { path: ['and', '1'], name: 'Condition 2', type: 'rule', defaultValue: true },
    ],
  },
  {
    id: 'or',
    name: 'OR',
    description: 'At least one condition must be true',
    category: 'logic',
    template: { or: [false, false] },
    slots: [
      { path: ['or', '0'], name: 'Condition 1', type: 'rule', defaultValue: false },
      { path: ['or', '1'], name: 'Condition 2', type: 'rule', defaultValue: false },
    ],
  },
  {
    id: 'not',
    name: 'NOT',
    description: 'Negate a condition',
    category: 'logic',
    template: { '!': [true] },
    slots: [
      { path: ['!', '0'], name: 'Condition', type: 'rule', defaultValue: true },
    ],
  },

  // Arithmetic templates
  {
    id: 'add',
    name: 'Add',
    description: 'Add two or more numbers',
    category: 'arithmetic',
    template: { '+': [{ var: '' }, 0] },
    slots: [
      { path: ['+', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'number_var' },
      { path: ['+', '1'], name: 'Value', type: 'value', defaultValue: 0 },
    ],
  },
  {
    id: 'subtract',
    name: 'Subtract',
    description: 'Subtract numbers',
    category: 'arithmetic',
    template: { '-': [{ var: '' }, 0] },
    slots: [
      { path: ['-', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'number_var' },
      { path: ['-', '1'], name: 'Value', type: 'value', defaultValue: 0 },
    ],
  },
  {
    id: 'multiply',
    name: 'Multiply',
    description: 'Multiply numbers',
    category: 'arithmetic',
    template: { '*': [{ var: '' }, 1] },
    slots: [
      { path: ['*', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'number_var' },
      { path: ['*', '1'], name: 'Multiplier', type: 'value', defaultValue: 1 },
    ],
  },
  {
    id: 'divide',
    name: 'Divide',
    description: 'Divide numbers',
    category: 'arithmetic',
    template: { '/': [{ var: '' }, 1] },
    slots: [
      { path: ['/', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'number_var' },
      { path: ['/', '1'], name: 'Divisor', type: 'value', defaultValue: 1 },
    ],
  },

  // Array templates
  {
    id: 'in-array',
    name: 'In Array',
    description: 'Check if value is in array',
    category: 'array',
    template: { in: [{ var: '' }, []] },
    slots: [
      { path: ['in', '0', 'var'], name: 'Variable', type: 'variable', placeholder: 'value' },
      { path: ['in', '1'], name: 'Array', type: 'value', defaultValue: [] },
    ],
  },
  {
    id: 'array-some',
    name: 'Some',
    description: 'Check if any array element matches condition',
    category: 'array',
    template: { some: [{ var: '' }, true] },
    slots: [
      { path: ['some', '0', 'var'], name: 'Array Variable', type: 'variable', placeholder: 'array' },
      { path: ['some', '1'], name: 'Condition', type: 'rule', defaultValue: true },
    ],
  },
  {
    id: 'array-all',
    name: 'All',
    description: 'Check if all array elements match condition',
    category: 'array',
    template: { all: [{ var: '' }, true] },
    slots: [
      { path: ['all', '0', 'var'], name: 'Array Variable', type: 'variable', placeholder: 'array' },
      { path: ['all', '1'], name: 'Condition', type: 'rule', defaultValue: true },
    ],
  },

  // String templates
  {
    id: 'concat',
    name: 'Concatenate',
    description: 'Join strings together',
    category: 'string',
    template: { cat: [{ var: '' }, ' ', { var: '' }] },
    slots: [
      { path: ['cat', '0', 'var'], name: 'First Variable', type: 'variable', placeholder: 'first' },
      { path: ['cat', '1'], name: 'Separator', type: 'value', defaultValue: ' ' },
      { path: ['cat', '2', 'var'], name: 'Second Variable', type: 'variable', placeholder: 'second' },
    ],
  },
  {
    id: 'substr',
    name: 'Substring',
    description: 'Extract part of a string',
    category: 'string',
    template: { substr: [{ var: '' }, 0, 5] },
    slots: [
      { path: ['substr', '0', 'var'], name: 'String Variable', type: 'variable', placeholder: 'text' },
      { path: ['substr', '1'], name: 'Start Index', type: 'value', defaultValue: 0 },
      { path: ['substr', '2'], name: 'Length', type: 'value', defaultValue: 5 },
    ],
  },

  // Data access templates
  {
    id: 'var',
    name: 'Variable',
    description: 'Access a data variable',
    category: 'data',
    template: { var: '' },
    slots: [
      { path: ['var'], name: 'Variable Path', type: 'variable', placeholder: 'path.to.variable' },
    ],
  },
  {
    id: 'var-default',
    name: 'Variable with Default',
    description: 'Access a variable with a default value',
    category: 'data',
    template: { var: ['', null] },
    slots: [
      { path: ['var', '0'], name: 'Variable Path', type: 'variable', placeholder: 'path.to.variable' },
      { path: ['var', '1'], name: 'Default Value', type: 'value', defaultValue: null },
    ],
  },
];

export function getTemplatesByCategory(category: RuleTemplate['category']): RuleTemplate[] {
  return ruleTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): RuleTemplate | undefined {
  return ruleTemplates.find(t => t.id === id);
}

export const templateCategories: { id: RuleTemplate['category']; name: string; icon: string }[] = [
  { id: 'comparison', name: 'Comparisons', icon: 'Scale' },
  { id: 'logic', name: 'Logic', icon: 'GitBranch' },
  { id: 'arithmetic', name: 'Arithmetic', icon: 'Calculator' },
  { id: 'array', name: 'Arrays', icon: 'List' },
  { id: 'string', name: 'Strings', icon: 'Type' },
  { id: 'data', name: 'Data Access', icon: 'Database' },
];
