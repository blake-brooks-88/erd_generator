import { Entity } from './storageService';

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
      let relationshipLine = `  "${rel.fromEntity}" ${rel.cardinality} "${rel.toEntity}"`;
      
      // Add relationship label if present
      if (rel.label) {
        relationshipLine += ` : "${rel.label}"`;
      }
      
      lines.push(relationshipLine);
    }
  }

  return lines.join('\n');
}

interface Relationship {
  fromEntity: string;
  toEntity: string;
  cardinality: string;
  label?: string;
}

/**
 * Extracts relationships from entities based on FK references
 */
function extractRelationships(entities: Entity[]): Relationship[] {
  const relationships: Relationship[] = [];
  const entityMap = new Map(entities.map(e => [e.id, e]));

  for (const entity of entities) {
    for (const field of entity.fields) {
      if (field.isFK && field.fkReference) {
        const targetEntity = entityMap.get(field.fkReference.targetEntityId);
        
        if (targetEntity) {
          const cardinality = mapCardinalityToMermaid(field.fkReference.cardinality);
          
          const label = field.fkReference.relationshipLabel;
          
          relationships.push({
            fromEntity: entity.name,
            toEntity: targetEntity.name,
            cardinality,
            ...(label && { label })
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
function mapCardinalityToMermaid(cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one'): string {
  switch (cardinality) {
    case 'one-to-one':
      return '||--||';
    case 'one-to-many':
      return '||--o{';
    case 'many-to-one':
      return '}o--||';
    default:
      return '||--o{';
  }
}