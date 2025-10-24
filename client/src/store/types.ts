import type { Project, Entity, Field } from "@/lib/storageService";

export type ProjectState = {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
};

export const ActionTypes = {
  LOAD_PROJECTS: 'LOAD_PROJECTS',
  SET_PROJECTS: 'SET_PROJECTS',
  SELECT_PROJECT: 'SELECT_PROJECT',
  CREATE_PROJECT: 'CREATE_PROJECT',
  RENAME_PROJECT: 'RENAME_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  ADD_ENTITY: 'ADD_ENTITY',
  DELETE_ENTITY: 'DELETE_ENTITY',
  ADD_FIELD: 'ADD_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  DELETE_FIELD: 'DELETE_FIELD',
  SET_ENTITIES: 'SET_ENTITIES',
  SET_LOADING: 'SET_LOADING',
} as const;

export type ProjectAction =
  | { type: typeof ActionTypes.SET_LOADING; payload: boolean }
  | { type: typeof ActionTypes.LOAD_PROJECTS }
  | { type: typeof ActionTypes.SET_PROJECTS; payload: Project[] }
  | { type: typeof ActionTypes.SELECT_PROJECT; payload: string }
  | { type: typeof ActionTypes.CREATE_PROJECT; payload: { id: string; name: string } }
  | { type: typeof ActionTypes.RENAME_PROJECT; payload: { id: string; name: string } }
  | { type: typeof ActionTypes.DELETE_PROJECT; payload: string }
  | { type: typeof ActionTypes.ADD_ENTITY; payload: { projectId: string; entity: Entity } }
  | { type: typeof ActionTypes.DELETE_ENTITY; payload: { projectId: string; entityId: string } }
  | { type: typeof ActionTypes.ADD_FIELD; payload: { projectId: string; entityId: string; field: Field } }
  | { type: typeof ActionTypes.UPDATE_FIELD; payload: { projectId: string; entityId: string; fieldId: string; updates: Partial<Field> } }
  | { type: typeof ActionTypes.DELETE_FIELD; payload: { projectId: string; entityId: string; fieldId: string } }
  | { type: typeof ActionTypes.SET_ENTITIES; payload: { projectId: string; entities: Entity[] } };

export type ProjectContextType = ProjectState & {
  currentProject: Project | null;
  selectProject: (id: string) => void;
  createProject: (name: string) => Project;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  addEntity: (name: string) => void;
  deleteEntity: (id: string) => void;
  addField: (entityId: string, fieldData: Omit<Field, 'id'>) => void;
  updateField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  deleteField: (entityId: string, fieldId: string) => void;
  setEntities: (entities: Entity[]) => void;
};

