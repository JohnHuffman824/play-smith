import { Grid, List, Plus, FolderPlus, Upload, Download, Settings } from 'lucide-react'
import { TeamSelector } from './TeamSelector'
import { HEADER_HEIGHT } from '../../constants/layout'
import { IconButton } from '../ui/icon-button'
import { SearchInput } from '../ui/search-input'
import { TooltipProvider } from '../ui/tooltip'
import { cn } from '../ui/utils'

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
			<div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10" style={{ height: `${HEADER_HEIGHT}px` }}>
				<div className="px-6 h-full flex items-center">
					<div className="flex items-center justify-between gap-4 w-full">
					{/* Left Section - Search */}
					<SearchInput
						value={searchQuery}
						onChange={onSearchChange}
						placeholder="Search playbooks..."
						className="flex-1 max-w-xl"
					/>

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
									className={cn(
										"p-2 rounded transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
										viewMode === 'grid'
											? 'bg-card shadow-sm'
											: 'hover:bg-accent/50'
									)}
								>
									<Grid className="w-4 h-4" />
								</button>
								<button
									onClick={() => onViewModeChange('list')}
									className={cn(
										"p-2 rounded transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
										viewMode === 'list'
											? 'bg-card shadow-sm'
											: 'hover:bg-accent/50'
									)}
								>
									<List className="w-4 h-4" />
								</button>
							</div>

							<div className="w-px h-6 bg-border" />

							{/* Action Buttons */}
							<button
								onClick={onNewPlaybook}
								className="flex items-center gap-2 px-4 py-2 bg-action-button text-action-button-foreground rounded-lg hover:bg-action-button/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 whitespace-nowrap"
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

							<div className="w-px h-6 bg-border" />

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
