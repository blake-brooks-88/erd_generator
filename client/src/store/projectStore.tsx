import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialState, projectReducer } from './reducer';
import { ProjectState, ProjectAction, ActionTypes, ProjectContextType } from './types';
import { Project, Entity, Field } from '@/lib/storageService';
import { storageService } from '@/lib/localStorageAdapter';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  useEffect(() => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    let loadedProjects = storageService.getProjectList();

    if (loadedProjects.length === 0) {
      const defaultProject: Project = {
        id: uuidv4(),
        name: 'Untitled Project',
        entities: [],
        lastModified: Date.now(),
      };
      storageService.saveProject(defaultProject);
      loadedProjects = [defaultProject]; 
    }

    dispatch({ type: ActionTypes.SET_PROJECTS, payload: loadedProjects });

  }, []);

  const currentProject = useMemo(() => {
    return state.projects.find(p => p.id === state.currentProjectId) || null;
  }, [state.projects, state.currentProjectId]);

  const selectProject = useCallback((id: string) => {
     if (state.projects.some(p => p.id === id)) {
        dispatch({ type: ActionTypes.SELECT_PROJECT, payload: id });
     } else {
        console.error(`Project with ID ${id} not found.`);
     }
  }, [state.projects]);

  const createProject = useCallback((name: string): Project => {
    const newProject: Project = {
        id: uuidv4(),
        name: name.trim(),
        entities: [],
        lastModified: Date.now() 
    };
    dispatch({ type: ActionTypes.CREATE_PROJECT, payload: { id: newProject.id, name: newProject.name } });

    console.log("Dispatched CREATE_PROJECT for:", newProject.id);
    return newProject;
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    dispatch({ type: ActionTypes.RENAME_PROJECT, payload: { id, name } });
  }, []);

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: ActionTypes.DELETE_PROJECT, payload: id });
  }, []);

  const checkCurrentProject = useCallback(() => {
      if (!state.currentProjectId) {
          console.error("No project selected for this action.");
          return null;
      }
      return state.currentProjectId;
  }, [state.currentProjectId]);

  const addEntity = useCallback((name: string) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;

    const project = state.projects.find(p => p.id === projectId);
    if (project && project.entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
        console.error("Duplicate entity name");
        return;
    }

    const newEntity: Entity = { id: uuidv4(), name, fields: [] };
    dispatch({ type: ActionTypes.ADD_ENTITY, payload: { projectId, entity: newEntity } });
  }, [checkCurrentProject, state.projects]);

  const deleteEntity = useCallback((entityId: string) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    dispatch({ type: ActionTypes.DELETE_ENTITY, payload: { projectId, entityId } });
  }, [checkCurrentProject]);

  const addField = useCallback((entityId: string, fieldData: Omit<Field, 'id'>) => {
      const projectId = checkCurrentProject();
      if (!projectId) return;

      const project = state.projects.find(p => p.id === projectId);
      const entity = project?.entities.find(e => e.id === entityId);
       if (entity && entity.fields.some(f => f.name.toLowerCase() === fieldData.name.toLowerCase())) {
            console.error("Duplicate field name in this entity");
            return;
       }

      const newField: Field = { ...fieldData, id: uuidv4() };
      dispatch({ type: ActionTypes.ADD_FIELD, payload: { projectId, entityId, field: newField } });
    }, [checkCurrentProject, state.projects]);

   const updateField = useCallback((entityId: string, fieldId: string, updates: Partial<Field>) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    dispatch({ type: ActionTypes.UPDATE_FIELD, payload: { projectId, entityId, fieldId, updates } });
   }, [checkCurrentProject]);

  const deleteField = useCallback((entityId: string, fieldId: string) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    dispatch({ type: ActionTypes.DELETE_FIELD, payload: { projectId, entityId, fieldId } });
  }, [checkCurrentProject]);

  const setEntities = useCallback((entities: Entity[]) => {
      const projectId = checkCurrentProject();
      if (!projectId) return;
      dispatch({ type: ActionTypes.SET_ENTITIES, payload: { projectId, entities } });
  }, [checkCurrentProject]);

  const value = useMemo(() => ({
    ...state,
    currentProject,
    selectProject,
    createProject,
    renameProject,
    deleteProject,
    addEntity,
    deleteEntity,
    addField,
    updateField,
    deleteField,
    setEntities,
  }), [state, currentProject, selectProject, createProject, renameProject, deleteProject, addEntity, deleteEntity, addField, updateField, deleteField, setEntities]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

