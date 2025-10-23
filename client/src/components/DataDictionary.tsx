import { Entity } from '@/lib/storageService';

interface DataDictionaryProps {
  entities: Entity[];
}

export default function DataDictionary({ entities }: DataDictionaryProps) {
  if (entities.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <p className="text-neutral">No entities defined yet</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-white p-6">
      <table className="w-full border-collapse">
        <thead className="sticky top-0">
          <tr className="bg-secondary text-base">
            <th className="px-4 py-3 text-left font-semibold border border-neutral">Entity</th>
            <th className="px-4 py-3 text-left font-semibold border border-neutral">Field</th>
            <th className="px-4 py-3 text-left font-semibold border border-neutral">Type</th>
            <th className="px-4 py-3 text-left font-semibold border border-neutral">Keys</th>
            <th className="px-4 py-3 text-left font-semibold border border-neutral">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity, entityIndex) =>
            entity.fields.map((field, fieldIndex) => (
              <tr
                key={`${entity.id}-${field.id}`}
                className={entityIndex % 2 === 0 ? 'bg-white' : 'bg-base'}
                data-testid={`row-dictionary-${entity.id}-${field.id}`}
              >
                {fieldIndex === 0 && (
                  <td
                    className="px-4 py-3 border border-neutral font-medium text-text"
                    rowSpan={entity.fields.length}
                  >
                    {entity.name}
                  </td>
                )}
                <td className="px-4 py-3 border border-neutral text-text">{field.name}</td>
                <td className="px-4 py-3 border border-neutral text-text">
                  <span className="px-2 py-1 bg-neutral/20 rounded text-sm">{field.type}</span>
                </td>
                <td className="px-4 py-3 border border-neutral">
                  <div className="flex gap-1">
                    {field.isPK && (
                      <span className="px-2 py-1 bg-info text-white rounded text-xs">PK</span>
                    )}
                    {field.isFK && (
                      <span className="px-2 py-1 bg-warning text-white rounded text-xs">FK</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 border border-neutral text-neutral text-sm">
                  {field.notes || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
