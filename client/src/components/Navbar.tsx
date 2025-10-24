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
import { ChevronDown, FilePlus, Edit, Trash2, FolderOpen, Upload, Download, FileJson } from 'lucide-react'; // Added FileJson

interface NavbarProps {
  currentProject: Project | null;
  projects: Project[];
  onCreateProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onSelectProject: (id: string) => void;
  onImportCSV: () => void; // Import CSV data dictionary
  onImportJson: () => void; // Import JSON backup
  onExportCSV: () => void;
  onExportJson: () => void;
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
  onExportCSV,
  onExportJson,
}: NavbarProps) {
  return (
    <nav className="bg-white text-text p-4 flex items-center justify-between border-b border-neutral shadow-sm">
      <div className="flex items-center gap-4">
          <img className="h-12" src='https://www.listengage.com/wp-content/uploads/2023/09/Favicon-List-Engage.svg' />
          <h1 className="text-xl font-semibold text-text">ERD Generator</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-neutral">
              {currentProject ? currentProject.name : 'Select Project'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map(project => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                disabled={project.id === currentProject?.id}
                data-testid={`project-select-${project.id}`}
              >
                {project.name} {project.id === currentProject?.id && '(Current)'}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateProject} data-testid="button-create-project">
              <FilePlus className="h-4 w-4 mr-2" />
              Create New Project
            </DropdownMenuItem>
            {currentProject && (
              <>
                <DropdownMenuItem onClick={onRenameProject} data-testid="button-rename-project">
                  <Edit className="h-4 w-4 mr-2" />
                  Rename Current Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDeleteProject}
                  className="text-error focus:text-error focus:bg-error/10"
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

      <div className="flex items-center gap-2">
        {/* Import Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-neutral bg-info hover:bg-info/90 text-white hover:text-white">
              <Upload className="h-4 w-4 mr-2" />
              Import
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onImportCSV} data-testid="button-import-csv">
              <Upload className="h-4 w-4 mr-2" />
              Import Data Dictionary (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportJson} data-testid="button-import-json">
              <FileJson className="h-4 w-4 mr-2" />
              Import All Projects (JSON Backup)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-neutral bg-success hover:bg-success/90 text-white hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportCSV} data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Export Current as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportJson} data-testid="button-export-json">
              <FileJson className="h-4 w-4 mr-2" />
              Export All Projects (JSON Backup)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}