import { Entity, Field, FieldType } from './storageService';
import { v4 as uuidv4 } from 'uuid';

export interface ParseResult {
  entities: Entity[];
}

export interface ParseError {
  error: string;
}

/**
 * Parses Mermaid erDiagram code and extracts entities with fields, descriptions, and relationships
 */
export function parseMermaidCode(code: string): ParseResult | ParseError {
  try {
    const lines = code.split('\n').map(line => line.trim());
    
    // Find the erDiagram declaration
    const erDiagramIndex = lines.findIndex(line => line.startsWith('erDiagram'));
    if (erDiagramIndex === -1) {
      return { error: 'No erDiagram declaration found' };
    }

    const entities: Entity[] = [];
    const entityMap = new Map<string, Entity>();
    const relationships: Array<{
      from: string;
      to: string;
      label?: string;
    }> = [];

    let currentEntity: Entity | null = null;
    let inEntityBlock = false;

    for (let i = erDiagramIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines and comments
      if (!line || line.startsWith('%%')) {
        continue;
      }

      // Skip frontmatter/config blocks
      if (line.startsWith('---') || line.startsWith('%%{')) {
        continue;
      }

      // Check for entity definition start (entity name followed by opening brace)
      const entityMatch = line.match(/^["']?([a-zA-Z0-9_-]+)["']?\s*\{/);
      if (entityMatch) {
        const entityName = entityMatch[1];
        currentEntity = {
          id: uuidv4(),
          name: entityName,
          fields: []
        };
        inEntityBlock = true;
        continue;
      }

      // Check for entity block end
      if (line === '}' && inEntityBlock && currentEntity) {
        entities.push(currentEntity);
        entityMap.set(currentEntity.name, currentEntity);
        currentEntity = null;
        inEntityBlock = false;
        continue;
      }

      // Parse field within entity block
      if (inEntityBlock && currentEntity) {
        const field = parseFieldLine(line);
        if (field) {
          currentEntity.fields.push(field);
        }
        continue;
      }

      // Parse relationships (outside entity blocks)
      const relationship = parseRelationshipLine(line);
      if (relationship) {
        relationships.push(relationship);
      }
    }

    // Apply relationship labels to FK fields
    applyRelationshipLabels(entities, relationships, entityMap);

    if (entities.length === 0) {
      return { error: 'No entities found in the diagram' };
    }

    return { entities };
  } catch (error) {
    return {
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parses a single field line from within an entity block
 * Format: type fieldName [PK|FK] ["description"]
 * Examples:
 *   string order_id PK "Unique Order ID"
 *   int quantity
 *   datetime created_at "Timestamp of creation"
 */
function parseFieldLine(line: string): Field | null {
  // Remove leading/trailing whitespace
  line = line.trim();
  
  if (!line) return null;

  // Match pattern: type name [PK|FK] ["description"]
  const fieldPattern = /^([\w]+)\s+["']?([a-zA-Z0-9_-]+)["']?(?:\s+(PK|FK|UNIQUE|NOT\s+NULL))*\s*(?:"([^"]*)")?/;
  const match = line.match(fieldPattern);

  if (!match) return null;

  const [, type, name, keyModifier, description] = match;

  // Determine if it's a PK or FK
  const isPK = line.toUpperCase().includes('PK');
  const isFK = line.toUpperCase().includes('FK');

  // Validate and normalize field type
  const fieldType = normalizeFieldType(type);

  const field: Field = {
    id: uuidv4(),
    name: name,
    type: fieldType,
    isPK: isPK,
    isFK: isFK,
  };

  // Add description if present
  if (description) {
    field.description = description;
  }

  // Initialize fkReference if it's an FK (will be populated later)
  if (isFK) {
    field.fkReference = {
      targetEntityId: 'UNKNOWN',
      targetFieldId: 'UNKNOWN',
      cardinality: 'many-to-one'
    };
  }

  return field;
}

/**
 * Normalizes field type to match our FieldType union
 */
function normalizeFieldType(type: string): FieldType {
  const normalized = type.toLowerCase();
  
  // Map common variations to our standard types
  const typeMap: Record<string, FieldType> = {
    'str': 'string',
    'varchar': 'string',
    'char': 'string',
    'integer': 'int',
    'bigint': 'int',
    'smallint': 'int',
    'double': 'float',
    'real': 'float',
    'bool': 'boolean',
    'time': 'timestamp',
  };

  const mappedType = typeMap[normalized];
  if (mappedType) return mappedType;

  // Check if it's one of our valid types
  const validTypes: FieldType[] = [
    'string', 'text', 'int', 'float', 'number', 'decimal',
    'boolean', 'date', 'datetime', 'timestamp', 'json', 'jsonb',
    'uuid', 'enum', 'phone', 'email'
  ];

  if (validTypes.includes(normalized as FieldType)) {
    return normalized as FieldType;
  }

  // Default to string if unknown
  return 'string';
}

/**
 * Parses a relationship line
 * Format: entity1 ||--o{ entity2 : "label"
 */
function parseRelationshipLine(line: string): { from: string; to: string; label?: string } | null {
  const relationshipPattern = /^["']?([a-zA-Z0-9_-]+)["']?\s+[\|\}o][|\-o\{]+[\|\}o]\s+["']?([a-zA-Z0-9_-]+)["']?(?:\s*:\s*"([^"]+)")?/;
  const match = line.match(relationshipPattern);

  if (!match) return null;

  const [, from, to, label] = match;

  return {
    from,
    to,
    label: label || undefined
  };
}

/**
 * Applies relationship labels to FK fields
 */
function applyRelationshipLabels(
  entities: Entity[],
  relationships: Array<{ from: string; to: string; label?: string }>,
  entityMap: Map<string, Entity>
) {
  for (const rel of relationships) {
    const fromEntity = entityMap.get(rel.from);
    const toEntity = entityMap.get(rel.to);

    if (!fromEntity || !toEntity) continue;

    // Find FK fields in fromEntity that might reference toEntity
    for (const field of fromEntity.fields) {
      if (field.isFK && field.fkReference) {
        const fieldNameLower = field.name.toLowerCase();
        const toEntityNameLower = toEntity.name.toLowerCase();

        if (
          fieldNameLower.includes(toEntityNameLower) ||
          fieldNameLower.includes('id') ||
          fieldNameLower === toEntityNameLower.replace(/_/g, '') + 'id'
        ) {
          field.fkReference.targetEntityId = toEntity.id;
          
          const targetPK = toEntity.fields.find(f => f.isPK);
          if (targetPK) {
            field.fkReference.targetFieldId = targetPK.id;
          }

          if (rel.label) {
            field.fkReference.relationshipLabel = rel.label;
          }
        }
      }
    }
  }
}