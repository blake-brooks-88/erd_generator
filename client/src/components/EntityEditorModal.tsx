import { useState, useEffect, useRef } from 'react';
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
import { Trash2, ChevronDown, ChevronRight, Users, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
// Dummy cn utility, replace with your actual utility if different
// FIX: Explicitly typed the rest parameter to resolve TypeScript error (ts(7019))
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

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
  
  // Ref to the scrollable container for smooth scrolling
  const fieldListRef = useRef<HTMLDivElement>(null); 
  
  // REMOVED: contentHeight state
  // REMOVED: contentWrapperRef ref

  useEffect(() => {
    if (entity && isOpen) {
      setEditedEntity(JSON.parse(JSON.stringify(entity)));
      setEntityName(entity.name);
      setExpandedFKRows([]);
    }
  }, [entity, isOpen]);

  // REMOVED: Effect to measure content/set height control

  // Effect to scroll to the bottom when a field is added (or deleted)
  useEffect(() => {
    if (fieldListRef.current) {
      fieldListRef.current.scrollTo({
        top: fieldListRef.current.scrollHeight,
        behavior: 'smooth', // This provides the gentle scrolling effect
      });
    }
  }, [editedEntity?.fields.length]); // Trigger when the number of fields changes


  if (!editedEntity || !entity) return null;

  const otherEntities = entities.filter(e => e.id !== entity.id);

  // SIMPLIFIED: Add field logic to immediately update state
  const handleAddField = () => {
    const newField: Field = {
      id: uuidv4(),
      name: '',
      type: 'string',
      isPK: false,
      isFK: false,
    };

    // No need for height checks or setTimeouts with fixed modal height
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
    // This will cause the scroll effect to trigger and smooth scroll up if needed
  };

  const toggleFKExpanded = (fieldId: string) => {
    if (expandedFKRows.includes(fieldId)) {
      setExpandedFKRows(expandedFKRows.filter(id => id !== fieldId));
    } else {
      setExpandedFKRows([...expandedFKRows, fieldId]);
    }
  };

  const handleSave = () => {
    const cleanedName = entityName.replace(/\u00A0/g, ' ').trim();

    if (!cleanedName) {
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
      name: cleanedName,
    });
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        // FIXED HEIGHT: Set a fixed height (80vh) and removed all height transitions 
        // to stop the jumpy growing behavior.
        className="max-w-5xl h-[80vh] overflow-hidden flex flex-col bg-page-bg rounded-xl shadow-2xl"
      >
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between pr-6">
            <div className="flex-1">
              <Label className="text-sm text-neutral font-medium mb-1 tracking-wider">ENTITY NAME</Label>
              <Input
                value={entityName}
                onChange={(e) => {
                  // Replace non-breaking spaces (U+00A0) with regular spaces
                  const newName = e.target.value.replace(/\u00A0/g, ' ');
                  setEntityName(newName);
                }}
                // Branded Input Styling
                className="text-2xl font-bold text-text border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-10 p-2"
                placeholder="Entity name"
              />
            </div>
          </div>
          <DialogDescription className="text-neutral pt-1">
            Define fields and relationships for the <span className="font-semibold text-primary">{entity.name}</span> entity.
          </DialogDescription>
        </DialogHeader>

        {/* Content Wrapper (now simple flex container) */}
        <div 
            // REMOVED: ref={contentWrapperRef} and height style
            className="flex flex-col flex-1 overflow-hidden" 
        >
            {/* FIELD HEADERS - High Contrast, Techy Look */}
            <div className="grid grid-cols-12 gap-2 px-4 pt-4 pb-3 border-b-2 border-primary text-sm font-semibold text-text uppercase tracking-wide bg-base/50">
                <div className="col-span-3">Field Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-center">PK</div>
                <div className="col-span-1 text-center">FK</div>
                <div className="col-span-1"></div>
            </div>
            {/* END STATIC HEADERS */}

            {/* FIELD LIST - Scrollable area - REF APPLIED HERE */}
            <div ref={fieldListRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-3">

            {editedEntity.fields.map((field, index) => (
                <div 
                key={field.id} 
                // Field entrance animation for smooth row appearance
                className="space-y-2 relative animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                >
                
                <div
                    className={cn(
                    `grid grid-cols-12 gap-2 p-3 border border-border rounded-lg transition-all duration-200 shadow-sm`,
                    expandedFKRows.includes(field.id) ? 'bg-base shadow-lg' : 'bg-page-bg hover:bg-base hover:shadow-md'
                    )}
                >
                    <div className="col-span-3">
                    <Input
                        value={field.name}
                        onChange={(e) => {
                        // Replace spaces with underscores to ensure valid Mermaid syntax
                        const newName = e.target.value.replace(/\s+/g, '_');
                        handleUpdateField(field.id, { name: newName });
                        }}
                        placeholder="field_name"
                        className="h-9 text-sm border-border focus:border-secondary transition-all duration-200"
                    />
                    </div>

                    <div className="col-span-2">
                    <Select
                        value={field.type}
                        onValueChange={(value: FieldType) =>
                        handleUpdateField(field.id, { type: value })
                        }
                    >
                        <SelectTrigger className="h-9 text-sm border-border focus:border-secondary transition-all duration-200">
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
                        className="h-9 text-sm border-border focus:border-secondary transition-all duration-200"
                    />
                    </div>

                    {/* PK Checkbox - Accent (Green) */}
                    <div className="col-span-1 flex items-center justify-center">
                    <Checkbox
                        checked={field.isPK}
                        onCheckedChange={(checked: boolean) =>
                        handleUpdateField(field.id, { isPK: checked as boolean })
                        }
                        className="data-[state=checked]:bg-accent data-[state=checked]:border-accent transition-colors duration-200"
                    />
                    </div>

                    {/* FK Checkbox - Warning (Orange/Primary) */}
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
                        className="data-[state=checked]:bg-warning data-[state=checked]:border-warning transition-colors duration-200"
                    />
                    {field.isFK && (
                        <button
                        onClick={() => toggleFKExpanded(field.id)}
                        className="text-secondary hover:text-primary transition-colors duration-200"
                        >
                        {expandedFKRows.includes(field.id) ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        </button>
                    )}
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteField(field.id)}
                        className="h-8 w-8 p-0 text-error/70 hover:text-error hover:bg-error/10 transition-colors duration-200"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                </div> 

                {field.isFK && expandedFKRows.includes(field.id) && (
                    <div 
                    className="ml-0 md:ml-12 mr-0 md:mr-2 p-4 bg-base border border-secondary/50 rounded-lg space-y-3 transition-all duration-300 animate-in fade-in-0 slide-in-from-top-1"
                    >
                    <h6 className="text-sm font-semibold text-secondary border-b border-border pb-2">Relationship Details</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                            <SelectTrigger className="h-9 text-sm border-border">
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
                            <SelectTrigger className="h-9 text-sm border-border">
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
                            <SelectTrigger className="h-9 text-sm border-border">
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
                        className="h-9 text-sm border-border focus:border-secondary"
                        />
                        <p className="text-xs text-neutral mt-1">
                        This label will appear on the relationship line in the diagram
                        </p>
                    </div>
                    </div>
                )}
                </div>
            ))}

            {editedEntity.fields.length === 0 && (
                <div className="text-center py-8 text-neutral border border-dashed border-border rounded-lg bg-base">
                No fields defined. Click "Add Field" to start building your schema!
                </div>
            )}
            </div>
        </div>

        <DialogFooter className="flex items-center justify-between p-4 border-t border-border">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleAddField}
              // Secondary Color for internal entity action
              className="text-secondary border-secondary hover:bg-secondary/10 hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenManyToManyDialog(entity.id)}
              // Accent Color for specialized action
              className="text-accent border-accent hover:bg-accent/10 hover:shadow-md transition-all duration-200"
            >
              <Users className="h-4 w-4 mr-2" />
              Add M-M Relationship
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="hover:bg-base transition-colors duration-200">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              // Primary Color for final CTA
              className="bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EntityEditorModal;
