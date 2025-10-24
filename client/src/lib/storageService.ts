// Interface definitions for data structures (Field, Entity, Project)
export interface Field {
  id: string;
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
  notes: string;
  fkReference?: {
    targetEntityId: string;
    targetFieldId: string;
    cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one';
  };
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

// Updated StorageService interface
export interface StorageService {
  getProjectList(): Project[];
  loadProject(id: string): Project | null;
  saveProject(project: Project): void;
  deleteProject(id: string): void;
  getMostRecentProjectId(): string | null;
  setMostRecentProjectId?(id: string): void; // Optional, as not all adapters might need it explicitly
  clearMostRecentProjectId?(): void; // Optional
  replaceAllProjects(projects: Project[]): void; // New method for import
}

