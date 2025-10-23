import { Entity } from './storageService';

export function generateMermaidCode(entities: Entity[]): string {
  if (entities.length === 0) {
    return 'erDiagram\n  %% No entities defined yet';
  }

  let mermaid = 'erDiagram\n';

  entities.forEach(entity => {
    mermaid += `  ${entity.name} {\n`;
    entity.fields.forEach(field => {
      const keyIndicator = field.isPK ? 'PK' : field.isFK ? 'FK' : '';
      mermaid += `    ${field.type} ${field.name} ${keyIndicator}\n`;
    });
    mermaid += `  }\n`;
  });

  const relationships = new Set<string>();
  
  entities.forEach(entity => {
    entity.fields.forEach(field => {
      if (field.isFK && field.fkReference) {
        const targetEntity = entities.find(e => e.id === field.fkReference!.targetEntityId);
        if (targetEntity) {
          let cardinality: string;
          
          if (field.fkReference.cardinality === 'one-to-one') {
            cardinality = '||--||';
          } else {
            cardinality = '}o--||';
          }
          
          const relKey = `${entity.name}${cardinality}${targetEntity.name}`;
          const reverseKey = `${targetEntity.name}${cardinality}${entity.name}`;
          
          if (!relationships.has(reverseKey)) {
            relationships.add(relKey);
            mermaid += `  ${entity.name} ${cardinality} ${targetEntity.name} : ""\n`;
          }
        }
      }
    });
  });

  return mermaid;
}
