import { useState, useEffect } from 'react';
import { Entity, Field, FieldType } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
// import { Textarea } from '@/components/ui/textarea'; // No longer used
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, ChevronDown, ChevronRight, Users, Plus } from 'lucide-react'; // Removed GripVertical, X
import { v4 as uuidv4 } from 'uuid';

const DATA_TYPES: FieldType[] = [
  'string',
  'text',
  'int',
  'float',
  'number',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'timestamp',
  'json',
  'jsonb',
  'uuid',
  'enum',
  'phone',
  'email',
];

const CARDINALITY_OPTIONS = ['one-to-one', 'one-to-many', 'many-to-one'] as const;

interface EntityEditorModalProps {
  entity: Entity | null;
  entities: Entity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntity: Entity) => void;
  onOpenManyToManyDialog: (entityId: string) => void;
}

export function EntityEditorModal({
  entity,
  entities,
  isOpen,
  onClose,
  onSave,
  onOpenManyToManyDialog,
}: EntityEditorModalProps) {
  const [editedEntity, setEditedEntity] = useState<Entity | null>(null);
  const [entityName, setEntityName] = useState('');
  const [expandedFKRows, setExpandedFKRows] = useState<string[]>([]);
  // Removed drag-related states

  useEffect(() => {
    if (entity && isOpen) {
      setEditedEntity(JSON.parse(JSON.stringify(entity)));
      setEntityName(entity.name);
      setExpandedFKRows([]);
    }
  }, [entity, isOpen]);

  if (!editedEntity || !entity) return null;

  const otherEntities = entities.filter(e => e.id !== entity.id);

  const handleAddField = () => {
    const newField: Field = {
      id: uuidv4(),
      name: '',
      type: 'string',
      isPK: false,
      isFK: false,
    };

    setEditedEntity({
      ...editedEntity,
      fields: [...editedEntity.fields, newField],
    });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<Field>) => {
    setEditedEntity({
      ...editedEntity,
      fields: editedEntity.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const handleDeleteField = (fieldId: string) => {
    setEditedEntity({
      ...editedEntity,
      fields: editedEntity.fields.filter(f => f.id !== fieldId),
    });
  };

  const toggleFKExpanded = (fieldId: string) => {
    if (expandedFKRows.includes(fieldId)) {
      setExpandedFKRows(expandedFKRows.filter(id => id !== fieldId));
    } else {
      setExpandedFKRows([...expandedFKRows, fieldId]);
    }
  };

  const handleSave = () => {
    // Replace non-breaking spaces (U+00A0) with regular spaces, then trim.
    const cleanedName = entityName.replace(/\u00A0/g, ' ').trim();

    if (!cleanedName) { // Use cleanedName
      console.error('Entity name cannot be empty');
      return;
    }

    const invalidFields = editedEntity.fields.filter(f => !f.name.trim());
    if (invalidFields.length > 0) {
      console.error('All fields must have a name');
      return;
    }

    onSave({
      ...editedEntity,
      name: cleanedName, // Save the cleanedName
    });
  };

  const handleCancel = () => {
    onClose();
  };

  // Removed all drag-and-drop handlers

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex-1">
              <Label className="text-sm text-neutral mb-1">Entity Name</Label>
              <Input
                value={entityName}
                onChange={(e) => {
                  // Replace non-breaking spaces (U+00A0) with regular spaces
                  const newName = e.target.value.replace(/\u00A0/g, ' ');
                  setEntityName(newName);
                }}
                className="text-xl font-semibold border-neutral focus:border-primary"
                placeholder="Entity name"
              />
            </div>
          </div>
          <DialogDescription>
            Edit fields for this entity. Click FK checkbox to set relationships.
          </DialogDescription>
        </DialogHeader>

        {/* STATIC HEADERS */}
        <div className="grid grid-cols-12 gap-2 px-2 pt-4 pb-2 border-b border-neutral text-xs font-medium text-neutral">
          {/* Removed col-span-1 for drag handle */}
          <div className="col-span-3">Field Name</div> {/* Adjusted to col-span-3 */}
          <div className="col-span-2">Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1 text-center">PK</div>
          <div className="col-span-1 text-center">FK</div>
          <div className="col-span-1"></div>
        </div>
        {/* END STATIC HEADERS */}

        <div className="flex-1 overflow-y-auto space-y-2 px-2 pt-2 pb-4">
          {/* Headers removed from here */}

          {editedEntity.fields.map((field, index) => (
            <div 
              key={field.id} 
              className="space-y-2 relative"
              // Removed drag event handlers
            >
              {/* Removed Drop Indicator */}
              
              <div
                className={`grid grid-cols-12 gap-2 p-2 bg-white border-2 rounded transition-all hover:bg-base border-neutral`}
                // Removed drag-related classes and event handlers
              >
                {/* Removed drag handle div */}

                <div className="col-span-3"> {/* Adjusted to col-span-3 */}
                  <Input
                    value={field.name}
                    onChange={(e) => {
                      // Replace spaces with underscores to ensure valid Mermaid syntax
                      const newName = e.target.value.replace(/\s+/g, '_');
                      handleUpdateField(field.id, { name: newName });
                    }}
                    placeholder="field_name"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <Select
                    value={field.type}
                    onValueChange={(value: FieldType) =>
                      handleUpdateField(field.id, { type: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4">
                  <Input
                    value={field.description || ''}
                    onChange={(e) => {
                      // Sanitize input: replace newlines with a space, and double quotes with single quotes
                      const sanitizedDescription = e.target.value
                        .replace(/(\r\n|\n|\r)/gm, " ") // Replace newlines with space
                        .replace(/"/g, "'"); // Replace double quotes with single
                      handleUpdateField(field.id, { description: sanitizedDescription });
                    }}
                    placeholder="Field description..."
                    className="h-8 text-sm"
                  />
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <Checkbox
                    checked={field.isPK}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateField(field.id, { isPK: checked as boolean })
                    }
                  />
                </div>

                <div className="col-span-1 flex items-center justify-center gap-1">
                  <Checkbox
                    checked={field.isFK}
                    onCheckedChange={(checked: boolean) => {
                      const isFK = checked as boolean;
                      handleUpdateField(field.id, {
                        isFK,
                        fkReference: isFK
                          ? {
                              targetEntityId: '',
                              targetFieldId: '',
                              cardinality: 'many-to-one',
                            }
                          : undefined,
                      });
                      if (isFK) {
                        setExpandedFKRows([...expandedFKRows, field.id]);
                      } else {
                        setExpandedFKRows(expandedFKRows.filter(id => id !== field.id));
                      }
                    }}
                  />
                  {field.isFK && (
                    <button
                      onClick={() => toggleFKExpanded(field.id)}
                      className="text-neutral hover:text-primary"
                    >
                      {expandedFKRows.includes(field.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                    className="h-8 w-8 p-0 text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div> 

              {field.isFK && expandedFKRows.includes(field.id) && (
                <div className="ml-12 mr-2 p-3 bg-base border border-neutral rounded space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-neutral">Related Entity</Label>
                      <Select
                        value={field.fkReference?.targetEntityId || ''}
                        onValueChange={(value: string) =>
                          handleUpdateField(field.id, {
                            fkReference: {
                              targetEntityId: value,
                              targetFieldId: '',
                              cardinality: field.fkReference?.cardinality || 'many-to-one',
                              relationshipLabel: field.fkReference?.relationshipLabel,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select entity" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherEntities.map(e => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {field.fkReference?.targetEntityId && (
                      <div>
                        <Label className="text-xs text-neutral">Related Field</Label>
                        <Select
                          value={field.fkReference.targetFieldId || ''}
                          onValueChange={(value: string) =>
                            handleUpdateField(field.id, {
                              fkReference: {
                                ...field.fkReference!,
                                targetFieldId: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {entities
                              .find(e => e.id === field.fkReference!.targetEntityId)
                              ?.fields.map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {field.fkReference?.targetEntityId && (
                      <div>
                        <Label className="text-xs text-neutral">Cardinality</Label>
                        <Select
                          value={field.fkReference.cardinality || 'many-to-one'}
                          onValueChange={(value: (typeof CARDINALITY_OPTIONS)[number]) =>
                            handleUpdateField(field.id, {
                              fkReference: {
                                ...field.fkReference!,
                                cardinality: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one-to-one">One-to-One</SelectItem>
                            <SelectItem value="one-to-many">One-to-Many</SelectItem>
                            <SelectItem value="many-to-one">Many-to-One</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-neutral">
                      Relationship Label (Optional)
                    </Label>
                    <Input
                      placeholder='e.g., "by customer_id", "places", "has"'
                      value={field.fkReference?.relationshipLabel || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdateField(field.id, {
                          fkReference: {
                            ...field.fkReference!,
                            relationshipLabel: e.target.value,
                          },
                        })
                      }
                      className="h-8 text-xs"
                    />
                    <p className="text-xs text-neutral mt-1">
                      This label will appear on the relationship line in the diagram
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Removed bottom drop zone */}

          {editedEntity.fields.length === 0 && (
            <div className="text-center py-8 text-neutral">
              No fields yet. Click "Add Field" to get started.
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAddField}
              className="text-primary border-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenManyToManyDialog(entity.id)}
              className="text-accent border-accent hover:bg-accent/10"
            >
              <Users className="h-4 w-4 mr-2" />
              Add M-M Relationship
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/80">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EntityEditorModal;

