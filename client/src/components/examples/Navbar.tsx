import Navbar from '../Navbar';

export default function NavbarExample() {
  const projects = [
    { id: '1', name: 'E-commerce Schema' },
    { id: '2', name: 'Blog Platform' },
    { id: '3', name: 'CRM System' },
  ];

  return (
    <Navbar
      currentProject={{ id: '1', name: 'E-commerce Schema' }}
      projects={projects}
      onCreateProject={() => console.log('Create project')}
      onRenameProject={() => console.log('Rename project')}
      onDeleteProject={() => console.log('Delete project')}
      onSelectProject={(id) => console.log('Select project:', id)}
      onImportCSV={() => console.log('Import CSV')}
      onExportCSV={() => console.log('Export CSV')}
    />
  );
}
