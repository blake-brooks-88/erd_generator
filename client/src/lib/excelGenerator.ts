// src/lib/excelGenerator.ts

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Entity } from './storageService'; // Assuming this import path

export function exportDataDictionaryToExcel(entities: Entity[], projectName: string) {
    if (entities.length === 0) {
        console.warn("No entities to export.");
        return;
    }

    const workbook = XLSX.utils.book_new();
    const header = ['Field', 'Type', 'Keys', 'Description'];

    // Define the column widths for a clean look
    const columnWidths = [
        { wch: 25 }, // Field Name
        { wch: 15 }, // Type
        { wch: 8 },  // Keys
        { wch: 60 }  // Description
    ];

    entities.forEach(entity => {
        // 1. Prepare data for the current entity's sheet
        const sheetData = entity.fields.map(field => {
            const keys = (field.isPK ? 'PK' : '') + (field.isFK ? (field.isPK ? ', FK' : 'FK') : '');
            const description = field.description || '';

            // Note: We strip the entity name here, as the sheet name already provides context
            return [
                field.name,
                field.type,
                keys,
                description
            ];
        });

        // 2. Add header row
        const dataWithHeader = [header, ...sheetData];

        // 3. Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(dataWithHeader);

        // Set column widths
        worksheet['!cols'] = columnWidths;

        // Optional: Format header row (Bolding)
        const headerCellStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFE0E0E0" } } }; // Light grey background
        ['A1', 'B1', 'C1', 'D1'].forEach(cellRef => {
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = headerCellStyle;
            }
        });


        // 4. Add the worksheet to the workbook
        // Sheet name is truncated to 31 characters for Excel compatibility
        const sheetName = entity.name.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 5. Generate and download the file
    const filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dictionary.xlsx`;
    XLSX.writeFile(workbook, filename, { compression: true });
}