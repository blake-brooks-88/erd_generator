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
  onImport: () => void; // Changed from onImportCSV
  onExportCSV: () => void;
  onExportJson: () => void; // Added prop for JSON export
}

export default function Navbar({
  currentProject,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onSelectProject,
  onImport, // Changed from onImportCSV
  onExportCSV,
  onExportJson, // Added prop
}: NavbarProps) {
  return (
    <nav className="bg-white text-text p-4 flex items-center justify-between border-b border-neutral shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-primary">ERD Generator</h1>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-neutral">
              <FolderOpen className="h-4 w-4 mr-2" />
              File
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onImport} data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV / JSON...
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger data-testid="button-export-subtrigger">
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                 <DropdownMenuItem onClick={onExportCSV} data-testid="button-export-csv">
                    Export Current as CSV
                 </DropdownMenuItem>
                 {/* --- New JSON Export Item --- */}
                 <DropdownMenuItem onClick={onExportJson} data-testid="button-export-json">
                    <FileJson className="h-4 w-4 mr-2" />
                    Export All Projects (JSON Backup)
                 </DropdownMenuItem>
                 {/* --- End New Item --- */}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

