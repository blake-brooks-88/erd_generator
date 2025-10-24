// Extended field types to support various database column types
export type FieldType = 
  | 'string' 
  | 'text'
  | 'int' 
  | 'float' 
  | 'number' 
  | 'decimal'
  | 'boolean'
  | 'date' 
  | 'datetime' 
  | 'timestamp'
  | 'json' 
  | 'jsonb'
  | 'uuid'
  | 'enum'
  | 'phone'
  | 'email';

export interface FKReference {
  targetEntityId: string;
  targetFieldId: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one';
  relationshipLabel?: string | null | undefined; // Optional label for the relationship (e.g., "by customer_id")
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  isPK: boolean;
  isFK: boolean;
  description?: string | null | undefined; // Renamed from 'notes' - optional field description
  fkReference?: FKReference;
}

export interface Entity {
  id: string;
  name: string;
  fields: Field[];
}

export interface Project {
  id: string;
  name: string;
  entities: Entity[];
  lastModified: number;
}

// Storage Service Interface
export interface StorageService {
  saveProject(project: Project): void;
  loadProject(id: string): Project | null;
  deleteProject(id: string): void;
  getProjectList(): Project[];
  replaceAllProjects(projects: Project[]): void;
  getMostRecentProjectId(): string | null;
  setMostRecentProjectId?(id: string): void;
  clearMostRecentProjectId?(): void;
}