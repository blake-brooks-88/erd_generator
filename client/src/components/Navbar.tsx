import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Edit2, Trash2, Upload, Download } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface NavbarProps {
  currentProject: Project | null;
  projects: Project[];
  onCreateProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onSelectProject: (id: string) => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
}

export default function Navbar({
  currentProject,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onSelectProject,
  onImportCSV,
  onExportCSV,
}: NavbarProps) {
  return (
    <nav className="h-14 bg-secondary flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-base">ERD Generator</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="bg-secondary hover:bg-secondary/90 text-base"
              data-testid="button-projects-dropdown"
            >
              <span className="mr-2">{currentProject?.name || 'Select Project'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-neutral shadow-lg">
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map(project => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="hover:bg-primary/10 cursor-pointer"
                data-testid={`menu-item-project-${project.id}`}
              >
                {project.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreateProject}
              className="text-primary hover:bg-primary/10 cursor-pointer"
              data-testid="menu-item-create-project"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onRenameProject}
              className="text-primary hover:bg-primary/10 cursor-pointer"
              data-testid="menu-item-rename-project"
              disabled={!currentProject}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename Current Project
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDeleteProject}
              className="text-error hover:bg-error/10 cursor-pointer"
              data-testid="menu-item-delete-project"
              disabled={!currentProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Current Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="bg-info hover:bg-info/80 text-white"
          onClick={onImportCSV}
          data-testid="button-import-csv"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button
          variant="ghost"
          className="bg-success hover:bg-success/80 text-white"
          onClick={onExportCSV}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </nav>
  );
}
