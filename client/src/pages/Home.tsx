import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '@/components/Navbar';
import { EntityList } from '@/components/EntityList';
import { EntityEditorModal } from '@/components/EntityEditorModal';
import Visualizer from '@/components/Visualizer';
import CodePanel from '@/components/CodePanel';
import { Entity, Field, Project, FieldType } from '@/lib/storageService';
import { storageService } from '@/lib/localStorageAdapter';
import { generateMermaidCode } from '@/lib/mermaidGenerator';
import { useToast } from '@/hooks/use-toast';
import { useProjectContext } from '@/store/projectStore';
import { exportDataDictionaryToExcel } from '@/lib/excelGenerator';

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

// Basic validation function for imported JSON (RETAINED)
function isValidProjectArray(data: any): data is Project[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      (typeof item.lastModified === 'number' || typeof item.lastModified === 'undefined') &&
      Array.isArray(item.entities) &&
      item.entities.every((ent: any) =>
        typeof ent === 'object' &&
        ent !== null &&
        typeof ent.id === 'string' &&
        typeof ent.name === 'string' &&
        Array.isArray(ent.fields) &&
        ent.fields.every((field: any) =>
          typeof field === 'object' &&
          field !== null &&
          typeof field.id === 'string' &&
          typeof field.name === 'string' &&
          typeof field.type === 'string'
        )
      )
  );
}

// Validate and normalize field type from CSV import (RETAINED)
function validateFieldType(typeString: string | undefined): FieldType {
  const normalized = (typeString?.trim().toLowerCase() || 'string');
  const validTypes: FieldType[] = [
    'string', 'text', 'int', 'float', 'number', 'decimal',
    'boolean', 'date', 'datetime', 'timestamp', 'json', 'jsonb',
    'uuid', 'enum', 'phone', 'email'
  ];
  if (validTypes.includes(normalized as FieldType)) {
    return normalized as FieldType;
  }
  const typeMap: Record<string, FieldType> = {
    'varchar': 'string',
    'char': 'string',
    'str': 'string',
    'integer': 'int',
    'bigint': 'int',
    'double': 'float',
    'real': 'float',
    'bool': 'boolean',
    'time': 'timestamp',
  };
  if (typeMap[normalized]) {
    return typeMap[normalized];
  }
  return 'string';
}


