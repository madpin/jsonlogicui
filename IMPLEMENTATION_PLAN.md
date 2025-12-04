# JSONLogic UI - Implementation Plan

This document outlines the phased implementation plan for the JSONLogic UI application.

---

## Phase 1: Core Foundation
**Estimated Time: 2-3 days**

### 1.1 Project Setup ✅
- [x] Initialize Next.js 16 with TypeScript
- [x] Configure Tailwind CSS 4
- [x] Install and configure shadcn/ui
- [x] Install core dependencies (json-logic-js, Monaco Editor, Lucide)

### 1.2 Type Definitions
- [ ] Create `src/types/jsonlogic.ts`
  - Define `JsonLogicRule` type
  - Define `JsonLogicOperator` enum
  - Define `ValidationResult` interface
  - Define `EvaluationTrace` interface
- [ ] Create `src/types/tree.ts`
  - Define `TreeNode` interface
  - Define `NodeType` enum (operator, variable, value, array)

### 1.3 JSONLogic Utilities
- [ ] Create `src/lib/jsonlogic/validator.ts`
  - `validateJson(input: string): { valid: boolean; error?: string }`
  - `validateJsonLogic(rule: unknown): ValidationResult`
  - `isJsonLogicOperator(key: string): boolean`
- [ ] Create `src/lib/jsonlogic/evaluator.ts`
  - `evaluate(rule: JsonLogicRule, data: object): unknown`
  - `evaluateWithTrace(rule: JsonLogicRule, data: object): EvaluationTrace`
- [ ] Create `src/lib/jsonlogic/analyzer.ts`
  - `extractVariables(rule: JsonLogicRule): string[]`
  - `extractConstraints(rule: JsonLogicRule): Constraint[]`
  - `inferVariableTypes(rule: JsonLogicRule): Map<string, VariableType>`

---

## Phase 2: Editor & Basic UI
**Estimated Time: 2-3 days**

### 2.1 Layout Structure
- [ ] Create main page layout with responsive grid
  - Left panel: Editor
  - Right panel: Visualization (tabs)
  - Bottom panel: Results & Data input
- [ ] Implement dark/light theme toggle

### 2.2 Monaco Editor Integration
- [ ] Create `src/components/editor/JsonEditor.tsx`
  - Monaco editor with JSON syntax highlighting
  - Real-time validation with error markers
  - Auto-formatting on save
  - Line numbers and minimap
- [ ] Create `src/components/editor/DataEditor.tsx`
  - Smaller editor for test data input
  - Variable auto-completion based on rule analysis

### 2.3 Validation UI
- [ ] Create `src/components/editor/ValidationStatus.tsx`
  - JSON syntax status indicator
  - JSONLogic validity indicator
  - Error message display with line highlighting
- [ ] Implement multi-key rule detection
  - Detect if JSON contains multiple rule keys
  - Validate each rule independently
  - Display per-key validation status

---

## Phase 3: Tree Visualization
**Estimated Time: 3-4 days**

### 3.1 Tree Data Structure
- [ ] Create `src/lib/tree/parser.ts`
  - `parseRuleToTree(rule: JsonLogicRule): TreeNode`
  - Handle nested rules recursively
  - Assign unique IDs to each node
- [ ] Create `src/lib/tree/layout.ts`
  - Calculate node positions
  - Handle tree balancing

### 3.2 Tree Components
- [ ] Create `src/components/tree/TreeNode.tsx`
  - Render individual node with icon based on type
  - Color coding:
    - 🟣 Purple: Operators
    - 🔵 Blue: Variables
    - 🟢 Green: Values (strings, numbers, booleans)
    - 🟡 Yellow: Arrays
  - Expand/collapse for nested nodes
  - Hover tooltip with node details
- [ ] Create `src/components/tree/RuleTree.tsx`
  - Container for tree visualization
  - SVG-based connecting lines
  - Recursive node rendering
- [ ] Create `src/components/tree/TreeControls.tsx`
  - Zoom in/out buttons
  - Fit to screen
  - Expand all / Collapse all
  - Pan controls (or drag to pan)

