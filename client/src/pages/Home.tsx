import { useState, useEffect, useRef, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '@/components/Navbar';
import EntityBuilder from '@/components/EntityBuilder';
import Visualizer from '@/components/Visualizer';
import CodePanel from '@/components/CodePanel';
import { Entity, Field, Project } from '@/lib/storageService';
import { generateMermaidCode } from '@/lib/mermaidGenerator';
import { useToast } from '@/hooks/use-toast';
import { useProjectContext } from '@/store/projectStore';
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

export default function Home() {
  const {
    projects,
    currentProject,
    isLoading,
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
  } = useProjectContext();

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

   useEffect(() => {
        setSelectedEntityId(null);
   }, [currentProject?.id]);

  const handleCreateProject = () => {
    setNewProjectName('');
    setCreateDialogOpen(true);
  };

  const confirmCreateProject = () => {
    if (newProjectName.trim()) {
      try {
        createProject(newProjectName.trim());
        toast({ title: 'Project created successfully' });
        setCreateDialogOpen(false);
        setNewProjectName('');
      } catch (error) {
           console.error("Failed to create project:", error);
           toast({ title: 'Failed to create project', variant: 'destructive'});
      }
    }
  };

  const handleRenameProject = () => {
    if (!currentProject) return;
    setRenameProjectName(currentProject.name);
    setRenameDialogOpen(true);
  };

  const confirmRenameProject = () => {
    if (!currentProject) return;
    if (renameProjectName.trim() && renameProjectName.trim() !== currentProject.name) {
      renameProject(currentProject.id, renameProjectName.trim());
      toast({ title: 'Project renamed successfully' });
      setRenameDialogOpen(false);
      setRenameProjectName('');
    } else if (renameProjectName.trim() === currentProject.name) {
       setRenameDialogOpen(false);
       setRenameProjectName('');
    }
  };

  const handleDeleteProject = () => {
    if (!currentProject) return;
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!currentProject) return;
    deleteProject(currentProject.id);
    setDeleteDialogOpen(false);
    toast({ title: 'Project deleted successfully', variant: 'destructive' });
  };

   const handleAddEntityWithToast = (name: string) => {
        if (!currentProject) return;
        if (currentProject.entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
             toast({
                title: 'Duplicate entity name',
                description: 'An entity with this name already exists.',
                variant: 'destructive',
             });
        } else {
             addEntity(name);
             toast({ title: 'Entity added successfully' });
        }
    };

    const handleDeleteEntityWithToast = (id: string) => {
        deleteEntity(id);
        if (selectedEntityId === id) {
             setSelectedEntityId(null);
        }
        toast({ title: 'Entity deleted successfully' });
    };

     const handleAddFieldWithToast = (entityId: string, fieldData: Omit<Field, 'id'>) => {
        if (!currentProject) return;
        const entity = currentProject.entities.find(e => e.id === entityId);
        if (entity && entity.fields.some(f => f.name.toLowerCase() === fieldData.name.toLowerCase())) {
            toast({
                title: 'Duplicate field name',
                description: 'A field with this name already exists in this entity.',
                variant: 'destructive',
            });
        } else {
            addField(entityId, fieldData);
            toast({ title: 'Field added successfully' });
        }
     };

     const handleDeleteFieldWithToast = (entityId: string, fieldId: string) => {
        deleteField(entityId, fieldId);
        toast({ title: 'Field deleted successfully' });
     };

   const handleOpenManyToManyDialog = (entityId: string) => {
    if (!currentProject) return;
    const sourceEntity = currentProject.entities.find(e => e.id === entityId);
    if (!sourceEntity) return;

    setManyToManySourceId(entityId);
    setManyToManyTargetId('');
    setManyToManyJoinTable('');
    setManyToManyDialogOpen(true);
  };

    const confirmManyToMany = () => {
        if (!currentProject || !manyToManySourceId || !manyToManyTargetId || !manyToManyJoinTable.trim()) {
        toast({ title: 'Missing information', description: 'Please select a target entity and provide a join table name.', variant: 'destructive'});
        return;
        }

        const sourceEntity = currentProject.entities.find(e => e.id === manyToManySourceId);
        const targetEntity = currentProject.entities.find(e => e.id === manyToManyTargetId);

        if (!sourceEntity || !targetEntity) {
            toast({ title: 'Entities not found', variant: 'destructive'});
            return;
        };

        const sourcePK = sourceEntity.fields.find(f => f.isPK);
        const targetPK = targetEntity.fields.find(f => f.isPK);

        if (!sourcePK || !targetPK) {
        toast({
            title: 'Missing primary keys',
            description: 'Both source and target entities must have primary keys defined to create a join table.',
            variant: 'destructive',
        });
        return;
        }

        const joinTableName = manyToManyJoinTable.trim();
        if (currentProject.entities.some(e => e.name.toLowerCase() === joinTableName.toLowerCase())) {
            toast({
                title: 'Duplicate entity name',
                description: `An entity named "${joinTableName}" already exists. Choose a different name for the join table.`,
                variant: 'destructive',
            });
            return;
        }

        const joinTableEntity: Entity = {
        id: uuidv4(),
        name: joinTableName,
        fields: [
            {
            id: uuidv4(),
            name: `${sourceEntity.name.toLowerCase()}_${sourcePK.name}`,
            type: sourcePK.type,
            isPK: true,
            isFK: true,
            notes: `Links to ${sourceEntity.name}`,
            fkReference: {
                targetEntityId: manyToManySourceId,
                targetFieldId: sourcePK.id,
                cardinality: 'many-to-one',
            },
            },
            {
            id: uuidv4(),
            name: `${targetEntity.name.toLowerCase()}_${targetPK.name}`,
            type: targetPK.type,
            isPK: true,
            isFK: true,
            notes: `Links to ${targetEntity.name}`,
            fkReference: {
                targetEntityId: manyToManyTargetId,
                targetFieldId: targetPK.id,
                cardinality: 'many-to-one',
            },
            },
        ],
        };

        // Temporary workaround: Use setEntities to add the new entity including its fields
        saveCurrentProjectWithNewEntities([...currentProject.entities, joinTableEntity]);

        toast({ title: 'Many-to-Many join table created' });
        setManyToManyDialogOpen(false);
    };


  const saveCurrentProjectWithNewEntities = (newEntities: Entity[]) => {
      setEntities(newEntities);
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newEntitiesMap: Map<string, Entity> = new Map();
          const errors: string[] = [];

          results.data.forEach((row, index) => {
            const entityName = row.Entity?.trim();
            const fieldName = row.Field?.trim();

            if (!entityName || !fieldName) {
              if(Object.keys(row).length > 1 || (entityName && !fieldName) || (!entityName && fieldName)) {
                errors.push(`Row ${index + 2}: Missing required 'Entity' or 'Field' name.`);
              }
              return;
            }

            let entity = newEntitiesMap.get(entityName);
            if (!entity) {
               const existingEntity = currentProject.entities.find(e => e.name.toLowerCase() === entityName.toLowerCase());
               entity = existingEntity ? { ...existingEntity, fields: [] } : { id: uuidv4(), name: entityName, fields: [] };
               newEntitiesMap.set(entityName, entity);
            }

            if (entity.fields.some(f => f.name.toLowerCase() === fieldName.toLowerCase())) {
                errors.push(`Row ${index + 2}: Duplicate field name "${fieldName}" found for entity "${entityName}". Skipping duplicate.`);
                return;
            }

            const field: Field = {
              id: uuidv4(),
              name: fieldName,
              type: row.Type?.trim() || 'string',
              isPK: row.Key?.trim().toUpperCase() === 'PK',
              isFK: row.Key?.trim().toUpperCase() === 'FK',
              notes: row.Notes?.trim() || '',
              fkReference: undefined,
            };

             if (field.isFK) {
                const targetEntityName = row.ForeignKeyEntity?.trim();
                const targetFieldName = row.ForeignKeyField?.trim();
                (field as any)._tempFkTargetEntityName = targetEntityName;
                (field as any)._tempFkTargetFieldName = targetFieldName;
             }

            entity.fields.push(field);
          });

           const finalEntities = Array.from(newEntitiesMap.values());
           finalEntities.forEach(entity => {
                entity.fields.forEach(field => {
                    if ((field as any)._tempFkTargetEntityName && (field as any)._tempFkTargetFieldName) {
                        const targetEntity = finalEntities.find(e => e.name === (field as any)._tempFkTargetEntityName);
                        const targetField = targetEntity?.fields.find(f => f.name === (field as any)._tempFkTargetFieldName);

                        if (targetEntity && targetField) {
                            field.fkReference = {
                                targetEntityId: targetEntity.id,
                                targetFieldId: targetField.id,
                                cardinality: 'many-to-one'
                            };
                        } else {
                            errors.push(`Could not resolve FK reference for ${entity.name}.${field.name}: Target "${(field as any)._tempFkTargetEntityName}.${(field as any)._tempFkTargetFieldName}" not found.`);
                            field.isFK = false;
                        }
                    }
                    delete (field as any)._tempFkTargetEntityName;
                    delete (field as any)._tempFkTargetFieldName;
                });
           });

          if (errors.length > 0) {
            toast({
              title: 'CSV Import completed with warnings',
              description: errors.slice(0, 3).join(' ') + (errors.length > 3 ? '...' : ''),
              variant: 'default',
              duration: 10000
            });
          } else {
             toast({ title: 'CSV imported successfully' });
          }

          setEntities(finalEntities);

        } catch (error: any) {
          console.error("CSV Parsing Error:", error);
          toast({
            title: 'Import failed',
            description: `Failed to process CSV data. ${error.message || ''}`,
            variant: 'destructive',
          });
        }
      },
      error: (error: Error) => {
         console.error("CSV Reading Error:", error);
        toast({
          title: 'Import failed',
          description: `Failed to read CSV file. ${error.message || ''}`,
          variant: 'destructive',
        });
      },
    });

    if (e.target) e.target.value = '';
  };

   const handleExportCSV = () => {
    if (!currentProject) return;

    const rows: Array<Record<string, string | undefined>> = [];
    currentProject.entities.forEach(entity => {
      if (entity.fields.length === 0) {
           rows.push({ Entity: entity.name, Field: '', Type: '', Key: '', Notes: '' });
      } else {
          entity.fields.forEach(field => {
            let fkEntityName: string | undefined = undefined;
            let fkFieldName: string | undefined = undefined;
            if (field.isFK && field.fkReference) {
              const targetEntity = currentProject.entities.find(e => e.id === field.fkReference!.targetEntityId);
              if (targetEntity) {
                fkEntityName = targetEntity.name;
                const targetField = targetEntity.fields.find(f => f.id === field.fkReference!.targetFieldId);
                fkFieldName = targetField?.name;
              }
            }

            rows.push({
              Entity: entity.name,
              Field: field.name,
              Type: field.type,
              Key: field.isPK ? 'PK' : field.isFK ? 'FK' : '',
              Notes: field.notes,
              ForeignKeyEntity: fkEntityName,
              ForeignKeyField: fkFieldName,
            });
          });
      }
    });

    if (rows.length === 0) {
        toast({ title: "Nothing to export", description: "The current project has no entities or fields."});
        return;
    }

    try {
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_erd.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'CSV exported successfully' });
    } catch (error: any) {
        console.error("CSV Export Error:", error);
        toast({ title: 'Export failed', description: error.message || 'Could not generate CSV.', variant: 'destructive'});
    }
  };

  const mermaidCode = useMemo(() => {
    return currentProject ? generateMermaidCode(currentProject.entities) : 'erDiagram';
  }, [currentProject]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading projects...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-base">
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onSelectProject={selectProject}
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
              onAddEntity={handleAddEntityWithToast}
              onDeleteEntity={handleDeleteEntityWithToast}
              onSelectEntity={setSelectedEntityId}
              onAddField={handleAddFieldWithToast}
              onUpdateField={updateField}
              onDeleteField={handleDeleteFieldWithToast}
              onOpenManyToManyDialog={handleOpenManyToManyDialog}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={45} minSize={30}>
            <Visualizer entities={currentProject?.entities || []} mermaidCode={mermaidCode} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={30} minSize={20}>
            <CodePanel
              initialCode={mermaidCode}
              currentEntities={currentProject?.entities || []}
            />
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
              Create a join table to establish a many-to-many relationship between entities. Both entities must have a Primary Key defined.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div>
                <Label className="text-text font-medium">Source Entity</Label>
                <p className='text-sm text-neutral'>{currentProject?.entities.find(e => e.id === manyToManySourceId)?.name || 'N/A'}</p>
             </div>

            <div>
              <Label htmlFor="target-entity" className="text-text">
                Target Entity <span className='text-error'>*</span>
              </Label>
              <Select
                value={manyToManyTargetId}
                onValueChange={(value) => {
                  setManyToManyTargetId(value);
                   const source = currentProject?.entities.find(e => e.id === manyToManySourceId);
                   const target = currentProject?.entities.find(e => e.id === value);
                   if (source && target) {
                        setManyToManyJoinTable(`${source.name}_${target.name}`);
                   }
                }}
              >
                <SelectTrigger className="mt-1 border-neutral" data-testid="select-mm-target">
                  <SelectValue placeholder="Select target entity" />
                </SelectTrigger>
                <SelectContent>
                  {currentProject?.entities
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
                Join Table Name <span className='text-error'>*</span>
              </Label>
              <Input
                id="join-table-name"
                value={manyToManyJoinTable}
                onChange={(e) => setManyToManyJoinTable(e.target.value)}
                placeholder="e.g., Users_Roles"
                className="mt-1 border-neutral focus:border-primary"
                data-testid="input-mm-join-table"
              />
               <p className='text-xs text-neutral mt-1'>This will create a new entity (table).</p>
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
              Create Join Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

