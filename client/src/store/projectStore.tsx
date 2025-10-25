import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialState, projectReducer } from './reducer'; // Assuming reducer.ts handles ADD_OR_UPDATE_PROJECT
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
      storageService.saveProject(defaultProject);
      loadedProjects = [defaultProject];
      initialProjectId = defaultProject.id;
    } else {
      initialProjectId = storageService.getMostRecentProjectId();
      // Validate the loaded recent ID
      if (!initialProjectId || !loadedProjects.some(p => p.id === initialProjectId)) {
        console.warn("Stored recent project ID not found or invalid, selecting newest.");
        const sorted = [...loadedProjects].sort((a, b) => b.lastModified - a.lastModified);
        initialProjectId = sorted.length > 0 ? sorted[0].id : null;
        if (initialProjectId) {
          storageService.setMostRecentProjectId?.(initialProjectId);
        } else {
          storageService.clearMostRecentProjectId?.();
        }
      }
    }

    // Set the loaded projects into state
    dispatch({ type: ActionTypes.SET_PROJECTS, payload: loadedProjects });
    // Select the determined initial project
    if (initialProjectId) {
      dispatch({ type: ActionTypes.SELECT_PROJECT, payload: initialProjectId });
    }
    // Mark loading as complete
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });

  }, []); // Run only once on mount

  // Derived state for the currently selected project object
  const currentProject = useMemo(() => {
    return state.projects.find(p => p.id === state.currentProjectId) || null;
  }, [state.projects, state.currentProjectId]);

  // --- Core Utility Action for Saves/Imports ---

  /**
   * Saves the project to storage, updates the project list in React state, and selects the project.
   * This is the robust solution for handling single project imports and creation.
   */
  const saveProjectAndSelect = useCallback((project: Project) => {
    storageService.saveProject(project); // 1. Update local storage (side effect)

    // 2. Dispatch the full object to the reducer to update the project list in state
    // NOTE: Requires ADD_OR_UPDATE_PROJECT action in reducer.ts
    dispatch({ type: ActionTypes.ADD_OR_UPDATE_PROJECT, payload: project });

    // 3. Dispatch selection
    dispatch({ type: ActionTypes.SELECT_PROJECT, payload: project.id });
    storageService.setMostRecentProjectId?.(project.id);
  }, [dispatch]);


  // --- Action Functions ---

  /**
   * FIX: Modified to just dispatch selection, removing the synchronous state check 
   * which caused the import bug when state was stale.
   */
  const selectProject = useCallback((id: string) => {
    // We trust that calling functions (like saveProjectAndSelect) ensure the ID exists.
    dispatch({ type: ActionTypes.SELECT_PROJECT, payload: id });
    storageService.setMostRecentProjectId?.(id);
  }, [dispatch]); // Removed state.projects dependency

  /**
   * Corrected to use the new saveProjectAndSelect utility.
   */
  const createProject = useCallback((name: string): Project => {
    const newProject: Project = {
      id: uuidv4(),
      name: name.trim() || 'Untitled Project',
      entities: [],
      lastModified: Date.now()
    };
    saveProjectAndSelect(newProject); // Saves to storage, updates state, and selects
    return newProject;
  }, [saveProjectAndSelect]);

  const renameProject = useCallback((id: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: 'Rename Failed', description: 'Project name cannot be empty.', variant: 'destructive' });
      return;
    }
    dispatch({ type: ActionTypes.RENAME_PROJECT, payload: { id, name: trimmedName } });
  }, [toast]);

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: ActionTypes.DELETE_PROJECT, payload: id });
  }, []);

  const checkCurrentProject = useCallback(() => {
    if (!state.currentProjectId) {
      console.error("No project selected for this action.");
      toast({ title: 'Action Failed', description: 'No project is currently selected.', variant: 'destructive' });
      return null;
    }
    return state.currentProjectId;
  }, [state.currentProjectId, toast]);

  const addEntity = useCallback((entity: Entity) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;

    if (!entity.name || !entity.name.trim()) {
      toast({ title: 'Add Entity Failed', description: 'Entity name cannot be empty.', variant: 'destructive' });
      return;
    }

    const project = state.projects.find(p => p.id === projectId);
    if (project && project.entities.some(e => e.name.toLowerCase() === entity.name.trim().toLowerCase() && e.id !== entity.id)) {
      console.error("Duplicate entity name detected before dispatch");
      toast({ title: 'Duplicate Entity Name', description: `An entity named "${entity.name.trim()}" already exists.`, variant: 'destructive' });
      return;
    }

    const cleanedEntity = { ...entity, name: entity.name.trim() };
    dispatch({ type: ActionTypes.ADD_ENTITY, payload: { projectId, entity: cleanedEntity } });
  }, [checkCurrentProject, state.projects, toast]);

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
    if (entity && entity.fields.some(f => f.name.toLowerCase() === trimmedFieldName.toLowerCase())) {
      console.error("Duplicate field name detected before dispatch");
      toast({ title: 'Duplicate Field Name', description: `A field named "${trimmedFieldName}" already exists in "${entity.name}".`, variant: 'destructive' });
      return;
    }

    const newField: Field = { ...fieldData, name: trimmedFieldName, id: uuidv4() };
    dispatch({ type: ActionTypes.ADD_FIELD, payload: { projectId, entityId, field: newField } });
  }, [checkCurrentProject, state.projects, toast]);

  const updateField = useCallback((entityId: string, fieldId: string, updates: Partial<Field>) => {
    const projectId = checkCurrentProject();
    if (!projectId) return;
    if (updates.name !== undefined && !updates.name.trim()) {
      toast({ title: 'Update Field Failed', description: 'Field name cannot be empty.', variant: 'destructive' });
      return;
    }
    dispatch({ type: ActionTypes.UPDATE_FIELD, payload: { projectId, entityId, fieldId, updates } });
  }, [checkCurrentProject, toast]);

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
    saveProjectAndSelect, // <-- EXPOSED NEW ACTION
    dispatch,
  }), [
    state,
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
    saveProjectAndSelect, // <-- ADDED DEPENDENCY
    dispatch
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};