export default function Home() {
  // Project Context Hook
  const {
    currentProject,
    projects,
    selectProject,
    createProject, // Now triggers saveProjectAndSelect internally
    renameProject,
    deleteProject,
    addEntity,
    deleteEntity,
    addField,
    updateField,
    deleteField,
    setEntities,
    saveProjectAndSelect, // <-- Keep this available for single import confirmation
    isLoading,
    currentProjectId,
  } = useProjectContext();

  // Toast Hook
  const { toast } = useToast();

  // Local UI State Hooks
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [manyToManyDialogOpen, setManyToManyDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameProjectName, setRenameProjectName] = useState('');
  const [manyToManySourceId, setManyToManySourceId] = useState<string | null>(null);
  const [manyToManyTargetId, setManyToManyTargetId] = useState('');
  const [manyToManyJoinTable, setManyToManyJoinTable] = useState('');

  // --- JSON Import States ---
  const [importJsonDialogOpen, setImportJsonDialogOpen] = useState(false);
  const [jsonDataToImport, setJsonDataToImport] = useState<Project[] | null>(null);

  // --- Single JSON Import States ---
  const [importSingleDialogOpen, setImportSingleDialogOpen] = useState(false);
  const [singleProjectToImport, setSingleProjectToImport] = useState<Project | null>(null);

  // Ref Hooks
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Effect Hooks
  useEffect(() => {
    setSelectedEntityId(null);
    setEntityModalOpen(false);
    setSelectedEntityForModal(null);
  }, [currentProjectId]);

  // Memoized Code
  const mermaidCode = useMemo(() => {
    return currentProject?.entities ? generateMermaidCode(currentProject.entities) : 'erDiagram';
  }, [currentProject?.entities]);

  const handleEntityClick = useCallback((entityId: string) => {
    setSelectedEntityForModal(entityId);
    setEntityModalOpen(true);
  }, []);

  const handleOpenNewEntityModal = useCallback(() => {
    setSelectedEntityForModal(null);
    setEntityModalOpen(true);
  }, []);

  const handleSaveEntity = useCallback((updatedEntity: Entity) => {
    if (!currentProject) return;

    const isNewEntity = !currentProject.entities.some(e => e.id === updatedEntity.id);

    if (isNewEntity) {
      addEntity(updatedEntity);
      toast({ title: 'Entity created successfully' });
    } else {
      const updatedEntities = currentProject.entities.map(e =>
        e.id === updatedEntity.id ? updatedEntity : e
      );
      setEntities(updatedEntities);
      toast({ title: 'Entity updated successfully' });
    }

    setEntityModalOpen(false);
    setSelectedEntityForModal(null);
    setSelectedEntityId(updatedEntity.id);
  }, [currentProject, addEntity, setEntities, toast]);

  const handleCloseModal = useCallback(() => {
    setEntityModalOpen(false);
    setSelectedEntityForModal(null);
  }, []);

  const handleCreateProject = useCallback(() => {
    setNewProjectName('');
    setCreateDialogOpen(true);
  }, []);

  const handleExportExcel = useCallback(() => {
    if (!currentProject || currentProject.entities.length === 0) {
      toast({ title: 'Export Failed', description: 'No entities to export as Excel.', variant: 'destructive' });
      return;
    }

    try {
      exportDataDictionaryToExcel(currentProject.entities, currentProject.name);
      toast({ title: 'Data Dictionary exported successfully as Excel (.xlsx)' });
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast({ title: 'Export Failed', description: `Could not generate Excel file. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    }
  }, [currentProject, toast]);

  /**
   * FIX: Simplifed implementation. The side effect (creation/save/selection) is now handled 
   * entirely by the createProject action from the context (which internally calls saveProjectAndSelect).
   */
  const confirmCreateProject = useCallback(() => {
    if (newProjectName.trim()) {
      try {
        // The createProject action now handles saving and selecting the new project internally.
        createProject(newProjectName.trim());
        toast({ title: `Project "${newProjectName.trim()}" created successfully` });
        setCreateDialogOpen(false);
        setNewProjectName('');
      } catch (error) {
        console.error("Failed to create project:", error);
        toast({ title: 'Failed to create project', description: `${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Project name cannot be empty', variant: 'destructive' });
    }
  }, [newProjectName, createProject, toast]); // createProject is now the only dependency from context

  const handleRenameProject = useCallback(() => {
    if (!currentProject) return;
    setRenameProjectName(currentProject.name);
    setRenameDialogOpen(true);
  }, [currentProject]);

  const confirmRenameProject = useCallback(() => {
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
      setRenameDialogOpen(false);
    }
  }, [currentProject, renameProjectName, renameProject, toast]);

  const handleDeleteProject = useCallback(() => {
    if (!currentProject) {
      toast({ title: 'Cannot Delete', description: 'No project selected.', variant: 'destructive' });
      return;
    }
    setDeleteDialogOpen(true);
  }, [currentProject, toast]);

  const confirmDelete = useCallback(() => {
    if (!currentProject) return;
    deleteProject(currentProject.id);
    setDeleteDialogOpen(false);
    toast({ title: 'Project deleted successfully', variant: 'destructive' });
  }, [currentProject, deleteProject, toast]);

  const handleSelectProject = useCallback((id: string) => {
    selectProject(id);
  }, [selectProject]);

  const handleDeleteEntityWithToast = useCallback((id: string) => {
    deleteEntity(id);
    if (selectedEntityId === id) {
      setSelectedEntityId(null);
    }
    toast({ title: 'Entity deleted successfully' });
  }, [deleteEntity, selectedEntityId, toast]);

  const handleAddFieldWithToast = useCallback((entityId: string, fieldData: Omit<Field, 'id'>) => {
    if (!currentProject) return;
    const entity = currentProject.entities.find(e => e.id === entityId);
    if (!entity) return;
    const trimmedFieldName = fieldData.name.trim();
    if (!trimmedFieldName) {
      toast({ title: 'Field name cannot be empty', variant: 'destructive' });
      return;
    }
    addField(entityId, { ...fieldData, name: trimmedFieldName });
    toast({ title: 'Field added successfully' });
  }, [currentProject, addField, toast]);

  const handleDeleteFieldWithToast = useCallback((entityId: string, fieldId: string) => {
    deleteField(entityId, fieldId);
    toast({ title: 'Field deleted successfully' });
  }, [deleteField, toast]);

  const handleOpenManyToManyDialog = useCallback((entityId: string) => {
    if (!currentProject) return;
    const sourceEntity = currentProject.entities.find(e => e.id === entityId);
    if (!sourceEntity) return;

    setManyToManySourceId(entityId);
    setManyToManyTargetId('');
    setManyToManyJoinTable('');
    setManyToManyDialogOpen(true);
  }, [currentProject]);

  const confirmManyToMany = useCallback(() => {
    if (!currentProject || !manyToManySourceId || !manyToManyTargetId || !manyToManyJoinTable.trim()) {
      return;
    }
    const sourceEntity = currentProject.entities.find(e => e.id === manyToManySourceId);
    const targetEntity = currentProject.entities.find(e => e.id === manyToManyTargetId);

    if (!sourceEntity || !targetEntity) {
      toast({ title: 'Error', description: 'Could not find source or target entity.', variant: 'destructive' });
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
          name: `${sourceEntity.name.toLowerCase()}_${sourcePK.name}`,
          type: sourcePK.type as FieldType,
          isPK: true,
          isFK: true,
          description: `References ${sourceEntity.name}(${sourcePK.name})`,
          fkReference: {
            targetEntityId: manyToManySourceId,
            targetFieldId: sourcePK.id,
            cardinality: 'many-to-one',
            relationshipLabel: `${sourceEntity.name} to ${targetEntity.name}`
          },
        },
        {
          id: uuidv4(),
          name: `${targetEntity.name.toLowerCase()}_${targetPK.name}`,
          type: targetPK.type as FieldType,
          isPK: true,
          isFK: true,
          description: `References ${targetEntity.name}(${targetPK.name})`,
          fkReference: {
            targetEntityId: manyToManyTargetId,
            targetFieldId: targetPK.id,
            cardinality: 'many-to-one',
            relationshipLabel: `${targetEntity.name} to ${sourceEntity.name}`
          },
        },
      ],
    };

    addEntity(joinTable);

    toast({ title: 'Many-to-Many relationship created successfully' });
    setManyToManyDialogOpen(false);
    setManyToManySourceId(null);
    setManyToManyTargetId('');
    setManyToManyJoinTable('');
  }, [currentProject, manyToManySourceId, manyToManyTargetId, manyToManyJoinTable, addEntity, toast]);

  const handleImportCSV = useCallback(() => {
    if (!csvFileInputRef.current) {
      toast({ title: 'Import Error', description: 'File input element not found.', variant: 'destructive' });
      return;
    }
    csvFileInputRef.current.value = '';
    csvFileInputRef.current.click();
  }, [toast]);

  // Handle Single Project Import Initiation
  const handleImportSingleJson = useCallback(() => {
    if (!jsonFileInputRef.current) {
      toast({ title: 'Import Error', description: 'File input element not found.', variant: 'destructive' });
      return;
    }
    // Set data-mode to 'single' to trigger correct parsing logic
    jsonFileInputRef.current.setAttribute('data-mode', 'single');
    jsonFileInputRef.current.value = '';
    jsonFileInputRef.current.click();
  }, [toast]);

  // Handle All Projects Import Initiation
  const handleImportJson = useCallback(() => {
    if (!jsonFileInputRef.current) {
      toast({ title: 'Import Error', description: 'File input element not found.', variant: 'destructive' });
      return;
    }
    // Set data-mode to 'all' for array parsing
    jsonFileInputRef.current.setAttribute('data-mode', 'all');
    jsonFileInputRef.current.value = '';
    jsonFileInputRef.current.click();
  }, [toast]);

  // Handles reading and processing CSV files (Logic remains unchanged)
  const handleCSVFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentProject) {
      toast({ title: 'Import Failed', description: 'Cannot import CSV without an active project selected.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      if (!fileContent) {
        toast({ title: 'Import Failed', description: 'Could not read file content.', variant: 'destructive' });
        return;
      }

      try {
        Papa.parse<Record<string, string>>(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const newEntitiesMap: Map<string, Entity> = new Map();
            const existingEntitiesLower = currentProject.entities.map(e => e.name.toLowerCase());

            results.data.forEach((row) => {
              const entityName = row.Entity?.trim();
              const fieldName = row.Field?.trim();
              if (!entityName || !fieldName) return;

              const alreadyExists = existingEntitiesLower.includes(entityName.toLowerCase());
              if (alreadyExists) {
                newEntitiesMap.set(entityName, { id: 'SKIPPED', name: entityName, fields: [] });
                return;
              }

              if (newEntitiesMap.has(entityName) && newEntitiesMap.get(entityName)?.fields.some(f => f.name.toLowerCase() === fieldName.toLowerCase())) {
                return;
              }

              let entity = newEntitiesMap.get(entityName);
              if (!entity) {
                entity = { id: uuidv4(), name: entityName, fields: [] };
                newEntitiesMap.set(entityName, entity);
              }

              const inputCardinality = row.Cardinality?.trim().toLowerCase();
              const validCardinalities = ['one-to-one', 'one-to-many', 'many-to-one'];
              const cardinality = (validCardinalities.includes(inputCardinality || '') ? inputCardinality : 'many-to-one') as 'one-to-one' | 'one-to-many' | 'many-to-one';

              const field: Field = {
                id: uuidv4(),
                name: fieldName,
                type: validateFieldType(row.Type),
                isPK: row.Key?.trim().toUpperCase() === 'PK',
                isFK: row.Key?.trim().toUpperCase() === 'FK',
                description: row.Description?.trim() || row.Notes?.trim() || '',
                fkReference: (row.Key?.trim().toUpperCase() === 'FK' && row.ForeignKeyEntity && row.ForeignKeyField) ? {
                  targetEntityId: 'UNKNOWN',
                  targetFieldId: 'UNKNOWN',
                  cardinality: cardinality,
                  relationshipLabel: row.RelationshipLabel?.trim() || undefined
                } : undefined
              };

              if (field.isFK && row.ForeignKeyEntity) {
                field.description = field.description ? `${field.description}\n(FK -> ${row.ForeignKeyEntity}.${row.ForeignKeyField || '?'})` : `(FK -> ${row.ForeignKeyEntity}.${row.ForeignKeyField || '?'})`;
              }

              entity.fields.push(field);
            });

            const newEntitiesArray = Array.from(newEntitiesMap.values()).filter(e => e.id !== 'SKIPPED');

            if (newEntitiesArray.length > 0) {
              const combinedEntities = [...currentProject.entities, ...newEntitiesArray];
              setEntities(combinedEntities);
              toast({ title: 'CSV imported successfully', description: `${newEntitiesArray.length} new entities added. Existing entities were skipped.` });
            } else {
              toast({ title: 'CSV Import', description: 'No new entities found or processed in the CSV (existing entities are skipped).' });
            }
          },
          error: (err: any) => {
            toast({ title: 'Import Failed', description: `Failed to parse CSV data. ${err.message}`, variant: 'destructive' });
          }
        });
      } catch (error) {
        toast({ title: 'Import Failed', description: `Error processing file. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
      }
    };

    reader.onerror = () => {
      toast({ title: 'Import Failed', description: 'Could not read the selected file.', variant: 'destructive' });
    };

    reader.readAsText(file);

    if (e.target) e.target.value = '';
  }, [currentProject, setEntities, toast]);

  // Handles reading and processing JSON backup files (Single vs. All)
  const handleJSONFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine the import mode set by the initiation handlers
    const mode = e.target.getAttribute('data-mode');

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      if (!fileContent) {
        toast({ title: 'Import Failed', description: 'Could not read file content.', variant: 'destructive' });
        return;
      }

      try {
        const parsedData = JSON.parse(fileContent);

        if (mode === 'single') {
          // Check if it's a single object that looks like a project
          if (Array.isArray(parsedData) || !isValidProjectArray([parsedData])) {
            toast({ title: 'Invalid File', description: 'Expected a single Project object structure.', variant: 'destructive' });
            return;
          }
          setSingleProjectToImport(parsedData as Project);
          setImportSingleDialogOpen(true); // Open the new single import dialog
        } else {
          // Check if it's an array of projects (for "Import All")
          if (!isValidProjectArray(parsedData)) {
            toast({ title: 'Invalid JSON', description: 'The JSON file does not contain a valid project array structure.', variant: 'destructive' });
            return;
          }
          setJsonDataToImport(parsedData);
          setImportJsonDialogOpen(true); // Open the existing 'overwrite all' dialog
        }

      } catch (error) {
        toast({ title: 'Import Failed', description: `Error processing file. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
      }
    };

    reader.onerror = () => {
      toast({ title: 'Import Failed', description: 'Could not read the selected file.', variant: 'destructive' });
    };

    reader.readAsText(file);

    if (e.target) e.target.value = '';
  }, [toast]);

  // Existing: Confirmation step for JSON import (overwrites ALL projects)
  const confirmImportJson = useCallback(() => {
    if (!jsonDataToImport) return;

    try {
      storageService.replaceAllProjects(jsonDataToImport);
      toast({ title: 'Projects imported successfully!', description: 'Page will refresh to show changes.' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({ title: 'Import Failed', description: `Error saving imported projects. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    } finally {
      setImportJsonDialogOpen(false);
      setJsonDataToImport(null);
    }
  }, [jsonDataToImport, toast]);

  // Logic for confirming single project import (replace vs. new)
  const confirmImportSingleProject = useCallback((mode: 'replace' | 'new') => {
    if (!singleProjectToImport) return;

    const projectToSave: Project = { ...singleProjectToImport };

    if (mode === 'new') {
      projectToSave.id = uuidv4();

      let newName = projectToSave.name;
      let counter = 1;
      while (projects.some(p => p.name === newName)) {
        newName = `${singleProjectToImport.name} (Copy ${counter++})`;
      }
      projectToSave.name = newName;
    }

    try {
      // FIX: Use the new context action to save to storage, update state, and select in one go.
      saveProjectAndSelect(projectToSave);

      toast({ title: `Project "${projectToSave.name}" imported successfully!`, description: mode === 'replace' ? 'Existing project data was replaced.' : 'Imported as a new project.' });
    } catch (error) {
      toast({ title: 'Import Failed', description: `Error saving project. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    } finally {
      setImportSingleDialogOpen(false);
      setSingleProjectToImport(null);
    }
  }, [singleProjectToImport, projects, saveProjectAndSelect, toast]);


  const handleExportCSV = useCallback(() => {
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
            fkFieldName = targetField ? targetField.name : '';
          }
        }

        rows.push({
          Entity: entity.name,
          Field: field.name,
          Type: field.type,
          Key: field.isPK ? 'PK' : field.isFK ? 'FK' : '',
          Description: field.description || '',
          ForeignKeyEntity: fkEntityName,
          ForeignKeyField: fkFieldName,
          Cardinality: field.fkReference?.cardinality || '',
          RelationshipLabel: field.fkReference?.relationshipLabel || ''
        });
      });
    });

    if (rows.length === 0) {
      toast({ title: 'Export Failed', description: 'No fields found in the current project to export.', variant: 'destructive' });
      return;
    }

    try {
      const csv = Papa.unparse(rows);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
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
  }, [currentProject, toast]);

  // Handle Single Project Export (Used for Navbar)
  const handleExportSingleJson = useCallback(() => {
    if (!currentProject) {
      toast({ title: 'Export Failed', description: 'No project selected to export.', variant: 'destructive' });
      return;
    }

    try {
      const jsonString = JSON.stringify(currentProject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

      link.href = url;
      link.setAttribute('download', `${currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: `Project "${currentProject.name}" exported successfully as JSON` });
    } catch (error) {
      console.error("JSON Export Error:", error);
      toast({ title: 'Export Failed', description: `Could not generate JSON export. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    }
  }, [currentProject, toast]);

  // Handle All Projects Export (Used for Navbar)
  const handleExportJson = useCallback(() => {
    const allProjects = storageService.getProjectList();
    if (allProjects.length === 0) {
      toast({ title: 'Export Failed', description: 'No projects found in storage to export.', variant: 'destructive' });
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
      toast({ title: 'Export Failed', description: `Could not generate JSON backup. ${error instanceof Error ? error.message : ''}`, variant: 'destructive' });
    }
  }, [toast]);

  // --- LOADING STATES ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading projects...</div>;
  }

  // If loading is done, but still no current project ID 
  if (!currentProjectId && !isLoading) {
    return (
      <div className="h-screen flex flex-col bg-base">
        <Navbar
          currentProject={null}
          projects={projects}
          onCreateProject={handleCreateProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={handleSelectProject}
          onImportCSV={handleImportCSV}
          onImportJson={handleImportJson}
          onImportSingleJson={handleImportSingleJson}
          onExportCSV={handleExportCSV}
          onExportJson={handleExportJson}
          onExportSingleJson={handleExportSingleJson}
          onExportExcel={handleExportExcel}
        />

        {/* Separate file inputs for CSV and JSON import */}
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv, text/csv"
          onChange={handleCSVFileChange}
          className="hidden"
          data-testid="input-file-import-csv"
        />
        <input
          ref={jsonFileInputRef}
          type="file"
          accept=".json, application/json"
          onChange={handleJSONFileChange}
          className="hidden"
          data-testid="input-file-import-json"
        />

        <div className="flex-1 flex justify-center items-center text-neutral text-lg">
          No project selected. Create a new project or import one to begin.
        </div>
        {/* Dialogs rendered conditionally for the 'No Project' view */}
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
        <AlertDialog open={importSingleDialogOpen} onOpenChange={setImportSingleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Import Single Project</AlertDialogTitle>
              <AlertDialogDescription>
                You are importing the project: <span className="font-bold">{singleProjectToImport?.name}</span>.
                Do you want to overwrite an existing project with the same ID, or import it as a new project?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setSingleProjectToImport(null);
                  setImportSingleDialogOpen(false);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={() => confirmImportSingleProject('new')}
                className="bg-primary hover:bg-primary/80 text-white"
                data-testid="button-import-single-new"
              >
                Import as New Project
              </Button>
              <Button
                onClick={() => confirmImportSingleProject('replace')}
                className="bg-warning hover:bg-warning/80 text-white"
                data-testid="button-import-single-replace"
              >
                Replace Existing Project
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Safety checks (These must also be after all hooks)
  if (!currentProject) {
    console.error(`Error: currentProjectId is set to ${currentProjectId}, but project not found in state.`);
    return <div className="flex justify-center items-center h-screen">Error: Failed to load project details. Please try selecting another project.</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-base">
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onSelectProject={handleSelectProject}
        onImportCSV={handleImportCSV}
        onImportJson={handleImportJson}
        onImportSingleJson={handleImportSingleJson}
        onExportCSV={handleExportCSV}
        onExportJson={handleExportJson}
        onExportSingleJson={handleExportSingleJson}
        onExportExcel={handleExportExcel}
      />

      {/* Separate file inputs for CSV and JSON */}
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv, text/csv"
        onChange={handleCSVFileChange}
        className="hidden"
        data-testid="input-file-import-csv"
      />
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json, application/json"
        onChange={handleJSONFileChange}
        className="hidden"
        data-testid="input-file-import-json"
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={25} minSize={20} className="bg-white">
            <EntityList
              entities={currentProject.entities}
              selectedEntityId={selectedEntityId}
              onDeleteEntity={handleDeleteEntityWithToast}
              onEntityClick={handleEntityClick}
              onOpenNewEntityModal={handleOpenNewEntityModal}
              onSelectEntity={setSelectedEntityId}
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
              currentEntities={currentProject.entities}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Entity Editor Modal */}
      <EntityEditorModal
        entity={
          selectedEntityForModal
            ? currentProject.entities.find(e => e.id === selectedEntityForModal) || null
            : { id: uuidv4(), name: 'New Entity', fields: [] } as Entity
        }
        entities={currentProject.entities}
        isOpen={entityModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEntity}
        onOpenManyToManyDialog={handleOpenManyToManyDialog}
      />

      {/* Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{currentProject.name}". This action cannot
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
              Enter a new name for "{currentProject.name}".
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
              Create a join table between "{currentProject.entities.find(e => e.id === manyToManySourceId)?.name}" and the selected target entity.
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
                      setManyToManyJoinTable(`${source.name}_${target.name}`);
                    }
                  }
                }}
              >
                <SelectTrigger className="mt-2 border-neutral" data-testid="select-mm-target">
                  <SelectValue placeholder="Select target entity" />
                </SelectTrigger>
                <SelectContent>
                  {currentProject.entities
                    .filter(e => e.id !== manyToManySourceId)
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
      <AlertDialog open={importSingleDialogOpen} onOpenChange={setImportSingleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Single Project</AlertDialogTitle>
            <AlertDialogDescription>
              You are importing the project: <span className="font-bold">{singleProjectToImport?.name}</span>.
              Do you want to overwrite an existing project with the same ID, or import it as a new project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSingleProjectToImport(null);
                setImportSingleDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() => confirmImportSingleProject('new')}
              className="bg-primary hover:bg-primary/80 text-white"
              data-testid="button-import-single-new"
            >
              Import as New Project
            </Button>
            <Button
              onClick={() => confirmImportSingleProject('replace')}
              className="bg-warning hover:bg-warning/80 text-white"
              data-testid="button-import-single-replace"
            >
              Replace Existing Project
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}