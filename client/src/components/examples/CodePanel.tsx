import CodePanel from '../CodePanel';

export default function CodePanelExample() {
  const sampleCode = `erDiagram
  Users {
    int id PK
    string username 
    string email 
  }
  Posts {
    int id PK
    int user_id FK
    string title 
  }
  Users ||--o{ Posts : "has"`;

  return <CodePanel code={sampleCode} />;
}
