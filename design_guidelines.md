# Design Guidelines: ERD & Data Dictionary Generator

## Design Approach
**System-Based Approach**: Utility-focused productivity tool using Tailwind CSS with a custom semantic color system. Prioritizes efficiency, data clarity, and professional aesthetics over visual flair.

---

## Color System (Critical - No Deviations)

**Mandatory Custom Palette** (defined in `tailwind.config.js`):
- `primary`: #FF6F61 - Main actions, buttons, active tabs
- `secondary`: #004D40 - Headers, secondary information
- `accent`: #66DDAA - Highlights, success states
- `base`: #FFFBF5 - Application background
- `text`: #333D3A - Main body text
- `neutral`: #AAB0AF - Borders, dividers, disabled states
- `info`: #0288D1 - Informational messages
- `success`: #2E7D32 - Success messages
- `warning`: #FFC107 - Warnings
- `error`: #D32F2F - Error messages

**Forbidden**: Do not use any default Tailwind colors (e.g., `bg-blue-500`, `text-gray-900`)

---

## Layout System

**Three-Column Resizable Layout**:
- Use `react-split-pane` for panel resizing
- Left Panel (Builder): 25-35% width, form-based editor
- Center Panel (Visualizer): 40-50% width, tabbed content area
- Right Panel (Code): 20-30% width, code output
- Minimum widths: 300px per panel
- Background: `bg-base` for main application
- Panel backgrounds: `bg-white` with `border-neutral` separators

**Spacing System**:
Use Tailwind spacing units: 2, 4, 6, 8, 12, 16 for consistent padding/margins throughout

---

## Typography

**Hierarchy**:
- Main headers: text-xl font-semibold, `text-secondary`
- Section headers: text-lg font-medium, `text-text`
- Body text: text-base, `text-text`
- Helper text: text-sm, `text-neutral`
- Code output: font-mono text-sm

**Font Stack**: System font stack for performance (default Tailwind)

---

## Component Library

### Navigation & Project Management
**Top Navbar**:
- Background: `bg-secondary`
- Text: `text-base`
- Height: h-14
- Contains: App title, Projects dropdown, action buttons
- Shadow: subtle shadow-sm

**Projects Dropdown**:
- Trigger button: `bg-secondary hover:bg-secondary/90 text-base`
- Dropdown menu: `bg-white border-neutral shadow-lg`
- List items: `hover:bg-primary/10`
- Action buttons: "Create New", "Rename", "Delete" with `text-primary`

### Forms & Inputs (Builder Panel)

**Entity Section**:
- Card-based layout with `bg-white border-neutral rounded-lg`
- Padding: p-6
- Entity name input: Full width, `border-neutral focus:border-primary`
- Add Entity button: `bg-primary hover:bg-primary/80 text-white`

**Field Editor**:
- Each field row: `bg-base rounded p-4 space-y-2`
- Text inputs: `border-neutral focus:border-primary rounded`
- Dropdowns: Same styling as text inputs
- Checkboxes (PK/FK): Larger size with `accent-primary`
- Notes textarea: min-height 60px
- Delete field button: `text-error hover:bg-error/10`

**Foreign Key Relationship Dropdowns**:
- Appear below FK checkbox when checked
- Three dropdowns inline: Related Entity, Related Field, Cardinality
- Label styling: text-sm `text-neutral`
- Dropdown width: flex-1 for equal distribution

**Many-to-Many Modal**:
- Overlay: `bg-text/50` backdrop blur
- Modal card: `bg-white rounded-lg shadow-2xl` max-width 500px
- Header: `bg-secondary text-base` p-4
- Content: p-6 space-y-4
- Buttons: Primary action `bg-primary`, Cancel `bg-neutral`

### Tabs (Center Panel)

**Tab Navigation**:
- Container: `bg-white border-b border-neutral`
- Tab buttons: px-6 py-3 `text-text`
- Active tab: `border-b-2 border-primary text-primary`
- Inactive tab: `hover:bg-base`

**Live ERD Tab**:
- Full container height
- Mermaid rendering area: centered, auto-scaling
- Background: `bg-white`
- Loading state: spinner with `text-primary`

**Data Dictionary Tab**:
- Read-only HTML table
- Header row: `bg-secondary text-base` font-semibold
- Table rows: alternating `bg-white` and `bg-base`
- Cell padding: px-4 py-3
- Borders: `border-neutral`
- PK/FK indicators: badges with `bg-info text-white` (PK) and `bg-warning text-white` (FK)

### Code Panel (Right)

**Textarea**:
- Full height minus button area
- `font-mono text-sm`
- `bg-white border-neutral`
- Read-only with scroll

**Copy Button**:
- `bg-accent hover:bg-accent/80 text-white`
- Position: top-right of panel
- Icon: clipboard icon from Heroicons

### Import/Export Controls

**Button Group**:
- Positioned in navbar or as floating actions
- Import CSV: `bg-info hover:bg-info/80 text-white`
- Export CSV: `bg-success hover:bg-success/80 text-white`
- Icons: upload/download from Heroicons

### Notifications & Validation

**Toast Messages**:
- Position: top-right fixed
- Success: `bg-success text-white`
- Error: `bg-error text-white`
- Info: `bg-info text-white`
- Warning: `bg-warning text-text`
- Auto-dismiss: 4 seconds
- Close button included

**Inline Validation**:
- Error text: `text-error text-sm` below inputs
- Error border: `border-error` on invalid inputs

---

## Interactions & States

**Buttons**:
- Rounded: rounded-md
- Padding: px-4 py-2
- Transition: all 200ms
- Disabled state: `opacity-50 cursor-not-allowed`

**Forms**:
- Focus rings: `focus:ring-2 focus:ring-primary focus:ring-offset-2`
- Smooth transitions on all interactive elements

**Panel Resizing**:
- Drag handle: 4px wide, `bg-neutral hover:bg-primary`
- Cursor: col-resize

---

## Images
No images required for this application. This is a pure data/diagram tool focused on functionality.

---

## Key Design Principles

1. **Clarity First**: All data must be immediately readable
2. **Consistent Spacing**: Use 4, 8, 16px rhythm throughout
3. **Color Discipline**: Strict adherence to custom palette only
4. **Feedback**: Every action provides visual confirmation
5. **Professional Aesthetic**: Clean, modern, tool-focused design
6. **No Animations**: Keep interactions instant and direct for productivity