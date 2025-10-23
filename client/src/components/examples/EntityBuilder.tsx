import { useState } from 'react';
import EntityBuilder from '../EntityBuilder';
import { Entity } from '@/lib/storageService';

export default function EntityBuilderExample() {
  const [entities, setEntities] = useState<Entity[]>([
    {
      id: '1',
      name: 'Users',
      fields: [
        { id: 'f1', name: 'id', type: 'int', isPK: true, isFK: false, notes: 'Primary key' },
        { id: 'f2', name: 'username', type: 'string', isPK: false, isFK: false, notes: '' },
      ],
    },
    {
      id: '2',
      name: 'Posts',
      fields: [
        { id: 'f3', name: 'id', type: 'int', isPK: true, isFK: false, notes: '' },
        {
          id: 'f4',
          name: 'user_id',
          type: 'int',
          isPK: false,
          isFK: true,
          notes: '',
          fkReference: {
            targetEntityId: '1',
            targetFieldId: 'f1',
            cardinality: 'one-to-many',
          },
        },
      ],
    },
  ]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('1');

  return (
    <EntityBuilder
      entities={entities}
      selectedEntityId={selectedEntityId}
      onAddEntity={(name) => console.log('Add entity:', name)}
      onDeleteEntity={(id) => console.log('Delete entity:', id)}
      onSelectEntity={setSelectedEntityId}
      onAddField={(entityId, field) => console.log('Add field:', entityId, field)}
      onUpdateField={(entityId, fieldId, updates) =>
        console.log('Update field:', entityId, fieldId, updates)
      }
      onDeleteField={(entityId, fieldId) => console.log('Delete field:', entityId, fieldId)}
      onAddManyToMany={(entityId, targetEntityId, joinTableName) =>
        console.log('Add M-M:', entityId, targetEntityId, joinTableName)
      }
    />
  );
}
