import { Entity } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Users, Hash, Link, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useMemo } from 'react';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities;

    const query = searchQuery.toLowerCase();
    return entities.filter(entity =>
      entity.name.toLowerCase().includes(query) ||
      entity.fields.some(field => field.name.toLowerCase().includes(query))
    );
  }, [entities, searchQuery]);

  return (
    <div className="pt-4 px-4 bg-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-bold text-text">Data Entities</h3>
        <Button
          onClick={onOpenNewEntityModal}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-3 px-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral" />
        <Input
          type="text"
          placeholder="Search entities or fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-base border-border focus:border-secondary"
        />
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto">
        {filteredEntities.map((entity) => {
          const relationshipCount = entity.fields.filter(f => f.isFK).length;
          const isSelected = selectedEntityId === entity.id;

          return (
            <div
              key={entity.id}
              onClick={() => onEntityClick(entity.id)}
              className={cn(
                "py-3 px-5 cursor-pointer transition-colors duration-150 group flex items-center justify-between",
                "border-b border-border",
                "hover:bg-base",
              )}
            >
              <div className="flex items-start space-x-3 min-w-0">
                {/* Icon */}
                <Users
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors mt-0.5",
                  )}
                />

                <div className="flex flex-col min-w-0 flex-grow">
                  {/* Primary Text (Entity Name) */}
                  <div className="font-semibold text-text leading-tight truncate">{entity.name}</div>

                  {/* Metadata: Stacked and Compact */}
                  <div className="text-xs text-muted-foreground mt-1 flex flex-col space-y-0.5">

                    {/* Field Count Metadata */}
                    <div className="flex items-center">
                      <Hash className="h-3 w-3 mr-1 text-neutral/80 flex-shrink-0" />
                      <span className="truncate">{entity.fields.length} Fields</span>
                    </div>

                    {/* Relationship Count Metadata */}
                    <div className="flex items-center">
                      <Link className="h-3 w-3 mr-1 text-neutral/80 flex-shrink-0" />
                      <span className="truncate">{relationshipCount} Relationships</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="transition-opacity duration-300 ml-4 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-error/70 hover:text-error hover:bg-error/10 h-8 w-8",
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntity(entity.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {filteredEntities.length === 0 && searchQuery && (
          <p className="text-center text-neutral py-4 text-sm">No entities match your search.</p>
        )}
        {entities.length === 0 && !searchQuery && (
          <p className="text-center text-neutral py-4 text-sm">No entities created yet.</p>
        )}
      </div>
    </div>
  );
}