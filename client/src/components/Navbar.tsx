import { Project } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FilePlus, Edit, Trash2, Upload, Download, FileJson, FileText, Layers3, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  currentProject: Project | null;
  projects: Project[];
  onCreateProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onSelectProject: (id: string) => void;
  onImportCSV: () => void; // Import CSV data dictionary
  onImportJson: () => void; // Import ALL Projects JSON backup (overwrite)
  onImportSingleJson: () => void; // NEW: Import Single Project JSON
  onExportCSV: () => void; // TO BE REMOVED/UNUSED
  onExportJson: () => void; // Export ALL Projects JSON backup
  onExportSingleJson: () => void; // NEW: Export Single Project JSON
  onExportExcel: () => void;
}

export default function Navbar({
  currentProject,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onSelectProject,
  onImportCSV,
  onImportJson,
  onImportSingleJson,
  // Note: onExportCSV is now unused but kept in prop destructuring to avoid errors in other files
  onExportCSV,
  onExportJson,
  onExportSingleJson,
  onExportExcel,
}: NavbarProps) {
  const isActive = !!currentProject;

  return (
    <nav className="bg-page-bg text-text p-4 flex items-center justify-between border-b border-border shadow-md sticky top-0 z-10">

      {/* Left Section: Branding and Project Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Using a placeholder image URL for the logo */}
          <img className="h-6 w-6" src='https://www.listengage.com/wp-content/uploads/2023/09/Favicon-List-Engage.svg' alt="List Engage Logo" />
          <h1 className="text-xl font-bold text-text tracking-tight">Schema Builder</h1>
        </div>

        {/* Project Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={
                `border-border text-text transition-all duration-200 shadow-sm rounded-full h-10 px-4 group 
                    ${isActive
                  ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                  : 'bg-base hover:bg-base/70'
                }`
              }
            >
              <Layers3
                className={
                  `h-4 w-4 mr-2 transition-colors duration-200 
                    ${isActive ? 'text-primary' : 'text-secondary'}`
                }
              />
              <span className="font-semibold text-sm">
                <span className="text-neutral mr-1">{isActive ? 'Project:' : ''}</span>
                {currentProject ? currentProject.name : 'Select Project to Start'}
              </span>
              <ChevronDown
                className={
                  `h-4 w-4 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180 
                    ${isActive ? 'text-primary' : 'text-neutral'}`
                }
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 shadow-xl border-border bg-page-bg">

            {/* Project List Label */}
            <DropdownMenuLabel className="font-bold text-text border-b border-border/50">Switch Project</DropdownMenuLabel>

            {/* Project List */}
            {projects.map(project => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                disabled={project.id === currentProject?.id}
                className={project.id === currentProject?.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-base'}
                data-testid={`project-select-${project.id}`}
              >
                {project.name} {project.id === currentProject?.id && ' (Active)'}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="font-bold text-text border-b border-border/50">Manage</DropdownMenuLabel>

            {/* Create Project */}
            <DropdownMenuItem onClick={onCreateProject} data-testid="button-create-project" className="text-secondary hover:bg-secondary/10">
              <FilePlus className="h-4 w-4 mr-2" />
              Create New Project
            </DropdownMenuItem>

            {currentProject && (
              <>
                {/* Rename Project */}
                <DropdownMenuItem onClick={onRenameProject} data-testid="button-rename-project" className="hover:bg-base">
                  <Edit className="h-4 w-4 mr-2 text-primary" />
                  Rename Current Project
                </DropdownMenuItem>
                {/* Delete Project */}
                <DropdownMenuItem
                  onClick={onDeleteProject}
                  className="text-error focus:text-error focus:bg-error/10 hover:bg-error/10"
                  data-testid="button-delete-project"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Current Project
                </DropdownMenuItem>
              </>
            )}


          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section: Split Import and Export Actions */}
      <div className="flex items-center gap-2">

        {/* Import Button (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-secondary text-secondary bg-page-bg hover:bg-secondary/10 hover:shadow-md transition-all duration-200 rounded-lg h-10 px-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 shadow-lg border-border bg-page-bg">
            <DropdownMenuLabel className="font-bold text-text border-b border-border/50">
              Import Options
            </DropdownMenuLabel>

            {/* Import Single Project JSON */}
            <DropdownMenuItem onClick={onImportSingleJson} data-testid="button-import-single-json" className="hover:bg-secondary/10">
              <FileJson className="h-4 w-4 mr-2 text-secondary" />
              Single Project (JSON)
            </DropdownMenuItem>

            {/* Import ALL Projects JSON (Backup) */}
            <DropdownMenuItem onClick={onImportJson} data-testid="button-import-json-all" className="hover:bg-secondary/10">
              <FileJson className="h-4 w-4 mr-2 text-secondary" />
              All Projects Backup (JSON)
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Button (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-primary text-primary bg-page-bg hover:bg-primary/10 hover:shadow-md transition-all duration-200 rounded-lg h-10 px-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 shadow-lg border-border bg-page-bg">

            {/* NEW: Export Project(s) Group */}
            <DropdownMenuLabel className="font-bold text-text border-b border-border/50">
              Export Project(s)
            </DropdownMenuLabel>

            {/* Options for Project JSON Export */}
            <DropdownMenuItem onClick={onExportSingleJson} disabled={!currentProject} data-testid="button-export-single-json" className="hover:bg-primary/10">
              <FileJson className="h-4 w-4 mr-2 text-primary" />
              Current Project (.json)
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportJson} data-testid="button-export-json-all" className="hover:bg-primary/10">
              <FileJson className="h-4 w-4 mr-2 text-primary" />
              All Projects (.json)
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            {/* Export Dictionary Group (Now only Excel) */}
            <DropdownMenuLabel className="font-bold text-text border-b border-border/50">
              Export Dictionary
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={onExportExcel} disabled={!currentProject} data-testid="button-export-excel" className="hover:bg-primary/10">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-primary" />
              Data Dictionary (.xlsx)
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}