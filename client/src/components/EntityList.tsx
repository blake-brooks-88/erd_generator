import { Entity } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface EntityListProps {
  entities: Entity[];
  selectedEntityId?: string | null;
  onDeleteEntity: (entityId: string) => void;
  onEntityClick: (entityId: string) => void;
  onOpenNewEntityModal: () => void;
  onSelectEntity: (entityId: string | null) => void;
}

export function EntityList({ 
  entities, 
  selectedEntityId,
  onEntityClick, 
  onOpenNewEntityModal,
  onDeleteEntity 
}: EntityListProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Entities</h3>
        <Button onClick={onOpenNewEntityModal} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {entities.map((entity) => (
          <div
            key={entity.id}
            onClick={() => onEntityClick(entity.id)}
            className={`p-3 border border-border rounded-lg hover:bg-accent cursor-pointer ${
              selectedEntityId === entity.id ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{entity.name}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEntity(entity.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {entity.fields.length} fields
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