### 3.3 Interactive Features
- [ ] Node selection highlighting
- [ ] Path highlighting (root to selected node)
- [ ] Evaluation animation
  - Show data flowing through nodes
  - Highlight active evaluation path
  - Display intermediate results

---

## Phase 4: Mermaid Diagram Export
**Estimated Time: 2-3 days**

### 4.1 Converter Logic
- [ ] Create `src/lib/mermaid/converter.ts`
  - `toMermaidFlowchart(rule: JsonLogicRule): string`
  - `toMermaidDecisionTree(rule: JsonLogicRule): string`
  - Handle special characters escaping
  - Support different orientations (TD, LR, TB, RL)

### 4.2 Conversion Rules
```
Operator Mappings:
- if/then/else → Diamond decision nodes
- and/or → Parallel paths with join
- var → Rectangle with variable name
- Comparisons (>, <, ==) → Diamond with condition
- Values → Rounded rectangles
```

### 4.3 Mermaid Components
- [ ] Create `src/components/mermaid/MermaidPreview.tsx`
  - Live Mermaid diagram rendering
  - Use mermaid.js for client-side rendering
  - Error handling for invalid diagrams
- [ ] Create `src/components/mermaid/MermaidExport.tsx`
  - Copy Mermaid code to clipboard
  - Download as SVG
  - Download as PNG
  - Theme selector (default, dark, forest, neutral)
- [ ] Create `src/components/mermaid/MermaidOptions.tsx`
  - Orientation selector
  - Node shape preferences
  - Include/exclude values toggle

---

## Phase 5: Smart Test Data Generator
**Estimated Time: 3-4 days**

### 5.1 Constraint Analysis
- [ ] Create `src/lib/generator/ConstraintParser.ts`
  - Parse rules to extract constraints per variable
  - Handle compound constraints (and/or)
  - Constraint types:
    - Numeric: `>`, `>=`, `<`, `<=`, `==`, `!=`
    - String: `in`, `substr`, length constraints
    - Array: `in`, `all`, `some`, `none`
    - Boolean: `!`, `!!`

### 5.2 Value Generation
- [ ] Create `src/lib/generator/ValueGenerator.ts`
  - `generateNumber(constraints: NumericConstraint[]): number`
  - `generateString(constraints: StringConstraint[]): string`
  - `generateBoolean(): boolean`
  - `generateArray(itemConstraints: Constraint[]): unknown[]`
  - `generateBoundaryValues(constraint: Constraint): unknown[]`

### 5.3 Test Scenario Generation
- [ ] Create `src/lib/generator/ScenarioGenerator.ts`
  - Generate "happy path" data (satisfies all constraints)
  - Generate boundary cases
  - Generate failure cases (violates constraints)
  - Generate random valid variations

### 5.4 Generator UI
- [ ] Create `src/components/generator/DataGenerator.tsx`
  - Display detected variables with inferred types
  - Manual type override option
  - Generate button with scenario selector
  - Generated data preview
  - "Use this data" button to populate data editor
- [ ] Create `src/components/generator/VariableConfig.tsx`
  - Per-variable configuration
  - Custom value ranges
  - Enum values for strings

---

## Phase 6: Example Library
**Estimated Time: 2 days**

### 6.1 Example Definitions
- [ ] Create `src/lib/examples/comparisons.ts`
  - Basic comparisons (>, <, ==, !=)
  - Compound conditions (and, or)
  - Nested if/else
- [ ] Create `src/lib/examples/arrays.ts`
  - map, filter, reduce examples
  - all, some, none examples
  - in operator examples
- [ ] Create `src/lib/examples/strings.ts`
  - cat (concatenation)
  - substr examples
  - String comparisons
- [ ] Create `src/lib/examples/business.ts`
  - Pricing rules
  - Discount calculations
  - Eligibility checks
  - Form validation rules

### 6.2 Example UI
- [ ] Create `src/components/examples/ExamplePicker.tsx`
  - Category tabs/accordion
  - Example cards with preview
  - Click to load into editor
  - Difficulty indicator (beginner, intermediate, advanced)
- [ ] Create `src/components/examples/RandomGenerator.tsx`
  - Generate random valid JSONLogic rules
  - Complexity slider
  - Operator filter (include/exclude specific operators)

---

## Phase 7: Guided Rule Builder
**Estimated Time: 4-5 days**

