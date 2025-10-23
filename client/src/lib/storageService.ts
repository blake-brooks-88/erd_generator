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
    cardinality: 'one-to-one' | 'one-to-many';
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

export interface StorageService {
  getProjectList(): Project[];
  loadProject(id: string): Project | null;
  saveProject(project: Project): void;
  deleteProject(id: string): void;
  getMostRecentProjectId(): string | null;
}

export class LocalStorageAdapter implements StorageService {
  private readonly STORAGE_KEY = 'erd-projects';

  getProjectList(): Project[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  loadProject(id: string): Project | null {
    const projects = this.getProjectList();
    return projects.find(p => p.id === id) || null;
  }

  saveProject(project: Project): void {
    const projects = this.getProjectList();
    const index = projects.findIndex(p => p.id === project.id);
    
    project.lastModified = Date.now();
    
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
  }

  deleteProject(id: string): void {
    const projects = this.getProjectList().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
  }

  getMostRecentProjectId(): string | null {
    const projects = this.getProjectList();
    if (projects.length === 0) return null;
    
    const sorted = [...projects].sort((a, b) => b.lastModified - a.lastModified);
    return sorted[0].id;
  }
}

export const storageService = new LocalStorageAdapter();
