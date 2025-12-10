import { X, Users, Crown, Edit, Eye, Mail, Plus, MoreVertical, Settings } from 'lucide-react';
import { useState } from 'react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface Team {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  memberCount: number;
  playbookCount: number;
}

interface TeamManagementProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeamId: string;
  teams: Team[];
  onSwitchTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => void;
}

export function TeamManagement({ 
  isOpen, 
  onClose, 
  currentTeamId, 
  teams,
  onSwitchTeam,
  onCreateTeam
}: TeamManagementProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'members' | 'settings'>('teams');
  const [showNewTeamInput, setShowNewTeamInput] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null);

  // Mock team members data
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: 'you@team.com',
      name: 'You',
      role: 'owner',
    },
    {
      id: '2',
      email: 'coach.johnson@team.com',
      name: 'Coach Johnson',
      role: 'editor',
    },
    {
      id: '3',
      email: 'assistant@team.com',
      name: 'Assistant Coach',
      role: 'viewer',
    },
  ]);

  if (!isOpen) return null;

  const currentTeam = teams.find(t => t.id === currentTeamId);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      onCreateTeam(newTeamName);
      setNewTeamName('');
      setShowNewTeamInput(false);
    }
  };

  const handleInviteMember = () => {
    if (inviteEmail.trim() && inviteEmail.includes('@')) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail,
        name: inviteEmail.split('@')[0],
        role: inviteRole,
      };
      setMembers([...members, newMember]);
      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteDialog(false);
    }
  };

  const handleRoleChange = (memberId: string, newRole: 'editor' | 'viewer') => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Remove this member from the team?')) {
      setMembers(members.filter(m => m.id !== memberId));
    }
  };

  const getRoleIcon = (role: 'owner' | 'editor' | 'viewer') => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleLabel = (role: 'owner' | 'editor' | 'viewer') => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Dialog */}
        <div
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <h2>Team Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-6 flex-shrink-0">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-3 border-b-2 transition-colors duration-200 ${
                activeTab === 'teams'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              My Teams
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-3 border-b-2 transition-colors duration-200 ${
                activeTab === 'members'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Team Members
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 border-b-2 transition-colors duration-200 ${
                activeTab === 'settings'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Team Settings
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* My Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">
                    {teams.length} team{teams.length !== 1 ? 's' : ''}
                  </p>
                  {!showNewTeamInput && (
                    <button
                      onClick={() => setShowNewTeamInput(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Team
                    </button>
                  )}
                </div>

                {/* New Team Input */}
                {showNewTeamInput && (
                  <div className="bg-muted/30 rounded-xl p-4 border border-border mb-4">
                    <label className="block mb-2">Team Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTeam();
                          if (e.key === 'Escape') {
                            setShowNewTeamInput(false);
                            setNewTeamName('');
                          }
                        }}
                        placeholder="Enter team name..."
                        className="flex-1 px-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
                        autoFocus
                      />
                      <button
                        onClick={handleCreateTeam}
                        disabled={!newTeamName.trim()}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewTeamInput(false);
                          setNewTeamName('');
                        }}
                        className="px-4 py-2.5 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Teams List */}
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`bg-muted/30 rounded-xl p-4 border transition-all duration-200 hover:bg-muted/50 ${
                        team.id === currentTeamId
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{team.name}</h3>
                              {getRoleIcon(team.role)}
                              <span className="text-muted-foreground">
                                {getRoleLabel(team.role)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {team.memberCount} members • {team.playbookCount} playbooks
                            </p>
                          </div>
                        </div>
                        {team.id !== currentTeamId && (
                          <button
                            onClick={() => onSwitchTeam(team.id)}
                            className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200"
                          >
                            Switch
                          </button>
                        )}
                        {team.id === currentTeamId && (
                          <span className="px-4 py-2 bg-primary/10 text-primary rounded-lg">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">
                    {members.length} member{members.length !== 1 ? 's' : ''} in {currentTeam?.name}
                  </p>
                  {currentTeam?.role === 'owner' && !showInviteDialog && (
                    <button
                      onClick={() => setShowInviteDialog(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Invite Member
                    </button>
                  )}
                </div>

                {/* Invite Dialog */}
                {showInviteDialog && (
                  <div className="bg-muted/30 rounded-xl p-4 border border-border mb-4">
                    <label className="block mb-2">Invite Team Member</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInviteMember();
                          if (e.key === 'Escape') {
                            setShowInviteDialog(false);
                            setInviteEmail('');
                          }
                        }}
                        placeholder="Enter email address..."
                        className="flex-1 px-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
                        autoFocus
                      />
                      <div className="relative">
                        <button
                          onClick={() => setShowRoleMenu(!showRoleMenu)}
                          className="px-4 py-2.5 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-between"
                        >
                          <span>{inviteRole === 'editor' ? 'Editor' : 'Viewer'}</span>
                          <Edit className="w-4 h-4" />
                        </button>
                        {showRoleMenu && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setShowRoleMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[180px] z-30">
                              <button
                                onClick={() => {
                                  setInviteRole('editor');
                                  setShowRoleMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                              >
                                <div className="font-medium">Editor</div>
                                <div className="text-muted-foreground">Can edit playbooks</div>
                              </button>
                              <div className="h-px bg-border my-1" />
                              <button
                                onClick={() => {
                                  setInviteRole('viewer');
                                  setShowRoleMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                              >
                                <div className="font-medium">Viewer</div>
                                <div className="text-muted-foreground">Can view only</div>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={handleInviteMember}
                        disabled={!inviteEmail.trim() || !inviteEmail.includes('@')}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Invite
                      </button>
                      <button
                        onClick={() => {
                          setShowInviteDialog(false);
                          setInviteEmail('');
                        }}
                        className="px-4 py-2.5 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Members List */}
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-muted/30 rounded-xl px-4 py-3 border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {member.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role !== 'owner' && currentTeam?.role === 'owner' && (
                          <>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveMemberMenu(
                                    activeMemberMenu === member.id ? null : member.id
                                  )
                                }
                                className="px-3 py-1.5 bg-accent/50 hover:bg-accent rounded-lg transition-all duration-200 flex items-center gap-2"
                              >
                                <span>{getRoleLabel(member.role)}</span>
                                <Edit className="w-3 h-3" />
                              </button>
                              {activeMemberMenu === member.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setActiveMemberMenu(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[180px] z-30">
                                    <button
                                      onClick={() => {
                                        handleRoleChange(member.id, 'editor');
                                        setActiveMemberMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                                    >
                                      <div className="font-medium">Editor</div>
                                      <div className="text-muted-foreground">
                                        Can edit playbooks
                                      </div>
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                      onClick={() => {
                                        handleRoleChange(member.id, 'viewer');
                                        setActiveMemberMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-150"
                                    >
                                      <div className="font-medium">Viewer</div>
                                      <div className="text-muted-foreground">Can view only</div>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 hover:bg-accent rounded-lg transition-all duration-200 text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {member.role === 'owner' && (
                          <span className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-2">
                            <Crown className="w-4 h-4" />
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Team Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">Team Name</label>
                      <input
                        type="text"
                        defaultValue={currentTeam?.name || ''}
                        disabled={currentTeam?.role !== 'owner'}
                        className="w-full px-4 py-2.5 bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h3 className="font-medium mb-4">Team Libraries</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage shared formations, personnel packages, routes, and custom tags for your team.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 text-left">
                      <div className="font-medium">Formations</div>
                      <div className="text-muted-foreground">Manage team formations</div>
                    </button>
                    <button className="p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 text-left">
                      <div className="font-medium">Personnel</div>
                      <div className="text-muted-foreground">Manage personnel packages</div>
                    </button>
                    <button className="p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 text-left">
                      <div className="font-medium">Routes</div>
                      <div className="text-muted-foreground">Manage route templates</div>
                    </button>
                    <button className="p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 text-left">
                      <div className="font-medium">Custom Tags</div>
                      <div className="text-muted-foreground">Manage team tags</div>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h3 className="font-medium mb-4">Position Labels</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure position naming that aligns with your team&apos;s terminology.
                  </p>
                  <button className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200">
                    Configure Position Labels
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}