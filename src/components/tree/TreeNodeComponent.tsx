'use client';

import { memo } from 'react';
import { HelpCircle, Variable, CheckCircle, XCircle, List, GitBranch, ChevronRight, ChevronDown } from 'lucide-react';
import { TreeNode, NODE_COLORS, NodeType } from '@/types/tree';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TreeNodeComponentProps {
  node: TreeNode;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}

const ICONS: Record<NodeType, typeof HelpCircle> = {
  operator: HelpCircle,    // Decision/condition - question mark
  variable: Variable,      // Variable reference
  value: CheckCircle,      // Result value - checkmark
  array: List,             // Array
  object: GitBranch,       // Branch
};

// Human-readable type labels
const TYPE_LABELS: Record<NodeType, string> = {
  operator: 'Condition',
  variable: 'Variable',
  value: 'Result',
  array: 'Array',
  object: 'Branch',
};

// Check if node is a true branch result
function isTrueBranch(node: TreeNode): boolean {
  return node.operator === 'true_branch';
}

// Check if node is a false branch result
function isFalseBranch(node: TreeNode): boolean {
  return node.operator === 'false_branch';
}

// Get colors based on node type and branch status
function getNodeColors(node: TreeNode) {
  // True branch - green
  if (isTrueBranch(node)) {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300'
    };
  }
  // False branch - red/rose
  if (isFalseBranch(node)) {
    return {
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      border: 'border-rose-400',
      text: 'text-rose-700 dark:text-rose-300'
    };
  }
  // Default colors from type
  return NODE_COLORS[node.type];
}

// Get icon based on node type and branch status
function getNodeIcon(node: TreeNode) {
  if (isTrueBranch(node)) return CheckCircle;
  if (isFalseBranch(node)) return XCircle;
  return ICONS[node.type];
}

// Get description based on node type and content
function getNodeDescription(node: TreeNode): string {
  // Check for true/false branch results
  if (isTrueBranch(node)) {
    return 'This value is returned when the condition is TRUE.';
  }
  if (isFalseBranch(node)) {
    return 'This value is returned when the condition is FALSE.';
  }
  
  switch (node.type) {
    case 'operator':
      if (node.operator === 'if') {
        return 'Decision point: if true → first child, if false → second child.';
      }
      if (node.operator === 'and') {
        return 'ALL conditions must be true for this to pass.';
      }
      if (node.operator === 'or') {
        return 'ANY condition being true will make this pass.';
      }
      if (node.operator === 'in') {
        return 'Checks if the value exists in the array/string.';
      }
      if (['==', '===', '!=', '!==', '>', '>=', '<', '<='].includes(node.operator || '')) {
        return 'Compares two values and returns true or false.';
      }
      return 'Performs an operation on the input values.';
    case 'variable':
      return 'References a value from the input data.';
    case 'value':
      return 'A literal value that will be used as-is.';
    case 'array':
      return 'A list of values.';
    case 'object':
      return 'A group of related items.';
    default:
      return '';
  }
}

function TreeNodeComponentInner({ node, onToggle, onSelect }: TreeNodeComponentProps) {
  const Icon = getNodeIcon(node);
  const colors = getNodeColors(node);
  const hasChildren = node.children.length > 0;
  
  const handleClick = () => {
    onSelect(node.id);
  };
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition-all',
              'hover:shadow-lg hover:scale-[1.02]',
              colors.bg,
              colors.border,
              node.selected && 'ring-2 ring-offset-2 ring-primary',
              node.highlighted && 'ring-2 ring-offset-1 ring-yellow-400',
              node.isActive && 'animate-pulse'
            )}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
            }}
            onClick={handleClick}
          >
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <button
                onClick={handleToggle}
                className="shrink-0 hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5"
              >
                {node.expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            
            {/* Icon */}
            <Icon className={cn('h-4 w-4 shrink-0', colors.text)} />
            
            {/* Label */}
            <span className={cn('text-sm font-medium truncate flex-1', colors.text)} title={node.label}>
              {node.label}
            </span>
            
            {/* Child count badge */}
            {hasChildren && !node.expanded && (
              <span className="shrink-0 text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
                {node.children.length}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="w-80 max-h-96 p-0 overflow-hidden"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="p-4 space-y-3 overflow-auto max-h-96" data-scrollable>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', colors.bg, colors.border, 'border-2')}>
                <Icon className={cn('h-5 w-5', colors.text)} />
              </div>
              <div>
                <div className="font-semibold text-base">{TYPE_LABELS[node.type]}</div>
                {node.operator && (
                  <div className="text-sm text-muted-foreground">
                    Operator: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{node.operator}</code>
                  </div>
                )}
              </div>
            </div>
            
            {/* Full Label */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Expression</div>
              <code className="text-sm font-mono break-all leading-relaxed">{node.label}</code>
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getNodeDescription(node)}
            </p>
            
            {/* Raw JSON (for operators) */}
            {node.value !== undefined && node.type === 'operator' && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">JSONLogic Code</div>
                <pre className="text-xs font-mono bg-muted/50 p-3 rounded-lg overflow-auto max-h-32" data-scrollable>
                  {JSON.stringify(node.value, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Value display */}
            {node.type === 'value' && node.value !== undefined && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Returns</div>
                <code className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {JSON.stringify(node.value)}
                </code>
              </div>
            )}
            
            {/* Children info */}
            {hasChildren && (
              <div className="text-sm text-muted-foreground border-t pt-3">
                {node.expanded 
                  ? `${node.children.length} branch${node.children.length > 1 ? 'es' : ''} shown`
                  : `Click to expand ${node.children.length} branch${node.children.length > 1 ? 'es' : ''}`
                }
              </div>
            )}
            
            {/* Evaluation result */}
            {node.evaluationResult !== undefined && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">Evaluated Result</div>
                <code className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {JSON.stringify(node.evaluationResult)}
                </code>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const TreeNodeComponent = memo(TreeNodeComponentInner);
