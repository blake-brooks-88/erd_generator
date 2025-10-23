# ERD & Data Dictionary Generator

## Overview

A React-based web application for creating and managing Entity-Relationship Diagrams (ERDs) across multiple projects. The tool generates Mermaid syntax diagrams in real-time, providing both visual ERD representation and comprehensive data dictionary views. Features include CSV import/export, local storage persistence, and a three-panel resizable workspace optimized for database schema design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server with hot module replacement
- Wouter for lightweight client-side routing (minimal bundle size compared to React Router)

**State Management Pattern**
- Local component state using React hooks (`useState`, `useReducer`)
- Context API avoided in favor of prop drilling for explicit data flow
- All schema data managed in a centralized state within the Home component
- Real-time synchronization: state changes trigger immediate updates across all panels

**UI Component Library**
- Radix UI primitives for accessible, unstyled components (dialogs, dropdowns, tabs, etc.)
- Shadcn/ui component patterns with custom Tailwind styling
- Custom semantic color system (no default Tailwind colors allowed)

**Layout System**
- Three-column resizable layout using `react-resizable-panels`
- Left Panel: Entity builder with form controls (25-35% width)
- Center Panel: Tabbed visualizer for ERD/Data Dictionary (40-50% width)
- Right Panel: Mermaid code output with copy functionality (20-30% width)
- Minimum panel width: 300px per panel

**Styling Approach**
- Tailwind CSS with mandatory custom semantic palette defined in `tailwind.config.ts`
- System-based design prioritizing utility and data clarity over visual flair
- Custom colors: primary (#FF6F61), secondary (#004D40), accent (#66DDAA), base (#FFFBF5), text (#333D3A), neutral (#AAB0AF)
- Additional semantic colors for states: info, success, warning, error
- Forbidden: Any default Tailwind colors (e.g., `bg-blue-500`, `text-gray-900`)

### Data Storage & Persistence

**Storage Interface**
- `LocalStorageAdapter` implements `IStorage` interface for browser-based persistence
- Project-based organization with entities grouped under project IDs
- Schema structure: Projects contain entities, entities contain fields
- Fields support: name, type, primary key (PK), foreign key (FK), notes, and FK references with cardinality

**Data Model**
```typescript
Project → Entity[] → Field[]
Field includes: id, name, type, isPK, isFK, notes, fkReference
FkReference includes: targetEntityId, targetFieldId, cardinality
```

**Cardinality Support**
- One-to-one relationships
- One-to-many relationships
- Many-to-one relationships
- Visual representation in Mermaid diagram syntax

### Code Generation

**Mermaid ERD Generator**
- Converts in-memory schema to Mermaid ERD syntax
- Real-time generation on every state change
- Handles entity definitions with typed fields
- Automatic relationship inference from foreign key references
- Relationship deduplication to prevent reverse duplicates

**Output Format**
- Mermaid `erDiagram` syntax
- Field annotations: PK (Primary Key), FK (Foreign Key)
- Relationship notation: `||--||` (one-to-one), `}o--||` (many-to-one)

### Backend Architecture

**Server Framework**
- Express.js HTTP server with TypeScript
- Vite middleware integration for development mode HMR
- Minimal backend footprint (storage interface placeholder for future database integration)

**Database Configuration**
- Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`)
- Schema defined in `shared/schema.ts` (currently minimal user table)
- Migration support via `drizzle-kit`
- Note: Current implementation uses in-memory/localStorage; database integration is prepared but not actively used

**Session Management**
- Configuration present for `connect-pg-simple` session store
- Not actively utilized in current localStorage-based approach

### Build & Deployment

**Development Mode**
- `npm run dev`: Runs Express server with Vite middleware
- Hot module replacement for client-side code
- TypeScript checking via `npm run check`

**Production Build**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.js`
- Single-output directory deployment model

**Type Safety**
- Shared types between client/server via `@shared` path alias
- Strict TypeScript configuration with no implicit any
- Path aliases: `@/` (client src), `@shared/` (shared types), `@assets/` (assets)

## External Dependencies

**UI & Visualization**
- `mermaid`: ERD diagram rendering engine
- `@radix-ui/*`: Headless accessible UI primitives (13+ packages for various components)
- `react-resizable-panels`: Resizable panel layout system
- `cmdk`: Command menu component
- `lucide-react`: Icon library

**Forms & Validation**
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Form validation integration
- `zod`: Schema validation
- `drizzle-zod`: Database schema to Zod converter

**Data Processing**
- `papaparse`: CSV parsing for import/export functionality
- `uuid`: Unique identifier generation
- `date-fns`: Date formatting utilities

**State Management**
- `@tanstack/react-query`: Server state management (configured but minimal usage)
- `class-variance-authority`: Component variant management
- `clsx` + `tailwind-merge`: Conditional className utilities

**Database (Prepared)**
- `drizzle-orm`: TypeScript ORM
- `@neondatabase/serverless`: PostgreSQL driver for serverless environments
- `connect-pg-simple`: PostgreSQL session store

**Development Tools**
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Replit-specific navigation
- `@replit/vite-plugin-dev-banner`: Development environment indicator

**Styling**
- `tailwindcss`: Utility-first CSS framework
- `autoprefixer`: CSS vendor prefixing
- `tailwind-merge`: Tailwind class merging utility