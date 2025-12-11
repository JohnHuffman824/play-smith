import { Users, ChevronDown, Settings, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

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
				<button
					className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200 cursor-pointer"
				>
					<Users className="w-4 h-4" />
					<span className="max-w-[150px] truncate">{currentTeam?.name || 'Select Team'}</span>
					<ChevronDown className="w-4 h-4" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-[250px]">
				<DropdownMenuLabel>Switch Team</DropdownMenuLabel>
				{teams.map((team) => (
					<DropdownMenuItem
						key={team.id}
						onClick={() => onSwitchTeam(team.id)}
						className={team.id === currentTeamId ? 'bg-accent/50' : ''}
					>
						<Users className="w-4 h-4" />
						<span className="flex-1">{team.name}</span>
						{team.id === currentTeamId && (
							<Check className="w-4 h-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => onManageTeams()}>
					<Settings className="w-4 h-4" />
					Manage Teams
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
