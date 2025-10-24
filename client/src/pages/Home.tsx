import { useState, useEffect, useRef, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '@/components/Navbar';
import EntityBuilder from '@/components/EntityBuilder';
import Visualizer from '@/components/Visualizer';
import CodePanel from '@/components/CodePanel';
import { Entity, Field, Project } from '@/lib/storageService'; // Use types
import { storageService } from '@/lib/localStorageAdapter'; // Use instance
import { generateMermaidCode } from '@/lib/mermaidGenerator';
import { useToast } from '@/hooks/use-toast';
import { useProjectContext } from '@/store/projectStore'; // Correct import
import { ActionTypes } from '@/store/types'; // Import ActionTypes for dispatch

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Papa from 'papaparse';

// Basic validation function for imported JSON
function isValidProjectArray(data: any): data is Project[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      // Check lastModified loosely, might not always be present pre-save
      (typeof item.lastModified === 'number' || typeof item.lastModified === 'undefined') &&
      Array.isArray(item.entities) &&
      // Basic check on entities array structure
      item.entities.every((ent: any) =>
        typeof ent === 'object' &&
        ent !== null &&
        typeof ent.id === 'string' &&
        typeof ent.name === 'string' &&
        Array.isArray(ent.fields) &&
        // Basic check on fields array structure
        ent.fields.every((field: any) =>
             typeof field === 'object' &&
             field !== null &&
             typeof field.id === 'string' &&
             typeof field.name === 'string' &&
             typeof field.type === 'string' // Add more specific field type/prop checks if needed
             // Example: && typeof field.isPK === 'boolean'
        )
      )
  );
}