### 7.1 Builder State Management
- [ ] Create builder state with React context or Zustand
  - Track current rule structure
  - Undo/redo support
  - Sync with JSON editor

### 7.2 Builder Components
- [ ] Create `src/components/builder/RuleBuilder.tsx`
  - Visual canvas for rule construction
  - Drop zones for operators and values
  - Nested rule support
- [ ] Create `src/components/builder/OperatorPalette.tsx`
  - Categorized operator list
  - Drag-and-drop operators
  - Search/filter operators
  - Operator documentation on hover
- [ ] Create `src/components/builder/ValueInput.tsx`
  - Type-aware input fields
  - Variable selector dropdown
  - Literal value input with type selection
- [ ] Create `src/components/builder/RuleBlock.tsx`
  - Visual representation of a rule/operator
  - Slots for arguments
  - Delete/edit controls
  - Drag handle for reordering

### 7.3 Templates
- [ ] Create `src/lib/builder/templates.ts`
  - Common rule templates
  - Template categories
  - Template metadata (name, description, variables)

---

## Phase 8: Polish & Optimization
**Estimated Time: 2-3 days**

### 8.1 Performance
- [ ] Implement debouncing for real-time updates
- [ ] Lazy load Monaco editor
- [ ] Virtualize large trees
- [ ] Memoize expensive computations

### 8.2 UX Improvements
- [ ] Keyboard shortcuts
  - `Cmd/Ctrl + Enter`: Evaluate
  - `Cmd/Ctrl + S`: Format
  - `Cmd/Ctrl + Shift + M`: Toggle Mermaid view
- [ ] Responsive design for mobile/tablet
- [ ] Loading states and skeletons
- [ ] Error boundaries

### 8.3 Persistence
- [ ] Save/load rules to localStorage
- [ ] Export/import JSON files
- [ ] Shareable URLs with encoded rules

### 8.4 Documentation
- [ ] In-app operator reference
- [ ] Tooltips and help text
- [ ] Onboarding tour for new users

---

## Milestones Summary

| Milestone | Phases | Features | Est. Time |
|-----------|--------|----------|-----------|
| **MVP** | 1-2 | Editor, Validation, Basic UI | 4-6 days |
| **Visualization** | 3-4 | Tree View, Mermaid Export | 5-7 days |
| **Testing Tools** | 5-6 | Data Generator, Examples | 5-6 days |
| **Full Feature** | 7-8 | Rule Builder, Polish | 6-8 days |

**Total Estimated Time: 20-27 days**

---

## Technical Decisions

### State Management
- Use React's built-in `useState` and `useContext` for simple state
- Consider Zustand if state complexity grows

### Styling
- Tailwind CSS for utility-first styling
- shadcn/ui for consistent component design
- CSS variables for theming

### Testing Strategy
- Unit tests for utility functions (validator, parser, generator)
- Component tests with React Testing Library
- E2E tests with Playwright for critical flows

### Bundle Optimization
- Dynamic imports for Monaco Editor
- Tree-shake unused Lucide icons
- Lazy load Mermaid renderer

---

## Dependencies to Add

```bash
# Already installed
npm install json-logic-js @monaco-editor/react lucide-react

# To be installed
npm install mermaid                    # Mermaid diagram rendering
npm install zustand                    # State management (optional)
npm install @dnd-kit/core @dnd-kit/sortable  # Drag and drop for builder
npm install nanoid                     # Unique ID generation
```

---

## File Creation Order

1. **Types first** - `types/jsonlogic.ts`, `types/tree.ts`
2. **Core utilities** - `lib/jsonlogic/*.ts`
3. **Editor components** - `components/editor/*.tsx`
4. **Main page layout** - `app/page.tsx`
5. **Tree visualization** - `lib/tree/*.ts`, `components/tree/*.tsx`
6. **Mermaid export** - `lib/mermaid/*.ts`, `components/mermaid/*.tsx`
7. **Data generator** - `lib/generator/*.ts`, `components/generator/*.tsx`
8. **Examples** - `lib/examples/*.ts`, `components/examples/*.tsx`
9. **Rule builder** - `lib/builder/*.ts`, `components/builder/*.tsx`
