import { Entity } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Users, Search } from 'lucide-react'; // Import Search icon
import { useState } from 'react';

// UPDATED: Interface to match props passed from Home.tsx
interface EntityListProps {
  entities: Entity[];
  selectedEntityId: string | null; // Needed to highlight the selected entity
  onDeleteEntity: (id: string) => void;
  onEntityClick: (id: string) => void;
  onSelectEntity: (id: string | null) => void; // New: Function to set selectedEntityId
  onOpenNewEntityModal: () => void; // New: Replaces inline onAddEntity
}

export function EntityList(props: EntityListProps) {
  const { 
    entities, 
    selectedEntityId, // Destructure new prop
    onDeleteEntity, 
    onEntityClick, 
    onOpenNewEntityModal, // Destructure new prop
    onSelectEntity, // Destructure new prop
  } = props;
  
  // REMOVED: newEntityName state
  // ADDED: State for the search term
  const [searchTerm, setSearchTerm] = useState('');

  // REMOVED: handleAddEntity (replaced by onOpenNewEntityModal)

  // Filtered list of entities
  const filteredEntities = entities.filter(entity => 
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Helper to handle entity click and selection
  const handleEntitySelection = (entityId: string) => {
    onSelectEntity(entityId); // Update local state in Home.tsx
    onEntityClick(entityId); // Open the modal
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-text mb-4">Entities</h2>
        
        {/* ADDED: Search Input */}
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

        {/* UPDATED: Button now opens modal */}
        <Button
            onClick={onOpenNewEntityModal} 
            className="w-full bg-primary hover:bg-primary/80 text-white mb-4"
            data-testid="button-add-entity"
        >
            <Plus className="h-4 w-4 mr-2" />
            New Entity
        </Button>

        <div className="space-y-2">
          {entities.length === 0 && !searchTerm && (
            <div className="text-center py-8 text-neutral text-sm">
              No entities yet. Add your first entity to get started.
            </div>
          )}
          
          {searchTerm && filteredEntities.length === 0 && (
              <div className="text-center py-4 text-neutral text-sm">
                  No entities match your search.
              </div>
          )}

          {filteredEntities.map(entity => (
            <Card
              key={entity.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedEntityId === entity.id // Highlight if selected
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-base border-neutral hover:border-primary'
              }`}
              onClick={() => handleEntitySelection(entity.id)}
              data-testid={`card-entity-${entity.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-text" />
                  <div>
                    <span className="font-medium text-text">{entity.name}</span>
                    <span className="text-sm text-neutral ml-2">
                      ({entity.fields.length} field{entity.fields.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
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
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}