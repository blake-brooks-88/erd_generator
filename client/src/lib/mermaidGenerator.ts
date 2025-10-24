import { Entity, Field } from './storageService';

/**
 * Generates Mermaid erDiagram code from entities
 * Includes field descriptions and relationship labels
 */
export function generateMermaidCode(entities: Entity[]): string {
  if (!entities || entities.length === 0) {
    return 'erDiagram';
  }

  const lines: string[] = ['erDiagram'];

  // Generate entity definitions with fields
  for (const entity of entities) {
    lines.push(`  "${entity.name}" {`);
    
    for (const field of entity.fields) {
      let fieldLine = `    ${field.type} ${field.name}`;
      
      // Add PK or FK indicator
      if (field.isPK) {
        fieldLine += ' PK';
      } else if (field.isFK) {
        fieldLine += ' FK';
      }
      
      // Add description if present
      if (field.description) {
        fieldLine += ` "${field.description}"`;
      }
      
      lines.push(fieldLine);
    }
    
    lines.push('  }');
    lines.push(''); // Empty line between entities
  }

  // Generate relationships
  const relationships = extractRelationships(entities);
  if (relationships.length > 0) {
    for (const rel of relationships) {
      // CRITICAL FIX 1: Ensure the label always exists (defaults to empty string if somehow not provided below)
      const label = rel.label || ""; 
      
      // CRITICAL FIX 2: Always include the colon and quoted label to satisfy Mermaid syntax
      let relationshipLine = `  "${rel.fromEntity}" ${rel.cardinality} "${rel.toEntity}" : "${label}"`;
      
      lines.push(relationshipLine);
    }
  }

  return lines.join('\n');
}

interface Relationship {
  fromEntity: string;
  toEntity: string;
  cardinality: string;
  label: string; // Changed to required string based on new logic
}

/**
 * Extracts relationships from entities based on FK references
 * SIMPLIFIED: If a field has fkReference with cardinality, output that relationship
 */
function extractRelationships(entities: Entity[]): Relationship[] {
  const relationships: Relationship[] = [];
  const entityMap = new Map(entities.map(e => [e.id, e]));

  for (const entity of entities) {
    for (const field of entity.fields) {
      // If field has an fkReference with cardinality, create the relationship
      if (field.fkReference && field.fkReference.cardinality) {
        const targetEntity = entityMap.get(field.fkReference.targetEntityId);
        
        if (targetEntity) {
          const cardinality = mapCardinalityToMermaid(field.fkReference.cardinality);
          const label = field.fkReference.relationshipLabel || field.name;
          
          relationships.push({
            fromEntity: entity.name,
            toEntity: targetEntity.name,
            cardinality,
            label: label
          });
        }
      }
    }
  }

  return relationships;
}

/**
 * Maps our cardinality types to Mermaid relationship syntax
 */
function mapCardinalityToMermaid(cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'): string {
  switch (cardinality) {
    case 'one-to-one':
      return '||--||';
    case 'one-to-many':
      return '||--o{';
    case 'many-to-one':
      return '}o--||';
    case 'many-to-many':
      return '}o--o{';
    default:
      return '||--o{';
  }
}