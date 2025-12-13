import { Users, ChevronDown, Settings, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import './team-selector.css'

type Team = {
	id: number
	name: string
	role: 'owner' | 'editor' | 'viewer'
}

type TeamSelectorProps = {
	teams: Team[]
	currentTeamId: number | null
	onSwitchTeam: (teamId: number) => void
	onManageTeams: () => void
}

export function TeamSelector({ teams, currentTeamId, onSwitchTeam, onManageTeams }: TeamSelectorProps) {
	const currentTeam = teams.find(t => t.id === currentTeamId)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="team-selector-button">
					<Users className="team-selector-icon" />
					<span className="team-selector-name">{currentTeam?.name || 'Select Team'}</span>
					<ChevronDown className="team-selector-icon" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" style={{ minWidth: '250px' }}>
				<DropdownMenuLabel>Switch Team</DropdownMenuLabel>
				{teams.map((team) => (
					<DropdownMenuItem
						key={team.id}
						onClick={() => onSwitchTeam(team.id)}
						className={`team-selector-item ${team.id === currentTeamId ? 'team-selector-item-active' : ''}`.trim()}
					>
						<div className="team-selector-item-content">
							<Users className="team-selector-icon" />
							<span className="team-selector-item-name">{team.name}</span>
							{team.id === currentTeamId && (
								<Check className="team-selector-icon team-selector-item-check" />
							)}
						</div>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => onManageTeams()} className="team-selector-manage">
					<Settings className="team-selector-icon" />
					Manage Teams
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
