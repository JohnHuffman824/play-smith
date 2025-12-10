import { Users, ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';

interface Team {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface TeamSelectorProps {
  teams: Team[];
  currentTeamId: string;
  onSwitchTeam: (teamId: string) => void;
  onManageTeams: () => void;
}

export function TeamSelector({ teams, currentTeamId, onSwitchTeam, onManageTeams }: TeamSelectorProps) {
  const [showMenu, setShowMenu] = useState(false);

  const currentTeam = teams.find(t => t.id === currentTeamId);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200"
      >
        <Users className="w-4 h-4" />
        <span className="max-w-[150px] truncate">{currentTeam?.name || 'Select Team'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-full mt-2 bg-popover border border-border rounded-lg shadow-xl py-2 min-w-[250px] z-50">
            <div className="px-3 py-2 text-muted-foreground border-b border-border mb-2">
              Switch Team
            </div>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  onSwitchTeam(team.id);
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2.5 text-left hover:bg-accent transition-colors duration-150 flex items-center justify-between ${
                  team.id === currentTeamId ? 'bg-accent/50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{team.name}</span>
                </div>
                {team.id === currentTeamId && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
            <div className="h-px bg-border my-2" />
            <button
              onClick={() => {
                onManageTeams();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors duration-150 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Teams
            </button>
          </div>
        </>
      )}
    </div>
  );
}
