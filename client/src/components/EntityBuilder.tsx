import { useState } from 'react';
import { Entity, Field } from '@/lib/storageService';
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
import { Plus, Trash2, Users } from 'lucide-react';

const DATA_TYPES = ['string', 'int', 'boolean', 'datetime', 'decimal', 'text', 'uuid'];
const CARDINALITY_OPTIONS = ['one-to-one', 'one-to-many'] as const;

interface EntityBuilderProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onAddEntity: (name: string) => void;
  onDeleteEntity: (id: string) => void;
  onSelectEntity: (id: string) => void;
  onAddField: (entityId: string, field: Omit<Field, 'id'>) => void;
  onUpdateField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  onDeleteField: (entityId: string, fieldId: string) => void;
  onAddManyToMany: (entityId: string, targetEntityId: string, joinTableName: string) => void;
}

export default function EntityBuilder({
  entities,
  selectedEntityId,
  onAddEntity,
  onDeleteEntity,
  onSelectEntity,
  onAddField,
  onUpdateField,
  onDeleteField,
  onAddManyToMany,
}: EntityBuilderProps) {
  const [newEntityName, setNewEntityName] = useState('');
  const [newFieldData, setNewFieldData] = useState({
    name: '',
    type: 'string',
    isPK: false,
    isFK: false,
    notes: '',
  });

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  const handleAddEntity = () => {
    if (newEntityName.trim()) {
      onAddEntity(newEntityName.trim());
      setNewEntityName('');
    }
  };

  const handleAddField = () => {
    if (selectedEntityId && newFieldData.name.trim()) {
      onAddField(selectedEntityId, {
        ...newFieldData,
        name: newFieldData.name.trim(),
      });
      setNewFieldData({
        name: '',
        type: 'string',
        isPK: false,
        isFK: false,
        notes: '',
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-text mb-4">Entities</h2>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Entity name (e.g., Users)"
            value={newEntityName}
            onChange={(e) => setNewEntityName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEntity()}
            className="flex-1 border-neutral focus:border-primary"
            data-testid="input-entity-name"
          />
          <Button
            onClick={handleAddEntity}
            className="bg-primary hover:bg-primary/80 text-white"
            data-testid="button-add-entity"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {entities.map(entity => (
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
        </div>
      </div>

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
              onClick={() => {
                const targetEntityId = prompt('Select target entity ID (for demo):');
                if (targetEntityId) {
                  const joinTableName = `${selectedEntity.name}_${entities.find(e => e.id === targetEntityId)?.name || 'Entity'}`;
                  onAddManyToMany(selectedEntity.id, targetEntityId, joinTableName);
                }
              }}
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
                  onValueChange={(value) => setNewFieldData({ ...newFieldData, type: value })}
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
              <Label className="text-sm text-text">Notes (Optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newFieldData.notes}
                onChange={(e) => setNewFieldData({ ...newFieldData, notes: e.target.value })}
                className="border-neutral focus:border-primary min-h-[60px]"
                data-testid="textarea-field-notes"
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

interface FieldRowProps {
  field: Field;
  entities: Entity[];
  currentEntityId: string;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
}

function FieldRow({ field, entities, currentEntityId, onUpdate, onDelete }: FieldRowProps) {
  const otherEntities = entities.filter(e => e.id !== currentEntityId);

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
            {field.notes && (
              <p className="text-sm text-neutral">{field.notes}</p>
            )}
          </div>
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

        {field.isFK && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral">
            <div>
              <Label className="text-xs text-neutral">Related Entity</Label>
              <Select
                value={field.fkReference?.targetEntityId || ''}
                onValueChange={(value) =>
                  onUpdate({
                    fkReference: {
                      ...field.fkReference!,
                      targetEntityId: value,
                      targetFieldId: '',
                      cardinality: field.fkReference?.cardinality || 'one-to-many',
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

            {field.fkReference?.targetEntityId && (
              <>
                <div>
                  <Label className="text-xs text-neutral">Related Field</Label>
                  <Select
                    value={field.fkReference.targetFieldId}
                    onValueChange={(value) =>
                      onUpdate({
                        fkReference: {
                          ...field.fkReference!,
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
                        .find(e => e.id === field.fkReference!.targetEntityId)
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
                    value={field.fkReference.cardinality}
                    onValueChange={(value: typeof CARDINALITY_OPTIONS[number]) =>
                      onUpdate({
                        fkReference: {
                          ...field.fkReference!,
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
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
