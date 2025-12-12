import { Grid, List, Plus, FolderPlus, Upload, Download, Settings } from 'lucide-react'
import { TeamSelector } from './TeamSelector'
import { HEADER_HEIGHT } from '../../constants/layout'
import { IconButton } from '../ui/icon-button'
import { SearchInput } from '../ui/search-input'
import { TooltipProvider } from '../ui/tooltip'
import './toolbar.css'

interface Team {
	id: number
	name: string
	role: 'owner' | 'editor' | 'viewer'
}

interface ToolbarProps {
	viewMode: 'grid' | 'list'
	onViewModeChange: (mode: 'grid' | 'list') => void
	searchQuery: string
	onSearchChange: (query: string) => void
	onNewPlaybook: () => void
	onNewFolder: () => void
	onImport: () => void
	onExport: () => void
	onSettingsClick: () => void
	teams: Team[]
	currentTeamId: number | null
	onSwitchTeam: (teamId: number) => void
	onManageTeams: () => void
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
		<TooltipProvider>
			<div className="playbook-toolbar" style={{ height: `${HEADER_HEIGHT}px` }}>
				<div className="playbook-toolbar-container">
					<div className="playbook-toolbar-content">
					{/* Left Section - Search */}
					<SearchInput
						value={searchQuery}
						onChange={onSearchChange}
						placeholder="Search playbooks..."
						style={{ flex: 1, maxWidth: '672px' }}
					/>

						{/* Right Section - Actions */}
						<div className="playbook-toolbar-actions">
							{/* Team Selector */}
							<TeamSelector
								teams={teams}
								currentTeamId={currentTeamId}
								onSwitchTeam={onSwitchTeam}
								onManageTeams={onManageTeams}
							/>

							<div className="playbook-toolbar-divider" />

							{/* View Mode Toggle */}
							<div className="playbook-toolbar-view-mode">
								<button
									onClick={() => onViewModeChange('grid')}
									className={`playbook-toolbar-view-button ${viewMode === 'grid' ? 'playbook-toolbar-view-button-active' : ''}`}
								>
									<Grid className="w-4 h-4" />
								</button>
								<button
									onClick={() => onViewModeChange('list')}
									className={`playbook-toolbar-view-button ${viewMode === 'list' ? 'playbook-toolbar-view-button-active' : ''}`}
								>
									<List className="w-4 h-4" />
								</button>
							</div>

							<div className="playbook-toolbar-divider" />

							{/* Action Buttons */}
							<button
								onClick={onNewPlaybook}
								className="playbook-toolbar-new-playbook"
							>
								<Plus className="w-4 h-4" />
								New Playbook
							</button>

							<IconButton
								icon={FolderPlus}
								tooltip="New Folder"
								onClick={onNewFolder}
							/>

							<IconButton
								icon={Upload}
								tooltip="Import"
								onClick={onImport}
							/>

							<IconButton
								icon={Download}
								tooltip="Export"
								onClick={onExport}
							/>

							<div className="playbook-toolbar-divider" />

							{/* Settings */}
							<IconButton
								icon={Settings}
								tooltip="Settings"
								onClick={onSettingsClick}
							/>
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	)
}
