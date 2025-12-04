'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TreeNode } from '@/types/tree';
import { calculateTreeLayout, calculateFitZoom } from '@/lib/tree/layout';
import { toggleNodeExpansion, expandAllNodes, collapseAllNodes } from '@/lib/tree/parser';
import { TreeNodeComponent } from './TreeNodeComponent';
import { TreeControls } from './TreeControls';

interface RuleTreeProps {
  root: TreeNode | null;
  className?: string;
}

export function RuleTree({ root, className }: RuleTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tree, setTree] = useState<TreeNode | null>(root);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Update tree when root changes
  useEffect(() => {
    setTree(root);
  }, [root]);

  // Calculate layout
  const layout = useMemo(() => {
    if (!tree) return null;
    return calculateTreeLayout(tree);
  }, [tree]);

  // Handle node toggle
  const handleToggle = useCallback((nodeId: string) => {
    if (!tree) return;
    setTree(toggleNodeExpansion(tree, nodeId));
  }, [tree]);

  // Handle node selection
  const handleSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z / 1.2, 0.3));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!layout || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newZoom = calculateFitZoom(layout, rect.width, rect.height);
    setZoom(newZoom);
    setPan({ x: 20, y: 20 });
  }, [layout]);

  const handleExpandAll = useCallback(() => {
    if (!tree) return;
    setTree(expandAllNodes(tree));
  }, [tree]);

  const handleCollapseAll = useCallback(() => {
    if (!tree) return;
    setTree(collapseAllNodes(tree));
  }, [tree]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom - only when not over a tooltip or scrollable element
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Check if the event target is inside a tooltip or scrollable content
    const target = e.target as HTMLElement;
    const isInTooltip = target.closest('[data-slot="tooltip-content"]');
    const isScrollable = target.closest('[data-scrollable]');
    
    if (isInTooltip || isScrollable) {
      // Let the tooltip/scrollable handle the scroll
      return;
    }
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.3), 3));
  }, []);

  if (!tree || !layout) {
    return (
      <div className={`flex items-center justify-center h-full text-muted-foreground ${className}`}>
        Enter a valid JSONLogic rule to see the tree visualization
      </div>
    );
  }

  // Update selected state in nodes
  const nodesWithSelection = layout.nodes.map(node => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));

  return (
    <div className={`relative h-full overflow-hidden ${className}`}>
      {/* Controls */}
      <TreeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        zoom={zoom}
      />

      {/* Tree Canvas */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: layout.width,
            height: layout.height,
          }}
        >
          {/* Edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.width}
            height={layout.height}
          >
            {layout.edges.map(edge => (
              <path
                key={edge.id}
                d={edge.path}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeOpacity={0.3}
                className="text-foreground"
              />
            ))}
          </svg>

          {/* Nodes */}
          {nodesWithSelection.map(node => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
