import { useState } from 'react';
import { Entity, Field, FieldType } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Users, Edit2, Check, X, Search } from 'lucide-react';

// Extended data types to support various database column types
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

interface EntityBuilderProps {
  entities: Entity[];
  selectedEntityId: string | null;
  // CHANGED: Removed onAddEntity since modal will handle full entity creation/save
  onDeleteEntity: (id: string) => void;
  onSelectEntity: (id: string) => void;
  onAddField: (entityId: string, field: Omit<Field, 'id'>) => void;
  onUpdateField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  onDeleteField: (entityId: string, fieldId: string) => void;
  onOpenManyToManyDialog: (entityId: string) => void;
  // NEW PROP: Function to open the entity editor modal for a NEW entity
  onOpenNewEntityModal: () => void;
}

export default function EntityBuilder({
  entities,
  selectedEntityId,
  onDeleteEntity,
  onSelectEntity,
  onAddField,
  onUpdateField,
  onDeleteField,
  onOpenManyToManyDialog,
  onOpenNewEntityModal, // Destructure new prop
}: EntityBuilderProps) {
  // REMOVED: newEntityName state
  // ADDED: State for the search term
  const [searchTerm, setSearchTerm] = useState('');
  const [newFieldData, setNewFieldData] = useState({
    name: '',
    type: 'string' as FieldType,
    isPK: false,
    isFK: false,
    description: '',
  });

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  // REMOVED: handleAddEntity (replaced by onOpenNewEntityModal call)

  const handleAddField = () => {
    if (selectedEntityId && newFieldData.name.trim()) {
      onAddField(selectedEntityId, {
        ...newFieldData,
        name: newFieldData.name.trim(),
        description: newFieldData.description.trim() || undefined,
      });
      setNewFieldData({
        name: '',
        type: 'string',
        isPK: false,
        isFK: false,
        description: '',
      });
    }
  };
  
  // Filtered list of entities
  const filteredEntities = entities.filter(entity => 
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto bg-white p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-text mb-4">Entities</h2>
        
        {/* FIX 1: Search Input implemented */}
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
            <Input
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-neutral focus:border-primary text-text"
                data-testid="input-entity-search"
            />
        </div>
        
        {/* FIX 2: Replaced inline input with a button to open the New Entity Modal */}
        <Button
            onClick={onOpenNewEntityModal} // Calls the prop function to open the modal
            className="w-full bg-primary hover:bg-primary/80 text-white mb-4"
            data-testid="button-add-entity"
        >
            <Plus className="h-4 w-4 mr-2" />
            New Entity
        </Button>

        <div className="space-y-2">
          {filteredEntities.map(entity => (
            <Card
              key={entity.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedEntityId === entity.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-base border-neutral'
              }`}
              onClick={() => onSelectEntity(entity.id)}
              data-testid={`card-entity-${entity.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-text" />
                  <span className="font-medium text-text">{entity.name}</span>
                  <span className="text-sm text-neutral">
                    ({entity.fields.length} fields)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntity(entity.id);
                    }}
                    data-testid={`button-delete-entity-${entity.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {/* No results message */}
          {searchTerm && filteredEntities.length === 0 && (
              <p className="text-neutral text-center py-4">No entities match your search.</p>
          )}

        </div>
      </div>

      {/* --- Fields section is UNCHANGED but included for completeness --- */}
      {selectedEntity && (
        <div className="border-t border-neutral pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text">
              Fields for {selectedEntity.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="bg-accent hover:bg-accent/80 text-white"
              onClick={() => onOpenManyToManyDialog(selectedEntity.id)}
              data-testid="button-add-mm-relationship"
            >
              <Users className="h-4 w-4 mr-2" />
              Add M-M Relationship
            </Button>
          </div>

          <div className="bg-base rounded-lg p-4 space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-text">Field Name</Label>
                <Input
                  placeholder="e.g., id, username"
                  value={newFieldData.name}
                  onChange={(e) => setNewFieldData({ ...newFieldData, name: e.target.value })}
                  className="border-neutral focus:border-primary"
                  data-testid="input-field-name"
                />
              </div>
              <div>
                <Label className="text-sm text-text">Data Type</Label>
                <Select
                  value={newFieldData.type}
                  onValueChange={(value: FieldType) => setNewFieldData({ ...newFieldData, type: value })}
                >
                  <SelectTrigger className="border-neutral" data-testid="select-field-type">
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
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pk-checkbox"
                  checked={newFieldData.isPK}
                  onCheckedChange={(checked) =>
                    setNewFieldData({ ...newFieldData, isPK: checked as boolean })
                  }
                  data-testid="checkbox-pk"
                />
                <Label htmlFor="pk-checkbox" className="text-sm text-text cursor-pointer">
                  Primary Key
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fk-checkbox"
                  checked={newFieldData.isFK}
                  onCheckedChange={(checked) =>
                    setNewFieldData({ ...newFieldData, isFK: checked as boolean })
                  }
                  data-testid="checkbox-fk"
                />
                <Label htmlFor="fk-checkbox" className="text-sm text-text cursor-pointer">
                  Foreign Key
                </Label>
              </div>
            </div>

            <div>
              <Label className="text-sm text-text">Description (Optional)</Label>
              <Textarea
                placeholder="Field description..."
                value={newFieldData.description}
                onChange={(e) => setNewFieldData({ ...newFieldData, description: e.target.value })}
                className="border-neutral focus:border-primary min-h-[60px]"
                data-testid="textarea-field-description"
              />
            </div>

            <Button
              onClick={handleAddField}
              className="w-full bg-primary hover:bg-primary/80 text-white"
              data-testid="button-add-field"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="space-y-2">
            {selectedEntity.fields.map(field => (
              <FieldRow
                key={field.id}
                field={field}
                entities={entities}
                currentEntityId={selectedEntity.id}
                onUpdate={(updates) => onUpdateField(selectedEntity.id, field.id, updates)}
                onDelete={() => onDeleteField(selectedEntity.id, field.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// FieldRow component and its related interfaces remain unchanged
// ... (FieldRow component code goes here) ...

interface FieldRowProps {
  field: Field;
  entities: Entity[];
  currentEntityId: string;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
}

function FieldRow({ field, entities, currentEntityId, onUpdate, onDelete }: FieldRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Field>(field);
  const otherEntities = entities.filter(e => e.id !== currentEntityId);

  const handleStartEdit = () => {
    setEditData(field);
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(field);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="p-4 bg-base border-primary">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-text">Field Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="border-neutral focus:border-primary"
                data-testid={`input-edit-field-name-${field.id}`}
              />
            </div>
            <div>
              <Label className="text-sm text-text">Data Type</Label>
              <Select
                value={editData.type}
                onValueChange={(value: FieldType) => setEditData({ ...editData, type: value })}
              >
                <SelectTrigger className="border-neutral">
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
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-pk-${field.id}`}
                checked={editData.isPK}
                onCheckedChange={(checked) =>
                  setEditData({ ...editData, isPK: checked as boolean })
                }
              />
              <Label htmlFor={`edit-pk-${field.id}`} className="text-sm text-text cursor-pointer">
                Primary Key
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-fk-${field.id}`}
                checked={editData.isFK}
                onCheckedChange={(checked) =>
                  setEditData({ ...editData, isFK: checked as boolean })
                }
              />
              <Label htmlFor={`edit-fk-${field.id}`} className="text-sm text-text cursor-pointer">
                Foreign Key
              </Label>
            </div>
          </div>

          <div>
            <Label className="text-sm text-text">Description</Label>
            <Textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="border-neutral focus:border-primary min-h-[60px]"
              placeholder="Field description..."
            />
          </div>

          {editData.isFK && (
            <div className="space-y-4 pt-2 border-t border-neutral">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-neutral">Related Entity</Label>
                  <Select
                    value={editData.fkReference?.targetEntityId || ''}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        fkReference: {
                          targetEntityId: value,
                          targetFieldId: '',
                          cardinality: editData.fkReference?.cardinality || 'one-to-many',
                          relationshipLabel: editData.fkReference?.relationshipLabel,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs border-neutral">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherEntities.map(entity => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editData.fkReference?.targetEntityId && (
                  <>
                    <div>
                      <Label className="text-xs text-neutral">Related Field</Label>
                      <Select
                        value={editData.fkReference.targetFieldId}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            fkReference: {
                              ...editData.fkReference!,
                              targetFieldId: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs border-neutral">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {entities
                            .find(e => e.id === editData.fkReference!.targetEntityId)
                            ?.fields.map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-neutral">Cardinality</Label>
                      <Select
                        value={editData.fkReference.cardinality}
                        onValueChange={(value: typeof CARDINALITY_OPTIONS[number]) =>
                          setEditData({
                            ...editData,
                            fkReference: {
                              ...editData.fkReference!,
                              cardinality: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs border-neutral">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-to-one">One-to-One</SelectItem>
                          <SelectItem value="one-to-many">One-to-Many</SelectItem>
                          <SelectItem value="many-to-one">Many-to-One</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {/* Relationship Label Input */}
              <div>
                <Label className="text-xs text-neutral">Relationship Label (Optional)</Label>
                <Input
                  placeholder='e.g., "by customer_id", "places", "has"'
                  value={editData.fkReference?.relationshipLabel || ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      fkReference: {
                        ...editData.fkReference!,
                        relationshipLabel: e.target.value,
                      },
                    })
                  }
                  className="h-8 text-xs border-neutral focus:border-primary"
                />
                <p className="text-xs text-neutral mt-1">
                  This label will appear on the relationship line in the diagram
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-neutral hover:bg-neutral/10"
              data-testid={`button-cancel-edit-${field.id}`}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-success hover:bg-success/80 text-white"
              data-testid={`button-save-edit-${field.id}`}
            >
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white border-neutral">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-text">{field.name}</span>
              <span className="text-sm px-2 py-1 bg-neutral/20 text-text rounded">
                {field.type}
              </span>
              {field.isPK && (
                <span className="text-xs px-2 py-1 bg-info text-white rounded">PK</span>
              )}
              {field.isFK && (
                <span className="text-xs px-2 py-1 bg-warning text-white rounded">FK</span>
              )}
            </div>
            {field.description && (
              <p className="text-sm text-neutral">{field.description}</p>
            )}
            {field.isFK && field.fkReference?.relationshipLabel && (
              <p className="text-xs text-primary mt-1">
                Relationship: "{field.fkReference.relationshipLabel}"
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={handleStartEdit}
              data-testid={`button-edit-field-${field.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-error hover:bg-error/10"
              onClick={onDelete}
              data-testid={`button-delete-field-${field.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}