import { Entity, Field } from '@/lib/storageService';
import { v4 as uuidv4 } from 'uuid';

export function validateMermaidCode(code: string): boolean {
    return /^\s*erDiagram/.test(code.trim());
}

export function parseMermaidCode(code: string): { entities: Entity[] } | { error: string } {
    if (!validateMermaidCode(code)) {
        return { error: "Invalid Mermaid ERD code: Must start with 'erDiagram'." };
    }

    const lines = code.split('\n');
    const entitiesMap = new Map<string, Entity>();
    let currentEntityName: string | null = null;
    let insideEntityBlock = false;

    const entityRegex = /^\s*([a-zA-Z0-9_]+)\s*(\{|\[|\|\|)?\s*$/;
    const fieldRegex = /^\s*([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)/;
    const blockStartRegex = /\{/;
    const blockEndRegex = /\}/;

    try {
        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.length === 0 || trimmedLine.startsWith('erDiagram') || trimmedLine.startsWith('--')) {
                continue;
            }

            if (trimmedLine.includes('}|--||') || trimmedLine.includes('||--||') || trimmedLine.includes('||--o{') || trimmedLine.includes('}|--o{') || trimmedLine.includes('o{--||') || trimmedLine.includes('o{--|}')) {
                continue;
            }


            const entityMatch = trimmedLine.match(entityRegex);

             if (entityMatch && !trimmedLine.includes('{') && !insideEntityBlock) {
                 const name = entityMatch[1];
                 if (!entitiesMap.has(name)) {
                     entitiesMap.set(name, { id: uuidv4(), name: name, fields: [] });
                 }
                 continue;
             }

             if (entityMatch && trimmedLine.includes('{') && !insideEntityBlock) {
                 currentEntityName = entityMatch[1];
                 if (!entitiesMap.has(currentEntityName)) {
                     entitiesMap.set(currentEntityName, {
                         id: uuidv4(),
                         name: currentEntityName,
                         fields: [],
                     });
                 }
                 insideEntityBlock = true;
                 continue;
             }

             if (trimmedLine.match(blockEndRegex) && insideEntityBlock) {
                 insideEntityBlock = false;
                 currentEntityName = null;
                 continue;
             }

             if (insideEntityBlock && currentEntityName && entitiesMap.has(currentEntityName)) {
                 const fieldMatch = trimmedLine.match(fieldRegex);
                 if (fieldMatch) {
                    const entity = entitiesMap.get(currentEntityName)!;
                    const fieldType = fieldMatch[1];
                    const fieldName = fieldMatch[2];

                     if (!entity.fields.some(f => f.name === fieldName)) {
                        const field: Field = {
                            id: uuidv4(),
                            name: fieldName,
                            type: fieldType,
                            isPK: false,
                            isFK: false,
                            notes: '',
                        };
                        entity.fields.push(field);
                     }
                 }
            }
        }

        return { entities: Array.from(entitiesMap.values()) };

    } catch (e) {
        console.error("Error parsing Mermaid code:", e);
        return { error: "Failed to parse Mermaid code. Check syntax." };
    }
}

