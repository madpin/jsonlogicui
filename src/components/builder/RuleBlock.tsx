'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLogicRule, isJsonLogicOperator } from '@/types/jsonlogic';
import { NODE_COLORS, NodeType } from '@/types/tree';
import { cn } from '@/lib/utils';

interface RuleBlockProps {
  rule: JsonLogicRule;
  path: string[];
  onUpdate: (path: string[], value: unknown) => void;
  onDelete?: () => void;
  depth?: number;
}

export function RuleBlock({ rule, path, onUpdate, onDelete, depth = 0 }: RuleBlockProps) {
  const [expanded, setExpanded] = useState(true);

  // Determine node type and styling
  const getNodeInfo = (): { type: NodeType; label: string; operator?: string } => {
    if (rule === null) {
      return { type: 'value', label: 'null' };
    }
    if (typeof rule === 'string') {
      return { type: 'value', label: `"${rule}"` };
    }
    if (typeof rule === 'number') {
      return { type: 'value', label: String(rule) };
    }
    if (typeof rule === 'boolean') {
      return { type: 'value', label: String(rule) };
    }
    if (Array.isArray(rule)) {
      return { type: 'array', label: `Array[${rule.length}]` };
    }
    
    const keys = Object.keys(rule);
    if (keys.length === 0) {
      return { type: 'object', label: '{}' };
    }
    
    const operator = keys[0];
    if (operator === 'var') {
      const varValue = (rule as Record<string, unknown>).var;
      const varName = Array.isArray(varValue) ? varValue[0] : varValue;
      return { type: 'variable', label: String(varName) || 'data', operator: 'var' };
    }
    
    return { type: 'operator', label: operator, operator };
  };

  const { type, label, operator } = getNodeInfo();
  const colors = NODE_COLORS[type];
  const hasChildren = typeof rule === 'object' && rule !== null && !Array.isArray(rule) && operator;

  // Get children for operators
  const getChildren = (): { key: string; value: JsonLogicRule }[] => {
    if (!operator || typeof rule !== 'object' || rule === null) return [];
    
    const operands = (rule as Record<string, unknown>)[operator];
    
    if (Array.isArray(operands)) {
      return operands.map((op, i) => ({ key: String(i), value: op as JsonLogicRule }));
    }
    if (operands !== null && operands !== undefined) {
      return [{ key: '0', value: operands as JsonLogicRule }];
    }
    return [];
  };

  const children = getChildren();

  // Handle value editing
  const handleValueChange = (newValue: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(newValue);
    } catch {
      parsed = newValue;
    }
    onUpdate(path, parsed);
  };

  // Render editable value
  const renderEditableValue = () => {
    if (type === 'value' || type === 'variable') {
      const currentValue = type === 'variable' 
        ? ((rule as Record<string, unknown>).var as string)
        : rule;
      
      return (
        <input
          type="text"
          value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue)}
          onChange={(e) => {
            if (type === 'variable') {
              onUpdate([...path, 'var'], e.target.value);
            } else {
              handleValueChange(e.target.value);
            }
          }}
          className={cn(
            'flex-1 min-w-0 px-2 py-0.5 text-sm bg-transparent border-0 focus:ring-1 focus:ring-ring rounded',
            colors.text
          )}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return <span className={cn('text-sm font-medium', colors.text)}>{label}</span>;
  };

  return (
    <div className={cn('rounded-lg border-2', colors.bg, colors.border)} style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 cursor-pointer',
          hasChildren && 'hover:bg-black/5 dark:hover:bg-white/5'
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Drag Handle */}
        <GripVertical className="h-3 w-3 text-muted-foreground opacity-50" />
        
        {/* Expand/Collapse */}
        {hasChildren && children.length > 0 && (
          <button className="shrink-0">
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        {/* Type Badge */}
        {operator && (
          <span className={cn(
            'text-[10px] font-mono px-1.5 py-0.5 rounded',
            'bg-black/10 dark:bg-white/10',
            colors.text
          )}>
            {operator}
          </span>
        )}
        
        {/* Value/Label */}
        {renderEditableValue()}
        
        {/* Delete Button */}
        {onDelete && depth === 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 opacity-50 hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Children */}
      {hasChildren && expanded && children.length > 0 && (
        <div className="px-2 pb-2 space-y-1">
          {children.map(({ key, value }) => (
            <RuleBlock
              key={key}
              rule={value}
              path={[...path, operator!, key]}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      
      {/* Array items */}
      {Array.isArray(rule) && expanded && (
        <div className="px-2 pb-2 space-y-1">
          {rule.map((item, index) => (
            <RuleBlock
              key={index}
              rule={item}
              path={[...path, String(index)]}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
