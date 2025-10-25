import React, { useCallback, useMemo } from 'react';
import { Entity } from '@/lib/storageService';
import { Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DataDictionaryProps {
  entities: Entity[];
}

export default function DataDictionary({ entities }: DataDictionaryProps) {
  const { toast } = useToast();

  const getTableContent = useCallback(() => {
    const rows: string[] = [];

    entities.forEach(entity => {
      entity.fields.forEach(field => {
        const keys = (field.isPK ? 'PK' : '') + (field.isFK ? (field.isPK ? ', FK' : 'FK') : '');
        const description = field.description || '-';

        // Format: [Entity Name, Field Name, Type, Keys, Notes]
        rows.push([
          entity.name,
          field.name,
          field.type,
          keys,
          description
        ].join('\t')); // Use tab for easy pasting into spreadsheets
      });
    });

    const header = ['Entity', 'Field', 'Type', 'Keys', 'Notes'].join('\t');
    return [header, ...rows].join('\n');
  }, [entities]);

  const handleCopyToClipboard = useCallback(() => {
    const textToCopy = getTableContent();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
      toast({ title: 'Data Dictionary copied to clipboard!', description: 'Content is tab-separated for easy pasting into Excel/Sheets.' });
    } else {
      // Fallback: This is what you would do if you needed a ref-based fallback
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = textToCopy;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
      toast({ title: 'Data Dictionary copied (fallback)!', description: 'Content is tab-separated for easy pasting.' });
    }
  }, [getTableContent, toast]);

  if (entities.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <p className="text-neutral flex items-center gap-2">
          <FileText className="h-5 w-5" />
          No entities defined yet
        </p>
      </div>
    );
  }

  // Use useMemo to generate the structured table rows once
  const tableRows = useMemo(() => {
    return entities.map((entity, entityIndex) =>
      entity.fields.map((field, fieldIndex) => ({
        key: `${entity.id}-${field.id}`,
        entityName: entity.name,
        fieldName: field.name,
        fieldType: field.type,
        isPK: field.isPK,
        isFK: field.isFK,
        description: field.description || '-',
        isNewEntityRow: fieldIndex === 0,
        isEvenRow: entityIndex % 2 === 0,
        rowSpan: entity.fields.length,
      }))
    ).flat();
  }, [entities]);


  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Action Header */}
      <div className="flex justify-between items-center px-6 pt-4 pb-2 border-b border-gray-200">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Data Dictionary
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyToClipboard}
          className="text-primary hover:bg-primary/10 transition-colors"
          title="Copy data as tab-separated text"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Table
        </Button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white shadow-sm border-b border-gray-300 z-10">
            <tr className="text-sm text-neutral/80">
              <th className="px-6 py-3 text-left font-semibold w-1/5">Entity</th>
              <th className="px-6 py-3 text-left font-semibold w-1/5">Field</th>
              <th className="px-6 py-3 text-left font-semibold w-1/12">Type</th>
              <th className="px-6 py-3 text-left font-semibold w-1/12">Keys</th>
              <th className="px-6 py-3 text-left font-semibold w-auto">Notes</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr
                key={row.key}
                className={cn(
                  "border-b border-gray-100 hover:bg-muted/50 transition-colors text-text text-sm",
                  // Use a very light alternating background for better visual grouping
                  row.isEvenRow ? 'bg-white' : 'bg-gray-50'
                )}
                data-testid={`row-dictionary-${row.key}`}
              >
                {/* Entity Column (Row Span) */}
                {row.isNewEntityRow && (
                  <td
                    className="px-6 py-3 font-medium text-text border-r border-gray-200 sticky left-0 bg-white"
                    rowSpan={row.rowSpan}
                  >
                    {row.entityName}
                  </td>
                )}

                {/* Field and Type */}
                <td className="px-6 py-3">{row.fieldName}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 bg-neutral/10 dark:bg-neutral/20 rounded-full text-xs font-mono">{row.fieldType}</span>
                </td>

                {/* Keys */}
                <td className="px-6 py-3">
                  <div className="flex gap-1.5">
                    {row.isPK && (
                      <span className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-semibold">PK</span>
                    )}
                    {row.isFK && (
                      <span className="px-2 py-0.5 bg-warning text-white rounded-full text-xs font-semibold">FK</span>
                    )}
                  </div>
                </td>

                {/* Notes/Description */}
                <td className="px-6 py-3 text-neutral text-sm">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}