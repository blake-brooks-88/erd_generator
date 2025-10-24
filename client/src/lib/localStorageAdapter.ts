// src/services/localStorageAdapter.ts
import { Project, StorageService } from './storageService';

const PROJECTS_STORAGE_KEY = 'erd-projects';
// Key for storing the ID of the most recently accessed project
const MOST_RECENT_PROJECT_ID_KEY = 'mostRecentProjectId';

export class LocalStorageAdapter implements StorageService {

  getProjectList(): Project[] {
    try {
      const data = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading projects from localStorage:", error);
      // Return empty array or potentially clear corrupted data
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
      return [];
    }
  }

  loadProject(id: string): Project | null {
    const projects = this.getProjectList();
    return projects.find(p => p.id === id) || null;
  }

  saveProject(project: Project): void {
    try {
      if (!project || typeof project.id !== 'string') {
          console.error("Attempted to save invalid project:", project);
          return;
      }
      const projects = this.getProjectList();
      const index = projects.findIndex(p => p.id === project.id);

      project.lastModified = Date.now(); // Update timestamp on save

      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.push(project);
      }

      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      // Also update the most recent project ID whenever a project is saved
      this.setMostRecentProjectId(project.id);
    } catch (error) {
      console.error("Error saving project to localStorage:", error);
      // Consider adding user feedback here (e.g., through an event or callback)
    }
  }

  deleteProject(id: string): void {
    try {
      if (typeof id !== 'string') return;
      const projects = this.getProjectList().filter(p => p.id !== id);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));

      // If the deleted project was the most recent, clear it
      const recentId = this.getMostRecentProjectId(); // Use the stored ID first
      if (recentId === id) {
        this.clearMostRecentProjectId();
        // Optionally set the new most recent immediately if needed,
        // otherwise getMostRecentProjectId will recalculate next time
        // const newRecent = this.getMostRecentProjectId(); // This will recalculate
        // if (newRecent) this.setMostRecentProjectId(newRecent);
      }
    } catch (error) {
      console.error("Error deleting project from localStorage:", error);
    }
  }

  getMostRecentProjectId(): string | null {
    try {
      // Prioritize the dedicated key
      const recentId = localStorage.getItem(MOST_RECENT_PROJECT_ID_KEY);
      if (recentId) {
        // Validate it still exists in the project list
        const projects = this.getProjectList(); // Get current list
        if (projects.some(p => p.id === recentId)) {
          return recentId;
        } else {
          // Clean up invalid ID if it doesn't exist anymore
          this.clearMostRecentProjectId();
        }
      }

      // Fallback: If no valid recent ID is stored, find the latest based on timestamp
      const projects = this.getProjectList(); // Get list again (might be empty now)
      if (projects.length === 0) return null;
      // Sort copies to avoid modifying the original order implicitly
      const sorted = [...projects].sort((a, b) => b.lastModified - a.lastModified);
      const fallbackId = sorted[0].id;
      // Store the calculated fallback ID for next time
      this.setMostRecentProjectId(fallbackId);
      return fallbackId;

    } catch (error) {
      console.error("Error getting most recent project ID:", error);
      localStorage.removeItem(MOST_RECENT_PROJECT_ID_KEY); // Clear potentially corrupted key
      return null;
    }
  }

  // Explicit method to set the most recent project ID
  setMostRecentProjectId(id: string): void {
     if (typeof id !== 'string') return;
    try {
      localStorage.setItem(MOST_RECENT_PROJECT_ID_KEY, id);
    } catch (error) {
      console.error("Error setting most recent project ID:", error);
    }
  }

  // Explicit method to clear the most recent project ID
  clearMostRecentProjectId(): void {
     try {
        localStorage.removeItem(MOST_RECENT_PROJECT_ID_KEY);
     } catch (error) {
        console.error("Error clearing most recent project ID:", error);
     }
  }

  // Method to replace all projects (for JSON import)
  replaceAllProjects(projects: Project[]): void {
    try {
      // Basic validation on the input array
      if (!Array.isArray(projects)) {
         throw new Error("Invalid data format: Expected an array of projects.");
      }
       // Ensure lastModified is set if missing (optional safety)
       const projectsWithTimestamp = projects.map(p => ({
         ...p,
         lastModified: p.lastModified || Date.now()
       }));

      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsWithTimestamp));

      // Clear the old recent ID as it might no longer be valid or relevant
      this.clearMostRecentProjectId();
      // Force recalculation and setting of the new most recent ID based on imported data
      const newRecentId = this.getMostRecentProjectId();
      if(newRecentId) {
          // getMostRecentProjectId already calls setMostRecentProjectId on fallback
          // No need to call it again here unless getMostRecentProjectId logic changes.
      } else if (projectsWithTimestamp.length > 0) {
          // If getMostRecentProjectId failed but we have projects, try setting the first one.
          this.setMostRecentProjectId(projectsWithTimestamp[0].id);
      }


    } catch (error) {
      console.error("Error replacing projects in localStorage:", error);
      // Re-throw or handle more gracefully depending on requirements
      throw error; // Re-throw to indicate failure to the caller
    }
  }
}

export const storageService = new LocalStorageAdapter();