export default function Home() {
  const {
    currentProject,
    projects,
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
    isLoading,
    currentProjectId,
    dispatch, // Need dispatch for SET_PROJECTS after JSON import
  } = useProjectContext();

  // Local UI state
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [manyToManyDialogOpen, setManyToManyDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameProjectName, setRenameProjectName] = useState('');
  const [manyToManySourceId, setManyToManySourceId] = useState<string | null>(null);
  const [manyToManyTargetId, setManyToManyTargetId] = useState('');
  const [manyToManyJoinTable, setManyToManyJoinTable] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null); // Combined ref for both imports
  const { toast } = useToast();

  // State for JSON import confirmation
  const [importJsonDialogOpen, setImportJsonDialogOpen] = useState(false);
  const [jsonDataToImport, setJsonDataToImport] = useState<Project[] | null>(null);


  useEffect(() => {
    // Reset selected entity when project changes
    setSelectedEntityId(null);
  }, [currentProjectId]); // Depend on currentProjectId

  // --- Handlers ---

  const handleCreateProject = () => {
    setNewProjectName('');
    setCreateDialogOpen(true);
  };

  const confirmCreateProject = () => {
    if (newProjectName.trim()) {
      try {
        const created = createProject(newProjectName.trim());
        toast({ title: `Project "${created.name}" created successfully` });
        setCreateDialogOpen(false);
        setNewProjectName('');
        // No need to manually select, reducer handles setting currentProjectId
      } catch (error) {
        console.error("Failed to create project:", error);
        toast({ title: 'Failed to create project', description: `${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
      }
    } else {
         toast({ title: 'Project name cannot be empty', variant: 'destructive' });
    }
  };

  const handleRenameProject = () => {
    if (!currentProject) return;
    setRenameProjectName(currentProject.name);
    setRenameDialogOpen(true);
  };

  const confirmRenameProject = () => {
    if (!currentProject) return;
    const trimmedName = renameProjectName.trim();
    if (trimmedName && trimmedName !== currentProject.name) {
      renameProject(currentProject.id, trimmedName);
      toast({ title: 'Project renamed successfully' });
      setRenameDialogOpen(false);
      setRenameProjectName('');
    } else if (!trimmedName) {
      toast({ title: 'Project name cannot be empty', variant: 'destructive' });
    } else {
       // Name is unchanged or whitespace only, just close dialog
       setRenameDialogOpen(false);
    }
  };

  const handleDeleteProject = () => {
     if (!currentProject) {
         toast({ title: 'Cannot Delete', description: 'No project selected.', variant: 'destructive'});
         return;
     }
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!currentProject) return;
    deleteProject(currentProject.id);
    setDeleteDialogOpen(false);
    toast({ title: 'Project deleted successfully', variant: 'destructive' });
    // Reducer handles selecting the next project
  };

  const handleSelectProject = (id: string) => {
    selectProject(id); // Context action handles state and storage update
  };

  // --- MODIFIED handleAddEntityWithToast ---
  const handleAddEntityWithToast = (name: string) => {
    if (!currentProject) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
        toast({ title: 'Entity name cannot be empty', variant: 'destructive'});
        return;
    }
    // Context hook's addEntity already performs duplicate check and shows toast if needed
    const newEntity: Entity = { id: uuidv4(), name: trimmedName, fields: [] };
    addEntity(newEntity); // Pass the full entity object
    toast({ title: 'Entity added successfully' }); // Show success toast from UI side
  };
  // --- END MODIFICATION ---

  const handleDeleteEntityWithToast = (id: string) => {
    deleteEntity(id); // Use the correct action function
    if (selectedEntityId === id) {
      setSelectedEntityId(null); // Deselect if the deleted one was selected
    }
    toast({ title: 'Entity deleted successfully' });
  };

  const handleAddFieldWithToast = (entityId: string, fieldData: Omit<Field, 'id'>) => {
    if (!currentProject) return;
    const entity = currentProject.entities.find(e => e.id === entityId);
    if (!entity) return;
    const trimmedFieldName = fieldData.name.trim();
     if (!trimmedFieldName) {
        toast({ title: 'Field name cannot be empty', variant: 'destructive'});
        return;
    }
    // Context hook's addField already performs duplicate check and shows toast if needed
    addField(entityId, { ...fieldData, name: trimmedFieldName });
    toast({ title: 'Field added successfully' }); // Show success toast from UI side
  };

  const handleDeleteFieldWithToast = (entityId: string, fieldId: string) => {
    deleteField(entityId, fieldId); // Use the correct action function
    toast({ title: 'Field deleted successfully' });
  };

  const handleOpenManyToManyDialog = (entityId: string) => {
    if (!currentProject) return;
    const sourceEntity = currentProject.entities.find(e => e.id === entityId);
    if (!sourceEntity) return;

    setManyToManySourceId(entityId);
    setManyToManyTargetId('');
    // Auto-generate initial join table name, user can edit
    setManyToManyJoinTable(''); // Start empty or try `${sourceEntity.name}_...` later

    setManyToManyDialogOpen(true);
  };

  const confirmManyToMany = () => {
    if (!currentProject || !manyToManySourceId || !manyToManyTargetId || !manyToManyJoinTable.trim()) {
      return;
    }
     const sourceEntity = currentProject.entities.find(e => e.id === manyToManySourceId);
     const targetEntity = currentProject.entities.find(e => e.id === manyToManyTargetId);

     if (!sourceEntity || !targetEntity) {
        toast({ title: 'Error', description: 'Could not find source or target entity.', variant: 'destructive'});
        return;
     }

     const sourcePK = sourceEntity.fields.find(f => f.isPK);
     const targetPK = targetEntity.fields.find(f => f.isPK);

     if (!sourcePK || !targetPK) {
       toast({
         title: 'Missing Primary Keys',
         description: 'Both related entities must have primary keys defined before creating a join table.',
         variant: 'destructive',
       });
       return;
     }

     const joinTableName = manyToManyJoinTable.trim();
     // Check against existing entities (case-insensitive)
     if (currentProject.entities.some(e => e.name.toLowerCase() === joinTableName.toLowerCase())) {
       toast({
         title: 'Duplicate Entity Name',
         description: 'An entity with the specified join table name already exists.',
         variant: 'destructive',
       });
       return;
     }

    const joinTable: Entity = {
      id: uuidv4(),
      name: joinTableName,
      fields: [
        {
          id: uuidv4(),
          name: `${sourceEntity.name.toLowerCase()}_${sourcePK.name}`, // Include PK name
          type: sourcePK.type,
          isPK: true,
          isFK: true,
          notes: `References ${sourceEntity.name}(${sourcePK.name})`,
          fkReference: {
            targetEntityId: manyToManySourceId,
            targetFieldId: sourcePK.id,
            cardinality: 'many-to-one',
          },
        },
        {
          id: uuidv4(),
          name: `${targetEntity.name.toLowerCase()}_${targetPK.name}`, // Include PK name
          type: targetPK.type,
          isPK: true,
          isFK: true,
          notes: `References ${targetEntity.name}(${targetPK.name})`,
          fkReference: {
            targetEntityId: manyToManyTargetId,
            targetFieldId: targetPK.id,
            cardinality: 'many-to-one',
          },
        },
      ],
    };

    addEntity(joinTable); // Use the context action

    toast({ title: 'Many-to-Many relationship created successfully' });
    setManyToManyDialogOpen(false);
    setManyToManySourceId(null);
    setManyToManyTargetId('');
    setManyToManyJoinTable('');
  };

  // Trigger for both CSV and JSON import
  const handleImport = () => {
    if (!fileInputRef.current) return;
    // Reset file input value to allow re-uploading the same file
    fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  // Handles reading and processing the selected file (CSV or JSON)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        if (!fileContent) {
            toast({ title: 'Import Failed', description: 'Could not read file content.', variant: 'destructive' });
            return;
        }

        try {
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                const parsedData = JSON.parse(fileContent);
                if (!isValidProjectArray(parsedData)) {
                     toast({ title: 'Invalid JSON', description: 'The JSON file does not contain a valid project array structure. Check console for details.', variant: 'destructive' });
                     console.error("Invalid JSON structure:", parsedData);
                     return;
                }
                setJsonDataToImport(parsedData);
                setImportJsonDialogOpen(true); // Open confirmation dialog

            } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                 if (!currentProject) {
                     toast({ title: 'Import Failed', description: 'Cannot import CSV without an active project selected.', variant: 'destructive' });
                     return;
                 }
                 // --- Process CSV ---
                Papa.parse<Record<string, string>>(fileContent, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (results) => {
                    const newEntitiesMap: Map<string, Entity> = new Map();
                    // Use currentProject entities from context directly
                    const existingEntitiesLower = currentProject.entities.map(e => e.name.toLowerCase());

                    results.data.forEach((row, index) => {
                       const entityName = row.Entity?.trim();
                       const fieldName = row.Field?.trim();
                       if (!entityName || !fieldName) {
                           console.warn(`Skipping row ${index + 2} due to missing Entity or Field name.`);
                           return; // Skip row if essential info missing
                       }

                       const alreadyExists = existingEntitiesLower.includes(entityName.toLowerCase());
                       // Completely skip entities that already exist in the project
                       if (alreadyExists) {
                           if (!newEntitiesMap.has(entityName)) { // Show warning only once per existing entity
                             console.warn(`Skipping entity "${entityName}" during CSV import as it already exists.`);
                           }
                           newEntitiesMap.set(entityName, { id: 'SKIPPED', name: entityName, fields: [] }); // Mark as skipped
                           return;
                       }
                       // Skip duplicate field within the *same* new entity being built from CSV
                       if (newEntitiesMap.has(entityName) && newEntitiesMap.get(entityName)?.fields.some(f => f.name.toLowerCase() === fieldName.toLowerCase())) {
                          console.warn(`Skipping duplicate field "${fieldName}" for entity "${entityName}" during CSV import.`);
                          return;
                        }

                       let entity = newEntitiesMap.get(entityName);
                       if (!entity) {
                         entity = { id: uuidv4(), name: entityName, fields: [] };
                         newEntitiesMap.set(entityName, entity);
                       }

                       // Validate cardinality if provided
                       const inputCardinality = row.Cardinality?.trim().toLowerCase();
                       const validCardinalities = ['one-to-one', 'one-to-many', 'many-to-one'];
                       const cardinality = (validCardinalities.includes(inputCardinality || '') ? inputCardinality : 'many-to-one') as 'one-to-one' | 'one-to-many' | 'many-to-one';

                       const field: Field = {
                         id: uuidv4(),
                         name: fieldName,
                         type: row.Type?.trim() || 'string',
                         isPK: row.Key?.trim().toUpperCase() === 'PK',
                         isFK: row.Key?.trim().toUpperCase() === 'FK',
                         notes: row.Notes?.trim() || '',
                         fkReference: (row.Key?.trim().toUpperCase() === 'FK' && row.ForeignKeyEntity && row.ForeignKeyField) ? {
                             targetEntityId: 'UNKNOWN', // Placeholder - Needs manual linking
                             targetFieldId: 'UNKNOWN', // Placeholder
                             cardinality: cardinality
                         } : undefined
                       };

                        if (field.isFK && row.ForeignKeyEntity) {
                            field.notes = field.notes ? `${field.notes}\n(FK -> ${row.ForeignKeyEntity}.${row.ForeignKeyField || '?'})` : `(FK -> ${row.ForeignKeyEntity}.${row.ForeignKeyField || '?'})`;
                        }

                       entity.fields.push(field);
                     });

                    // Filter out entities marked as 'SKIPPED'
                    const newEntitiesArray = Array.from(newEntitiesMap.values()).filter(e => e.id !== 'SKIPPED');

                    if (newEntitiesArray.length > 0) {
                       // Append new entities to existing ones using the setEntities action
                       setEntities([...currentProject.entities, ...newEntitiesArray]);
                      toast({ title: 'CSV imported successfully', description: `${newEntitiesArray.length} new entities added. Existing entities were skipped.` });
                    } else {
                      toast({ title: 'CSV Import', description: 'No new entities found or processed in the CSV (existing entities are skipped).' });
                    }
                  },
                   error: (err: any) => {
                    console.error("CSV Parse Error:", err);
                    toast({ title: 'Import Failed', description: `Failed to parse CSV data. ${err.message}`, variant: 'destructive'});
                  }
                });
                // --- End Process CSV ---
            } else {
                 toast({ title: 'Unsupported File Type', description: 'Please select a .csv or .json file.', variant: 'destructive' });
            }
        } catch (error) {
            console.error("File Processing Error:", error);
             toast({ title: 'Import Failed', description: `Error processing file. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
        }
    };

    reader.onerror = () => {
        toast({ title: 'Import Failed', description: 'Could not read the selected file.', variant: 'destructive' });
    };

    reader.readAsText(file);

    // Reset file input value immediately after selection
    if (e.target) {
        e.target.value = '';
    }
  };

  // Confirmation step for JSON import (overwrites everything)
  const confirmImportJson = () => {
    if (!jsonDataToImport) return;

    try {
        // Replace projects in storage
        storageService.replaceAllProjects(jsonDataToImport);

        // Dispatch action to update application state with the new list
        // This will trigger the useEffect in projectStore to select the most recent project from the new list
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: jsonDataToImport });


        toast({ title: 'Projects imported successfully!', description: 'All previous projects have been replaced.' });
    } catch (error) {
         console.error("JSON Import Confirmation Error:", error);
         toast({ title: 'Import Failed', description: `Error saving imported projects. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    } finally {
        // Clean up state regardless of success/failure
        setImportJsonDialogOpen(false);
        setJsonDataToImport(null);
    }
  };

  const handleExportCSV = () => {
    if (!currentProject || currentProject.entities.length === 0) {
      toast({ title: 'Export Failed', description: 'No project selected or no entities to export.', variant: 'destructive' });
      return;
    }

    const rows: any[] = [];
    const entityMap = new Map(currentProject.entities.map(e => [e.id, e]));

    currentProject.entities.forEach(entity => {
      entity.fields.forEach(field => {
        let fkEntityName = '';
        let fkFieldName = '';
        if (field.fkReference) {
          const targetEntity = entityMap.get(field.fkReference.targetEntityId);
          if (targetEntity) {
            fkEntityName = targetEntity.name;
            const targetField = targetEntity.fields.find(f => f.id === field.fkReference!.targetFieldId);
            fkFieldName = targetField ? targetField.name : ''; // Handle missing target field gracefully
          }
        }

        rows.push({
          Entity: entity.name,
          Field: field.name,
          Type: field.type,
          Key: field.isPK ? 'PK' : field.isFK ? 'FK' : '',
          Notes: field.notes || '',
          ForeignKeyEntity: fkEntityName,
          ForeignKeyField: fkFieldName,
          Cardinality: field.fkReference?.cardinality || ''
        });
      });
    });

    if (rows.length === 0) {
      toast({ title: 'Export Failed', description: 'No fields found in the current project to export.', variant: 'destructive' });
      return;
    }

    try {
      const csv = Papa.unparse(rows);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Current project exported successfully as CSV' });
    } catch (error) {
      console.error("CSV Export Error:", error);
      toast({ title: 'Export Failed', description: `Could not generate CSV. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    }
  };

  const handleExportJson = () => {
    const allProjects = storageService.getProjectList();
    if (allProjects.length === 0) {
        toast({ title: 'Export Failed', description: 'No projects found in storage to export.', variant: 'destructive'});
        return;
    }

    try {
        const jsonString = JSON.stringify(allProjects, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.href = url;
        link.setAttribute('download', `erd_projects_backup_${timestamp}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'All projects exported successfully as JSON' });
    } catch (error) {
        console.error("JSON Export Error:", error);
         toast({ title: 'Export Failed', description: `Could not generate JSON backup. ${error instanceof Error ? error.message : ''}`, variant: 'destructive'});
    }
  };

  // Regenerate mermaidCode whenever entities change
  const mermaidCode = useMemo(() => {
    // Only generate if currentProject and entities exist
    return currentProject?.entities ? generateMermaidCode(currentProject.entities) : 'erDiagram';
  }, [currentProject?.entities]); // Depend specifically on entities array

  // --- LOADING STATES ---
  if (isLoading) {
      return <div className="flex justify-center items-center h-screen">Loading projects...</div>;
  }
   // If loading is done, but still no current project ID (e.g., after deleting all projects)
   if (!currentProjectId && !isLoading) {
        return (
             <div className="h-screen flex flex-col bg-base">
                <Navbar
                  currentProject={null} // Pass null
                  projects={projects}
                  onCreateProject={handleCreateProject}
                  onRenameProject={handleRenameProject}
                  onDeleteProject={handleDeleteProject}
                  onSelectProject={handleSelectProject}
                  onImport={handleImport}
                  onExportCSV={handleExportCSV}
                  onExportJson={handleExportJson}
                />
                <div className="flex-1 flex justify-center items-center text-neutral text-lg">
                  No project selected. Create a new project or import one to begin.
                </div>
                {/* Render dialogs even when no project selected */}
                 <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                   {/* ... Create Dialog content ... */}
                     <DialogContent className="bg-white">
                         <DialogHeader>
                             <DialogTitle className="text-text">Create New Project</DialogTitle>
                             <DialogDescription className="text-neutral">
                                 Enter a name for your new project.
                             </DialogDescription>
                         </DialogHeader>
                         <div className="py-4">
                             <Label htmlFor="project-name" className="text-text">
                                 Project Name
                             </Label>
                             <Input
                                 id="project-name"
                                 value={newProjectName}
                                 onChange={(e) => setNewProjectName(e.target.value)}
                                 onKeyPress={(e) => e.key === 'Enter' && confirmCreateProject()}
                                 placeholder="e.g., E-commerce System"
                                 className="mt-2 border-neutral focus:border-primary"
                                 data-testid="input-create-project-name"
                             />
                         </div>
                         <DialogFooter>
                             <Button
                                 variant="ghost"
                                 onClick={() => setCreateDialogOpen(false)}
                                 className="text-neutral"
                                 data-testid="button-cancel-create"
                             >
                                 Cancel
                             </Button>
                             <Button
                                 onClick={confirmCreateProject}
                                 className="bg-primary hover:bg-primary/80 text-white"
                                 data-testid="button-confirm-create"
                             >
                                 Create
                             </Button>
                         </DialogFooter>
                     </DialogContent>
                 </Dialog>
                  {/* JSON Import Dialog */}
                 <AlertDialog open={importJsonDialogOpen} onOpenChange={setImportJsonDialogOpen}>
                   <AlertDialogContent>
                       <AlertDialogHeader>
                           <AlertDialogTitle>Confirm JSON Import</AlertDialogTitle>
                           <AlertDialogDescription>
                               This will <span className="font-bold text-error">overwrite ALL current projects</span> with the content from the selected file. This action cannot be undone. Are you sure?
                           </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                           <AlertDialogCancel
                               onClick={() => {
                                   setJsonDataToImport(null);
                                   setImportJsonDialogOpen(false);
                                }}
                                data-testid="button-cancel-json-import"
                           >
                               Cancel
                           </AlertDialogCancel>
                           <AlertDialogAction
                               onClick={confirmImportJson}
                               className="bg-warning hover:bg-warning/80 text-white"
                               data-testid="button-confirm-json-import"
                           >
                               Import and Overwrite
                           </AlertDialogAction>
                       </AlertDialogFooter>
                   </AlertDialogContent>
               </AlertDialog>
            </div>
        );
   }

   // If loading is done, we have a currentProjectId, but the project object isn't found (should be rare)
   if (!currentProject && currentProjectId && !isLoading) {
       console.error(`Error: currentProjectId is set to ${currentProjectId}, but project not found in state.`);
       return <div className="flex justify-center items-center h-screen">Error: Failed to load project details. Please try selecting another project.</div>;
   }

   // --- END LOADING STATES ---

   // At this point, currentProject should be valid
   if (!currentProject) {
        // Fallback safety net
       return <div className="flex justify-center items-center h-screen">An unexpected error occurred.</div>;
   }


  // --- Render UI ---
  return (
    <div className="h-screen flex flex-col bg-base">
      <Navbar
        currentProject={currentProject} // Now guaranteed non-null here
        projects={projects}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onSelectProject={handleSelectProject}
        onImport={handleImport} // Consolidated import trigger
        onExportCSV={handleExportCSV}
        onExportJson={handleExportJson}
      />

      {/* Single file input for both types */}
      <input
        ref={fileInputRef}
        type="file"
        // Allow both CSV and JSON
        accept=".csv, application/json, text/csv"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file-import"
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={25} minSize={20}>
            <EntityBuilder
              entities={currentProject.entities} // Can safely access entities
              selectedEntityId={selectedEntityId}
              onAddEntity={handleAddEntityWithToast}
              onDeleteEntity={handleDeleteEntityWithToast}
              onSelectEntity={setSelectedEntityId}
              onAddField={handleAddFieldWithToast}
              onUpdateField={updateField} // Pass directly from context
              onDeleteField={handleDeleteFieldWithToast}
              onOpenManyToManyDialog={handleOpenManyToManyDialog}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={45} minSize={30}>
            <Visualizer entities={currentProject.entities} mermaidCode={mermaidCode} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={30} minSize={20}>
            <CodePanel
              initialCode={mermaidCode}
              currentEntities={currentProject.entities} // Pass non-null entities
            />
          </Panel>
        </PanelGroup>
      </div>

       {/* Dialogs */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
           <AlertDialogContent>
               <AlertDialogHeader>
                   <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                   <AlertDialogDescription>
                       This will permanently delete the project "{currentProject?.name}". This action cannot
                       be undone.
                   </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                   <AlertDialogCancel data-testid="button-cancel-delete-project">Cancel</AlertDialogCancel>
                   <AlertDialogAction
                       onClick={confirmDelete}
                       className="bg-error hover:bg-error/80 text-white"
                       data-testid="button-confirm-delete-project"
                   >
                       Delete
                   </AlertDialogAction>
               </AlertDialogFooter>
           </AlertDialogContent>
       </AlertDialog>

       <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
           <DialogContent className="bg-white">
               <DialogHeader>
                   <DialogTitle className="text-text">Create New Project</DialogTitle>
                   <DialogDescription className="text-neutral">
                       Enter a name for your new project.
                   </DialogDescription>
               </DialogHeader>
               <div className="py-4">
                   <Label htmlFor="project-name" className="text-text">
                       Project Name
                   </Label>
                   <Input
                       id="project-name"
                       value={newProjectName}
                       onChange={(e) => setNewProjectName(e.target.value)}
                       onKeyPress={(e) => e.key === 'Enter' && confirmCreateProject()}
                       placeholder="e.g., E-commerce System"
                       className="mt-2 border-neutral focus:border-primary"
                       data-testid="input-create-project-name"
                   />
               </div>
               <DialogFooter>
                   <Button
                       variant="ghost"
                       onClick={() => setCreateDialogOpen(false)}
                       className="text-neutral"
                       data-testid="button-cancel-create"
                   >
                       Cancel
                   </Button>
                   <Button
                       onClick={confirmCreateProject}
                       className="bg-primary hover:bg-primary/80 text-white"
                       data-testid="button-confirm-create"
                   >
                       Create
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>

       <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
           <DialogContent className="bg-white">
               <DialogHeader>
                   <DialogTitle className="text-text">Rename Project</DialogTitle>
                   <DialogDescription className="text-neutral">
                       Enter a new name for "{currentProject?.name}".
                   </DialogDescription>
               </DialogHeader>
               <div className="py-4">
                   <Label htmlFor="rename-project-name" className="text-text">
                       Project Name
                   </Label>
                   <Input
                       id="rename-project-name"
                       value={renameProjectName}
                       onChange={(e) => setRenameProjectName(e.target.value)}
                       onKeyPress={(e) => e.key === 'Enter' && confirmRenameProject()}
                       placeholder="Enter new name"
                       className="mt-2 border-neutral focus:border-primary"
                       data-testid="input-rename-project-name"
                   />
               </div>
               <DialogFooter>
                   <Button
                       variant="ghost"
                       onClick={() => setRenameDialogOpen(false)}
                       className="text-neutral"
                       data-testid="button-cancel-rename"
                   >
                       Cancel
                   </Button>
                   <Button
                       onClick={confirmRenameProject}
                       className="bg-primary hover:bg-primary/80 text-white"
                       data-testid="button-confirm-rename"
                   >
                       Rename
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>

       <Dialog open={manyToManyDialogOpen} onOpenChange={setManyToManyDialogOpen}>
           <DialogContent className="bg-white">
               <DialogHeader>
                   <DialogTitle className="text-text">Add Many-to-Many Relationship</DialogTitle>
                   <DialogDescription className="text-neutral">
                       Create a join table between "{currentProject?.entities.find(e=>e.id === manyToManySourceId)?.name}" and the selected target entity.
                   </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                   <div>
                       <Label htmlFor="target-entity" className="text-text">
                           Target Entity
                       </Label>
                       <Select
                           value={manyToManyTargetId}
                           onValueChange={(value) => {
                               setManyToManyTargetId(value);
                               if (manyToManySourceId && value && currentProject) {
                                   const source = currentProject.entities.find(e => e.id === manyToManySourceId);
                                   const target = currentProject.entities.find(e => e.id === value);
                                   if (source && target) {
                                       // Auto-suggest name, user can override
                                       setManyToManyJoinTable(`${source.name}_${target.name}`);
                                   }
                               }
                           }}
                       >
                           <SelectTrigger className="mt-2 border-neutral" data-testid="select-mm-target">
                               <SelectValue placeholder="Select target entity" />
                           </SelectTrigger>
                           <SelectContent>
                               {currentProject?.entities
                                   .filter(e => e.id !== manyToManySourceId) // Exclude source entity
                                   .map(entity => (
                                       <SelectItem key={entity.id} value={entity.id}>
                                           {entity.name}
                                       </SelectItem>
                                   ))}
                           </SelectContent>
                       </Select>
                   </div>
                   <div>
                       <Label htmlFor="join-table-name" className="text-text">
                           Join Table Name
                       </Label>
                       <Input
                           id="join-table-name"
                           value={manyToManyJoinTable}
                           onChange={(e) => setManyToManyJoinTable(e.target.value)}
                           placeholder="e.g., Users_Roles"
                           className="mt-2 border-neutral focus:border-primary"
                           data-testid="input-mm-join-table"
                       />
                   </div>
               </div>
               <DialogFooter>
                   <Button
                       variant="ghost"
                       onClick={() => setManyToManyDialogOpen(false)}
                       className="text-neutral"
                       data-testid="button-cancel-mm"
                   >
                       Cancel
                   </Button>
                   <Button
                       onClick={confirmManyToMany}
                       disabled={!manyToManyTargetId || !manyToManyJoinTable.trim()}
                       className="bg-accent hover:bg-accent/80 text-white"
                       data-testid="button-confirm-mm"
                   >
                       Create
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>

        {/* --- JSON Import Confirmation Dialog --- */}
        <AlertDialog open={importJsonDialogOpen} onOpenChange={setImportJsonDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm JSON Import</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will <span className="font-bold text-error">overwrite ALL current projects</span> with the content from the selected file. This action cannot be undone. Are you sure?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            setJsonDataToImport(null); // Clear data on cancel
                            setImportJsonDialogOpen(false);
                         }}
                         data-testid="button-cancel-json-import"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmImportJson}
                        className="bg-warning hover:bg-warning/80 text-white"
                        data-testid="button-confirm-json-import"
                    >
                        Import and Overwrite
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        {/* --- End Dialog --- */}
    </div>
  );
}

