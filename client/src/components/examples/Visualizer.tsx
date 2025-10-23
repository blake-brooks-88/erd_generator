import Visualizer from '../Visualizer';
import { Entity } from '@/lib/storageService';

export default function VisualizerExample() {
  const entities: Entity[] = [
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
  ];

  const mermaidCode = `erDiagram
  Users {
    int id PK
    string username 
  }
  Posts {
    int id PK
    int user_id FK
  }
  Posts }o--|| Users : ""`;

  return <Visualizer entities={entities} mermaidCode={mermaidCode} />;
}
