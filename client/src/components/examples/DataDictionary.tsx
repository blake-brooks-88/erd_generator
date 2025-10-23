import DataDictionary from '../DataDictionary';
import { Entity } from '@/lib/storageService';

export default function DataDictionaryExample() {
  const entities: Entity[] = [
    {
      id: '1',
      name: 'Users',
      fields: [
        { id: 'f1', name: 'id', type: 'int', isPK: true, isFK: false, notes: 'Primary key' },
        { id: 'f2', name: 'username', type: 'string', isPK: false, isFK: false, notes: 'Unique username' },
        { id: 'f3', name: 'email', type: 'string', isPK: false, isFK: false, notes: 'User email address' },
      ],
    },
    {
      id: '2',
      name: 'Posts',
      fields: [
        { id: 'f4', name: 'id', type: 'int', isPK: true, isFK: false, notes: 'Primary key' },
        { id: 'f5', name: 'user_id', type: 'int', isPK: false, isFK: true, notes: 'References Users.id' },
        { id: 'f6', name: 'title', type: 'string', isPK: false, isFK: false, notes: 'Post title' },
        { id: 'f7', name: 'content', type: 'text', isPK: false, isFK: false, notes: 'Post content' },
      ],
    },
  ];

  return <DataDictionary entities={entities} />;
}
