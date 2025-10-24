import { ProjectState, ProjectAction, ActionTypes } from './types';
import { Project } from '@/lib/storageService';
import { storageService } from '@/lib/localStorageAdapter';;
import { v4 as uuidv4 } from 'uuid';

export const initialState: ProjectState = {
  projects: [],
  currentProjectId: null,
  isLoading: true,
};

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {

  const updateAndSaveCurrentProject = (updateFn: (project: Project) => Project): ProjectState => {
    if (!state.currentProjectId) return state; 

    let updatedProject: Project | undefined;
    const updatedProjects = state.projects.map(p => {
      if (p.id === state.currentProjectId) {
        updatedProject = updateFn({ ...p });
        return updatedProject;
      }
      return p;
    });

    if (updatedProject) {
      storageService.saveProject(updatedProject);
    }

    return { ...state, projects: updatedProjects };
  };


  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_PROJECTS: {
      const projects = action.payload;
      let currentProjectId = state.currentProjectId;
      if (!currentProjectId || !projects.some(p => p.id === currentProjectId)) {
        const recentId = storageService.getMostRecentProjectId();
        currentProjectId = projects.find(p => p.id === recentId)?.id || projects[0]?.id || null;
      }
      return {
        ...state,
        projects,
        currentProjectId,
        isLoading: false,
      };
    }

     case ActionTypes.LOAD_PROJECTS: {
         return state;
     }

    case ActionTypes.SELECT_PROJECT: {
      return { ...state, currentProjectId: action.payload };
    }

    case ActionTypes.CREATE_PROJECT: {
      const newProject: Project = {
        id: action.payload.id,
        name: action.payload.name,
        entities: [],
        lastModified: Date.now(),
      };
      const updatedProjects = [...state.projects, newProject];
      storageService.saveProject(newProject); 
      return {
        ...state,
        projects: updatedProjects,
        currentProjectId: newProject.id, 
      };
    }

     case ActionTypes.RENAME_PROJECT: {
        const updatedProjects = state.projects.map(p =>
            p.id === action.payload.id ? { ...p, name: action.payload.name, lastModified: Date.now() } : p
        );
        const projectToSave = updatedProjects.find(p => p.id === action.payload.id);
        if (projectToSave) {
            storageService.saveProject(projectToSave);
        }
        return { ...state, projects: updatedProjects };
     }

    case ActionTypes.DELETE_PROJECT: {
      const remainingProjects = state.projects.filter(p => p.id !== action.payload);
      storageService.deleteProject(action.payload);
      let nextProjectId: string | null = null;
      if (state.currentProjectId === action.payload) {
         const recentId = storageService.getMostRecentProjectId();
         nextProjectId = remainingProjects.find(p => p.id === recentId)?.id || remainingProjects[0]?.id || null;
      } else {
        nextProjectId = state.currentProjectId;
      }

      return {
        ...state,
        projects: remainingProjects,
        currentProjectId: nextProjectId
      };
    }

    case ActionTypes.ADD_ENTITY:
        return updateAndSaveCurrentProject(project => ({
            ...project,
            entities: [...project.entities, action.payload.entity]
        }));

    case ActionTypes.DELETE_ENTITY:
      return updateAndSaveCurrentProject(project => ({
        ...project,
        entities: project.entities.filter(e => e.id !== action.payload.entityId),
      }));

    case ActionTypes.ADD_FIELD:
      return updateAndSaveCurrentProject(project => ({
        ...project,
        entities: project.entities.map(e =>
          e.id === action.payload.entityId
            ? { ...e, fields: [...e.fields, action.payload.field] }
            : e
        ),
      }));

     case ActionTypes.UPDATE_FIELD:
         return updateAndSaveCurrentProject(project => ({
            ...project,
            entities: project.entities.map(e =>
                e.id === action.payload.entityId
                    ? {
                        ...e,
                        fields: e.fields.map(f =>
                            f.id === action.payload.fieldId ? { ...f, ...action.payload.updates } : f
                        )
                      }
                    : e
            )
         }));

    case ActionTypes.DELETE_FIELD:
      return updateAndSaveCurrentProject(project => ({
        ...project,
        entities: project.entities.map(e =>
          e.id === action.payload.entityId
            ? { ...e, fields: e.fields.filter(f => f.id !== action.payload.fieldId) }
            : e
        ),
      }));

    case ActionTypes.SET_ENTITIES:
        // FIX: Actually set the entities from the action payload!
        console.log("REDUCER: SET_ENTITIES called");
        console.log("REDUCER: Current project ID:", state.currentProjectId);
        console.log("REDUCER: New entities:", action.payload.entities);
        const result = updateAndSaveCurrentProject(project => ({
            ...project,
            entities: action.payload.entities,
            lastModified: Date.now()
        }));
        console.log("REDUCER: SET_ENTITIES completed, updated projects:", result.projects);
        return result;

    default: {
       const exhaustiveCheck: never = action;
       console.warn(`Unhandled action type: ${(exhaustiveCheck as any)?.type}`);
       return state;
    }
  }
}