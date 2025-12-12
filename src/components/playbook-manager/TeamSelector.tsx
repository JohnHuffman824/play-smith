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
					<Users className="w-4 h-4" />
					<span className="team-selector-name">{currentTeam?.name || 'Select Team'}</span>
					<ChevronDown className="w-4 h-4" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" style={{ minWidth: '250px' }}>
				<DropdownMenuLabel>Switch Team</DropdownMenuLabel>
				{teams.map((team) => (
					<DropdownMenuItem
						key={team.id}
						onClick={() => onSwitchTeam(team.id)}
						className={`cursor-pointer ${team.id === currentTeamId ? 'team-selector-item-active' : ''}`}
					>
						<Users className="w-4 h-4" />
						<span className="flex-1">{team.name}</span>
						{team.id === currentTeamId && (
							<Check className="w-4 h-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => onManageTeams()} className="cursor-pointer">
					<Settings className="w-4 h-4" />
					Manage Teams
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
