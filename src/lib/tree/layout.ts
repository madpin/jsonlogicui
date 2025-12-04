import { TreeNode, TreeLayout, TreeEdge, TreeConfig } from '@/types/tree';

const DEFAULT_CONFIG: TreeConfig = {
  nodeWidth: 180, // Base width, will be adjusted per node
  nodeHeight: 44,
  horizontalSpacing: 24,
  verticalSpacing: 50,
  orientation: 'vertical',
};

// Character width estimation (average for monospace-ish font)
const CHAR_WIDTH = 8;
const MIN_NODE_WIDTH = 120;
const MAX_NODE_WIDTH = 400;
const NODE_PADDING = 60; // Padding for icon, expand button, etc.

/**
 * Calculate dynamic node width based on label length
 */
function calculateNodeWidth(label: string): number {
  const textWidth = label.length * CHAR_WIDTH + NODE_PADDING;
  return Math.min(Math.max(textWidth, MIN_NODE_WIDTH), MAX_NODE_WIDTH);
}

/**
 * Calculate layout positions for tree nodes
 */
export function calculateTreeLayout(
  root: TreeNode,
  config: Partial<TreeConfig> = {}
): TreeLayout {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // First pass: calculate individual node widths based on label
  assignNodeWidths(root);
  
  // Second pass: calculate subtree widths
  calculateSubtreeWidths(root, cfg);
  
  // Third pass: assign positions
  if (cfg.orientation === 'vertical') {
    assignVerticalPositions(root, 0, 0, cfg);
  } else {
    assignHorizontalPositions(root, 0, 0, cfg);
  }
  
  // Collect all nodes and create edges
  const nodes = collectNodes(root);
  const edges = createEdges(root, cfg);
  
  // Calculate total dimensions
  const { width, height } = calculateDimensions(nodes);
  
  return { nodes, edges, width, height };
}

/**
 * Assign width to each node based on its label length
 */
function assignNodeWidths(node: TreeNode): void {
  node.width = calculateNodeWidth(node.label);
  node.height = DEFAULT_CONFIG.nodeHeight;
  
  for (const child of node.children) {
    assignNodeWidths(child);
  }
}

interface NodeWithWidth extends TreeNode {
  subtreeWidth?: number;
}

function calculateSubtreeWidths(node: NodeWithWidth, config: TreeConfig): number {
  const nodeWidth = node.width || config.nodeWidth;
  
  if (!node.expanded || node.children.length === 0) {
    node.subtreeWidth = nodeWidth;
    return nodeWidth;
  }
  
  const childrenWidth = node.children.reduce((sum, child) => {
    return sum + calculateSubtreeWidths(child as NodeWithWidth, config) + config.horizontalSpacing;
  }, -config.horizontalSpacing);
  
  node.subtreeWidth = Math.max(nodeWidth, childrenWidth);
  return node.subtreeWidth;
}

function assignVerticalPositions(
  node: NodeWithWidth,
  x: number,
  y: number,
  config: TreeConfig
): void {
  const nodeWidth = node.width || config.nodeWidth;
  const subtreeWidth = node.subtreeWidth || nodeWidth;
  
  // Center node in its subtree
  node.x = x + (subtreeWidth - nodeWidth) / 2;
  node.y = y;
  // node.width already set by assignNodeWidths
  node.height = config.nodeHeight;
  
  if (!node.expanded || node.children.length === 0) return;
  
  // Position children
  let childX = x;
  const childY = y + config.nodeHeight + config.verticalSpacing;
  
  for (const child of node.children) {
    const childNode = child as NodeWithWidth;
    const childWidth = childNode.subtreeWidth || childNode.width || config.nodeWidth;
    assignVerticalPositions(childNode, childX, childY, config);
    childX += childWidth + config.horizontalSpacing;
  }
}

function assignHorizontalPositions(
  node: NodeWithWidth,
  x: number,
  y: number,
  config: TreeConfig
): void {
  const nodeWidth = node.width || config.nodeWidth;
  const subtreeWidth = node.subtreeWidth || config.nodeHeight;
  
  node.x = x;
  node.y = y + (subtreeWidth - config.nodeHeight) / 2;
  // node.width already set by assignNodeWidths
  node.height = config.nodeHeight;
  
  if (!node.expanded || node.children.length === 0) return;
  
  let childY = y;
  const childX = x + nodeWidth + config.horizontalSpacing;
  
  for (const child of node.children) {
    const childNode = child as NodeWithWidth;
    const childHeight = childNode.subtreeWidth || config.nodeHeight;
    assignHorizontalPositions(childNode, childX, childY, config);
    childY += childHeight + config.verticalSpacing;
  }
}

function collectNodes(node: TreeNode): TreeNode[] {
  const nodes: TreeNode[] = [node];
  if (node.expanded) {
    for (const child of node.children) {
      nodes.push(...collectNodes(child));
    }
  }
  return nodes;
}

function createEdges(root: TreeNode, config: TreeConfig): TreeEdge[] {
  const edges: TreeEdge[] = [];
  
  function traverse(node: TreeNode): void {
    if (!node.expanded) return;
    
    for (const child of node.children) {
      const edge = createEdge(node, child, config);
      edges.push(edge);
      traverse(child);
    }
  }
  
  traverse(root);
  return edges;
}

function createEdge(parent: TreeNode, child: TreeNode, config: TreeConfig): TreeEdge {
  const parentWidth = parent.width || config.nodeWidth;
  const childWidth = child.width || config.nodeWidth;
  
  const px = (parent.x || 0) + parentWidth / 2;
  const py = (parent.y || 0) + config.nodeHeight;
  const cx = (child.x || 0) + childWidth / 2;
  const cy = child.y || 0;
  
  // Create curved path
  const midY = (py + cy) / 2;
  const path = config.orientation === 'vertical'
    ? `M ${px} ${py} C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`
    : `M ${py} ${px} C ${midY} ${px}, ${midY} ${cx}, ${cy} ${cx}`;
  
  return {
    id: `edge-${parent.id}-${child.id}`,
    source: parent.id,
    target: child.id,
    path,
  };
}

function calculateDimensions(
  nodes: TreeNode[]
): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;
  
  for (const node of nodes) {
    const nodeWidth = node.width || 180;
    const nodeHeight = node.height || 44;
    maxX = Math.max(maxX, (node.x || 0) + nodeWidth);
    maxY = Math.max(maxY, (node.y || 0) + nodeHeight);
  }
  
  return {
    width: maxX + DEFAULT_CONFIG.horizontalSpacing,
    height: maxY + DEFAULT_CONFIG.verticalSpacing,
  };
}

/**
 * Get optimal zoom level to fit tree in viewport
 */
export function calculateFitZoom(
  layout: TreeLayout,
  viewportWidth: number,
  viewportHeight: number,
  padding = 40
): number {
  const scaleX = (viewportWidth - padding * 2) / layout.width;
  const scaleY = (viewportHeight - padding * 2) / layout.height;
  return Math.min(scaleX, scaleY, 1);
}
