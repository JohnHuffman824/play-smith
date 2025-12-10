import { Search, Grid, List, Plus, Upload, Download, Settings, FolderPlus } from 'lucide-react';
import { TeamSelector } from './TeamSelector';
import { HEADER_HEIGHT } from '../constants/layout';

interface Team {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface ToolbarProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewPlaybook: () => void;
  onNewFolder: () => void;
  onImport: () => void;
  onExport: () => void;
  onSettingsClick: () => void;
  teams: Team[];
  currentTeamId: string;
  onSwitchTeam: (teamId: string) => void;
  onManageTeams: () => void;
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onNewPlaybook,
  onNewFolder,
  onImport,
  onExport,
  onSettingsClick,
  teams,
  currentTeamId,
  onSwitchTeam,
  onManageTeams,
}: ToolbarProps) {
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10" style={{ height: `${HEADER_HEIGHT}px` }}>
      <div className="px-6 h-full flex items-center">
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Left Section - Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search playbooks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-input-background text-foreground placeholder:text-muted-foreground rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Team Selector */}
            <TeamSelector
              teams={teams}
              currentTeamId={currentTeamId}
              onSwitchTeam={onSwitchTeam}
              onManageTeams={onManageTeams}
            />

            <div className="w-px h-6 bg-border" />

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-card shadow-sm'
                    : 'hover:bg-accent/50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-card shadow-sm'
                    : 'hover:bg-accent/50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Action Buttons */}
            <button
              onClick={onNewPlaybook}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Playbook
            </button>

            <button
              onClick={onNewFolder}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
              title="New Folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>

            <button
              onClick={onImport}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
              title="Import"
            >
              <Upload className="w-5 h-5" />
            </button>

            <button
              onClick={onExport}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-border" />

            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}