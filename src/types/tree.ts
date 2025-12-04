// Tree visualization type definitions

export type NodeType = 'operator' | 'variable' | 'value' | 'array' | 'object';

export interface TreeNode {
  id: string;
  type: NodeType;
  label: string;
  value?: unknown;
  operator?: string;
  children: TreeNode[];
  parent?: string;
  depth: number;
  path: string[];
  // Layout properties
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // State properties
  expanded: boolean;
  highlighted: boolean;
  selected: boolean;
  // Evaluation state
  evaluationResult?: unknown;
  isActive?: boolean;
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  path: string; // SVG path data
}

export interface TreeConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  orientation: 'horizontal' | 'vertical';
}

// Node color scheme based on type
export const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  operator: {
    // Decision/condition nodes - amber/yellow for "question" feel
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-500',
    text: 'text-amber-800 dark:text-amber-200'
  },
  variable: {
    // Variables - blue for data reference
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300'
  },
  value: {
    // Result values - green for "output/result"
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  array: {
    // Arrays - purple for collections
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-500',
    text: 'text-purple-700 dark:text-purple-300'
  },
  object: {
    // Branch labels (Yes/No) - slate/gray for structure
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-400 dark:border-slate-600',
    text: 'text-slate-700 dark:text-slate-300'
  }
};

// Icons for each node type (Lucide icon names)
export const NODE_ICONS: Record<NodeType, string> = {
  operator: 'Settings2',
  variable: 'Variable',
  value: 'Hash',
  array: 'List',
  object: 'Braces'
};
