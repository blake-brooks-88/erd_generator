import { useState, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '@/components/Navbar';
import EntityBuilder from '@/components/EntityBuilder';
import Visualizer from '@/components/Visualizer';
import CodePanel from '@/components/CodePanel';
import {
  Entity,
  Field,
  Project,
  storageService,
} from '@/lib/storageService';
import { generateMermaidCode } from '@/lib/mermaidGenerator';
import { useToast } from '@/hooks/use-toast';
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
import Papa from 'papaparse';

export default function Home() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = storageService.getProjectList();
    setProjects(allProjects);

    if (allProjects.length === 0) {
      const newProject: Project = {
        id: uuidv4(),
        name: 'Untitled Project',
        entities: [],
        lastModified: Date.now(),
      };
      storageService.saveProject(newProject);
      setCurrentProject(newProject);
      setProjects([newProject]);
    } else {
      const recentId = storageService.getMostRecentProjectId();
      const project = recentId ? storageService.loadProject(recentId) : allProjects[0];
      setCurrentProject(project);
    }
  };

  const saveCurrentProject = (updatedProject: Project) => {
    storageService.saveProject(updatedProject);
    setCurrentProject(updatedProject);
    setProjects(storageService.getProjectList());
  };

  const handleCreateProject = () => {
    const name = prompt('Enter project name:');
    if (name?.trim()) {
      const newProject: Project = {
        id: uuidv4(),
        name: name.trim(),
        entities: [],
        lastModified: Date.now(),
      };
      storageService.saveProject(newProject);
      setCurrentProject(newProject);
      loadProjects();
      toast({ title: 'Project created successfully' });
    }
  };

  const handleRenameProject = () => {
    if (!currentProject) return;
    const newName = prompt('Enter new project name:', currentProject.name);
    if (newName?.trim()) {
      const updated = { ...currentProject, name: newName.trim() };
      saveCurrentProject(updated);
      toast({ title: 'Project renamed successfully' });
    }
  };

  const handleDeleteProject = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!currentProject) return;
    storageService.deleteProject(currentProject.id);
    setDeleteDialogOpen(false);
    loadProjects();
    toast({ title: 'Project deleted successfully', variant: 'destructive' });
  };

  const handleSelectProject = (id: string) => {
    const project = storageService.loadProject(id);
    if (project) {
      setCurrentProject(project);
      setSelectedEntityId(null);
    }
  };

  const handleAddEntity = (name: string) => {
    if (!currentProject) return;
    
    if (currentProject.entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: 'Duplicate entity name',
        description: 'An entity with this name already exists.',
        variant: 'destructive',
      });
      return;
    }

    const newEntity: Entity = {
      id: uuidv4(),
      name,
      fields: [],
    };

    saveCurrentProject({
      ...currentProject,
      entities: [...currentProject.entities, newEntity],
    });
    toast({ title: 'Entity added successfully' });
  };

  const handleDeleteEntity = (id: string) => {
    if (!currentProject) return;
    saveCurrentProject({
      ...currentProject,
      entities: currentProject.entities.filter(e => e.id !== id),
    });
    if (selectedEntityId === id) {
      setSelectedEntityId(null);
    }
    toast({ title: 'Entity deleted successfully' });
  };

  const handleAddField = (entityId: string, fieldData: Omit<Field, 'id'>) => {
    if (!currentProject) return;

    const entity = currentProject.entities.find(e => e.id === entityId);
    if (!entity) return;

    if (entity.fields.some(f => f.name.toLowerCase() === fieldData.name.toLowerCase())) {
      toast({
        title: 'Duplicate field name',
        description: 'A field with this name already exists in this entity.',
        variant: 'destructive',
      });
      return;
    }

    const newField: Field = {
      ...fieldData,
      id: uuidv4(),
    };

    saveCurrentProject({
      ...currentProject,
      entities: currentProject.entities.map(e =>
        e.id === entityId ? { ...e, fields: [...e.fields, newField] } : e
      ),
    });
    toast({ title: 'Field added successfully' });
  };

  const handleUpdateField = (entityId: string, fieldId: string, updates: Partial<Field>) => {
    if (!currentProject) return;

    saveCurrentProject({
      ...currentProject,
      entities: currentProject.entities.map(e =>
        e.id === entityId
          ? {
              ...e,
              fields: e.fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f)),
            }
          : e
      ),
    });
  };

  const handleDeleteField = (entityId: string, fieldId: string) => {
    if (!currentProject) return;

    saveCurrentProject({
      ...currentProject,
      entities: currentProject.entities.map(e =>
        e.id === entityId ? { ...e, fields: e.fields.filter(f => f.id !== fieldId) } : e
      ),
    });
    toast({ title: 'Field deleted successfully' });
  };

  const handleAddManyToMany = (
    entityId: string,
    targetEntityId: string,
    joinTableName: string
  ) => {
    if (!currentProject) return;

    const sourceEntity = currentProject.entities.find(e => e.id === entityId);
    const targetEntity = currentProject.entities.find(e => e.id === targetEntityId);

    if (!sourceEntity || !targetEntity) return;

    const sourcePK = sourceEntity.fields.find(f => f.isPK);
    const targetPK = targetEntity.fields.find(f => f.isPK);

    if (!sourcePK || !targetPK) {
      toast({
        title: 'Missing primary keys',
        description: 'Both entities must have primary keys defined.',
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
          name: `${sourceEntity.name.toLowerCase()}_id`,
          type: sourcePK.type,
          isPK: true,
          isFK: true,
          notes: `References ${sourceEntity.name}.${sourcePK.name}`,
          fkReference: {
            targetEntityId: entityId,
            targetFieldId: sourcePK.id,
            cardinality: 'one-to-many',
          },
        },
        {
          id: uuidv4(),
          name: `${targetEntity.name.toLowerCase()}_id`,
          type: targetPK.type,
          isPK: true,
          isFK: true,
          notes: `References ${targetEntity.name}.${targetPK.name}`,
          fkReference: {
            targetEntityId: targetEntityId,
            targetFieldId: targetPK.id,
            cardinality: 'one-to-many',
          },
        },
      ],
    };

    saveCurrentProject({
      ...currentProject,
      entities: [...currentProject.entities, joinTable],
    });
    toast({ title: 'Many-to-Many relationship created successfully' });
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const newEntities: Map<string, Entity> = new Map();

          results.data.forEach((row: any) => {
            if (!row.Entity || !row.Field) return;

            let entity = newEntities.get(row.Entity);
            if (!entity) {
              entity = {
                id: uuidv4(),
                name: row.Entity,
                fields: [],
              };
              newEntities.set(row.Entity, entity);
            }

            const field: Field = {
              id: uuidv4(),
              name: row.Field,
              type: row.Type || 'string',
              isPK: row.Key === 'PK',
              isFK: row.Key === 'FK',
              notes: row.Notes || '',
            };

            entity.fields.push(field);
          });

          if (currentProject) {
            saveCurrentProject({
              ...currentProject,
              entities: Array.from(newEntities.values()),
            });
            toast({ title: 'CSV imported successfully' });
          }
        } catch (error) {
          toast({
            title: 'Import failed',
            description: 'Failed to parse CSV file.',
            variant: 'destructive',
          });
        }
      },
      error: () => {
        toast({
          title: 'Import failed',
          description: 'Failed to read CSV file.',
          variant: 'destructive',
        });
      },
    });

    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (!currentProject) return;

    const rows: any[] = [];
    currentProject.entities.forEach(entity => {
      entity.fields.forEach(field => {
        rows.push({
          Entity: entity.name,
          Field: field.name,
          Type: field.type,
          Key: field.isPK ? 'PK' : field.isFK ? 'FK' : '',
          Notes: field.notes,
          ForeignKeyEntity: field.fkReference
            ? currentProject.entities.find(e => e.id === field.fkReference!.targetEntityId)?.name
            : '',
          ForeignKeyField: field.fkReference
            ? currentProject.entities
                .find(e => e.id === field.fkReference!.targetEntityId)
                ?.fields.find(f => f.id === field.fkReference!.targetFieldId)?.name
            : '',
        });
      });
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exported successfully' });
  };

  const mermaidCode = currentProject ? generateMermaidCode(currentProject.entities) : '';

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
        onExportCSV={handleExportCSV}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={25} minSize={20}>
            <EntityBuilder
              entities={currentProject?.entities || []}
              selectedEntityId={selectedEntityId}
              onAddEntity={handleAddEntity}
              onDeleteEntity={handleDeleteEntity}
              onSelectEntity={setSelectedEntityId}
              onAddField={handleAddField}
              onUpdateField={handleUpdateField}
              onDeleteField={handleDeleteField}
              onAddManyToMany={handleAddManyToMany}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={45} minSize={30}>
            <Visualizer entities={currentProject?.entities || []} mermaidCode={mermaidCode} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={30} minSize={20}>
            <CodePanel code={mermaidCode} />
          </Panel>
        </PanelGroup>
      </div>

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-error hover:bg-error/80 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
