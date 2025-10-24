import { Project, Entity, Field } from '@/lib/storageService'; 

export enum ActionTypes { 
  SET_LOADING = 'SET_LOADING',
  LOAD_PROJECTS = 'LOAD_PROJECTS',
  SET_PROJECTS = 'SET_PROJECTS',
  SELECT_PROJECT = 'SELECT_PROJECT',
  CREATE_PROJECT = 'CREATE_PROJECT',
  RENAME_PROJECT = 'RENAME_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  ADD_ENTITY = 'ADD_ENTITY',
  DELETE_ENTITY = 'DELETE_ENTITY',
  ADD_FIELD = 'ADD_FIELD',
  UPDATE_FIELD = 'UPDATE_FIELD',
  DELETE_FIELD = 'DELETE_FIELD',
  SET_ENTITIES = 'SET_ENTITIES',
}

export type ProjectAction =
  | { type: ActionTypes.SET_LOADING; payload: boolean }
  | { type: ActionTypes.LOAD_PROJECTS } 
  | { type: ActionTypes.SET_PROJECTS; payload: Project[] }
  | { type: ActionTypes.SELECT_PROJECT; payload: string | null } 
  | { type: ActionTypes.CREATE_PROJECT; payload: { id: string; name: string } }
  | { type: ActionTypes.RENAME_PROJECT; payload: { id: string; name: string } }
  | { type: ActionTypes.DELETE_PROJECT; payload: string }
  | { type: ActionTypes.ADD_ENTITY; payload: { projectId: string; entity: Entity } }
  | { type: ActionTypes.DELETE_ENTITY; payload: { projectId: string; entityId: string } }
  | { type: ActionTypes.ADD_FIELD; payload: { projectId: string; entityId: string; field: Field } }
  | { type: ActionTypes.UPDATE_FIELD; payload: { projectId: string; entityId: string; fieldId: string; updates: Partial<Field> } }
  | { type: ActionTypes.DELETE_FIELD; payload: { projectId: string; entityId: string; fieldId: string } }
  | { type: ActionTypes.SET_ENTITIES; payload: { projectId: string; entities: Entity[] } };

export interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
}

export interface ProjectContextType extends ProjectState {
  currentProject: Project | null;
  selectProject: (id: string) => void;
  createProject: (name: string) => Project;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  addEntity: (entity: Entity) => void; 
  deleteEntity: (entityId: string) => void;
  addField: (entityId: string, fieldData: Omit<Field, 'id'>) => void;
  updateField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  deleteField: (entityId: string, fieldId: string) => void;
  setEntities: (entities: Entity[]) => void;
  dispatch: React.Dispatch<ProjectAction>;
}

