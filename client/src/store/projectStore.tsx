import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialState, projectReducer } from './reducer';
import { ProjectState, ProjectAction, ActionTypes, ProjectContextType } from './types';
import { Project, Entity, Field } from '@/lib/storageService';
import { storageService } from '@/lib/localStorageAdapter';
import { useToast } from '@/hooks/use-toast';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { toast } = useToast();

  useEffect(() => {
    // Initial load logic
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    let loadedProjects = storageService.getProjectList();
    let initialProjectId: string | null = null;

    if (loadedProjects.length === 0) {
      const defaultProject: Project = {
        id: uuidv4(),
        name: 'Untitled Project',
        entities: [],
        lastModified: Date.now(),
      };
      storageService.saveProject(defaultProject); // saveProject now handles setting recent ID
      loadedProjects = [defaultProject];
      initialProjectId = defaultProject.id;
    } else {
        initialProjectId = storageService.getMostRecentProjectId();
         // Validate the loaded recent ID
         if (!initialProjectId || !loadedProjects.some(p => p.id === initialProjectId)) {
             console.warn("Stored recent project ID not found or invalid, selecting newest.");
             // Fallback to the truly most recent based on the data if stored one is bad
             const sorted = [...loadedProjects].sort((a, b) => b.lastModified - a.lastModified);
             initialProjectId = sorted.length > 0 ? sorted[0].id : null;
             if(initialProjectId) {
                 storageService.setMostRecentProjectId?.(initialProjectId); // Update storage if we had to calculate
             } else {
                 storageService.clearMostRecentProjectId?.(); // Clear if no projects exist
             }
         }
    }

    // Set the loaded projects into state
    dispatch({ type: ActionTypes.SET_PROJECTS, payload: loadedProjects });
    // Select the determined initial project
    if(initialProjectId) {
        dispatch({ type: ActionTypes.SELECT_PROJECT, payload: initialProjectId });
    }
     // Mark loading as complete
     dispatch({ type: ActionTypes.SET_LOADING, payload: false });

  }, []); // Run only once on mount

  // Derived state for the currently selected project object
  const currentProject = useMemo(() => {
    return state.projects.find(p => p.id === state.currentProjectId) || null;
  }, [state.projects, state.currentProjectId]);

  // --- Action Functions ---

  const selectProject = useCallback((id: string) => {
     if (state.projects.some(p => p.id === id)) {
        dispatch({ type: ActionTypes.SELECT_PROJECT, payload: id });
        storageService.setMostRecentProjectId?.(id); // Update storage on explicit select
     } else {
        console.error(`Project with ID ${id} not found for selection.`);
        toast({ title: 'Error', description: 'Could not select the project.', variant: 'destructive'});
     }
  }, [state.projects, toast]); // Added toast dependency

  const createProject = useCallback((name: string): Project => {
    const newProject: Project = {
        id: uuidv4(),
        name: name.trim() || 'Untitled Project', // Ensure name isn't empty
        entities: [],
        lastModified: Date.now()
    };
    // Dispatch only minimal info needed by reducer
    dispatch({ type: ActionTypes.CREATE_PROJECT, payload: { id: newProject.id, name: newProject.name } });
    return newProject; // Return the full object for immediate use if needed
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
     const trimmedName = name.trim();
     if (!trimmedName) {
         toast({ title: 'Rename Failed', description: 'Project name cannot be empty.', variant: 'destructive'});
         return;
     }
    dispatch({ type: ActionTypes.RENAME_PROJECT, payload: { id, name: trimmedName } });
  }, [toast]); // Added toast dependency

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: ActionTypes.DELETE_PROJECT, payload: id });
  }, []);

  const checkCurrentProject = useCallback(() => {
      if (!state.currentProjectId) {
          console.error("No project selected for this action.");
          toast({ title: 'Action Failed', description: 'No project is currently selected.', variant: 'destructive'});
          return null;
      }
      return state.currentProjectId;
  }, [state.currentProjectId, toast]); // Added toast dependency

  const addEntity = useCallback((entity: Entity) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;

    if (!entity.name || !entity.name.trim()) {
        toast({ title: 'Add Entity Failed', description: 'Entity name cannot be empty.', variant: 'destructive' });
        return;
    }

    const project = state.projects.find(p => p.id === projectId);
    // Check for duplicates before dispatching
    if (project && project.entities.some(e => e.name.toLowerCase() === entity.name.trim().toLowerCase() && e.id !== entity.id)) {
        console.error("Duplicate entity name detected before dispatch");
         toast({ title: 'Duplicate Entity Name', description: `An entity named "${entity.name.trim()}" already exists.`, variant: 'destructive' });
        return;
    }

    // Ensure the entity object passed to reducer is clean
    const cleanedEntity = { ...entity, name: entity.name.trim() };
    dispatch({ type: ActionTypes.ADD_ENTITY, payload: { projectId, entity: cleanedEntity } });
  }, [checkCurrentProject, state.projects, toast]); // Added toast dependency

  const deleteEntity = useCallback((entityId: string) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    dispatch({ type: ActionTypes.DELETE_ENTITY, payload: { projectId, entityId } });
  }, [checkCurrentProject]);

  const addField = useCallback((entityId: string, fieldData: Omit<Field, 'id'>) => {
      const projectId = checkCurrentProject();
      if (!projectId) return;
       const trimmedFieldName = fieldData.name.trim();
       if (!trimmedFieldName) {
           toast({ title: 'Add Field Failed', description: 'Field name cannot be empty.', variant: 'destructive' });
           return;
       }

      const project = state.projects.find(p => p.id === projectId);
      const entity = project?.entities.find(e => e.id === entityId);
       // Check for duplicates before dispatching
       if (entity && entity.fields.some(f => f.name.toLowerCase() === trimmedFieldName.toLowerCase())) {
            console.error("Duplicate field name detected before dispatch");
             toast({ title: 'Duplicate Field Name', description: `A field named "${trimmedFieldName}" already exists in "${entity.name}".`, variant: 'destructive' });
            return;
       }

      const newField: Field = { ...fieldData, name: trimmedFieldName, id: uuidv4() };
      dispatch({ type: ActionTypes.ADD_FIELD, payload: { projectId, entityId, field: newField } });
    }, [checkCurrentProject, state.projects, toast]); // Added toast dependency

   const updateField = useCallback((entityId: string, fieldId: string, updates: Partial<Field>) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    // Basic validation on updates if needed (e.g., ensure name isn't empty if provided)
    if (updates.name !== undefined && !updates.name.trim()) {
        toast({ title: 'Update Field Failed', description: 'Field name cannot be empty.', variant: 'destructive'});
        return;
    }
    dispatch({ type: ActionTypes.UPDATE_FIELD, payload: { projectId, entityId, fieldId, updates } });
   }, [checkCurrentProject, toast]); // Added toast dependency

  const deleteField = useCallback((entityId: string, fieldId: string) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    dispatch({ type: ActionTypes.DELETE_FIELD, payload: { projectId, entityId, fieldId } });
  }, [checkCurrentProject]);

  const setEntities = useCallback((entities: Entity[]) => {
      const projectId = checkCurrentProject();
      if (!projectId) return;
      // Consider adding validation for the entities array structure here
      dispatch({ type: ActionTypes.SET_ENTITIES, payload: { projectId, entities } });
  }, [checkCurrentProject]);

  // Include dispatch in the context value
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
    dispatch, // Pass dispatch down
  }), [state, currentProject, selectProject, createProject, renameProject, deleteProject, addEntity, deleteEntity, addField, updateField, deleteField, setEntities, dispatch]); // Added dispatch

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

