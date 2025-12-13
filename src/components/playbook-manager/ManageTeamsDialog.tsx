import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Users, Trash2, UserPlus, Crown, Edit2, Shield, Eye, Mail, ChevronLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog'
import {
	teamKeys,
	fetchTeams,
	fetchTeamMembers,
	createTeam,
	updateTeam,
	deleteTeam,
	updateMemberRole,
	removeMember,
	createInvitation,
	cancelInvitation,
	type TeamWithRole
} from '../../api/queries/teamQueries'
import { useAuth } from '../../contexts/AuthContext'
import './manage-teams-dialog.css'

interface ManageTeamsDialogProps {
	isOpen: boolean
	onClose: () => void
}

type DialogView = 'list' | 'create' | 'edit' | 'members'

export function ManageTeamsDialog({ isOpen, onClose }: ManageTeamsDialogProps) {
	const { user } = useAuth()
	const queryClient = useQueryClient()
	const [view, setView] = useState<DialogView>('list')
	const [selectedTeam, setSelectedTeam] = useState<TeamWithRole | null>(null)
	const [teamName, setTeamName] = useState('')
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [removeMemberConfirm, setRemoveMemberConfirm] = useState<{ userId: number; name: string } | null>(null)
	const [inviteEmail, setInviteEmail] = useState('')
	const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer')
	const [error, setError] = useState<string | null>(null)

	// Queries
	const { data: teams = [], isLoading } = useQuery({
		queryKey: teamKeys.list(),
		queryFn: fetchTeams,
		enabled: isOpen
	})

	const { data: membersData } = useQuery({
		queryKey: teamKeys.members(selectedTeam?.id ?? 0),
		queryFn: () => fetchTeamMembers(selectedTeam!.id),
		enabled: !!selectedTeam && view === 'members'
	})

	// Mutations
	const createMutation = useMutation({
		mutationFn: createTeam,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.list() })
			setTeamName('')
			setView('list')
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	const updateMutation = useMutation({
		mutationFn: ({ id, name }: { id: number; name: string }) => updateTeam(id, name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.list() })
			setTeamName('')
			setSelectedTeam(null)
			setView('list')
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	const deleteMutation = useMutation({
		mutationFn: deleteTeam,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.list() })
			setSelectedTeam(null)
			setDeleteConfirmOpen(false)
			setView('list')
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	const roleMutation = useMutation({
		mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: 'owner' | 'editor' | 'viewer' }) =>
			updateMemberRole(teamId, userId, role),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.members(selectedTeam!.id) })
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	const removeMutation = useMutation({
		mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
			removeMember(teamId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.members(selectedTeam!.id) })
			queryClient.invalidateQueries({ queryKey: teamKeys.list() })
			setRemoveMemberConfirm(null)
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	const inviteMutation = useMutation({
		mutationFn: ({ teamId, email, role }: { teamId: number; email: string; role: 'owner' | 'editor' | 'viewer' }) =>
			createInvitation(teamId, email, role),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.members(selectedTeam!.id) })
			setInviteEmail('')
			setInviteRole('viewer')
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	const cancelInviteMutation = useMutation({
		mutationFn: ({ teamId, invitationId }: { teamId: number; invitationId: number }) =>
			cancelInvitation(teamId, invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamKeys.members(selectedTeam!.id) })
			setError(null)
		},
		onError: (err: Error) => setError(err.message)
	})

	// Handlers
	const handleSelectTeam = (team: TeamWithRole) => {
		setSelectedTeam(team)
		setView('members')
	}

	const handleEditTeam = (team: TeamWithRole) => {
		setSelectedTeam(team)
		setTeamName(team.name)
		setView('edit')
	}

	const handleCreateTeam = () => {
		if (teamName.trim()) {
			createMutation.mutate(teamName.trim())
		}
	}

	const handleUpdateTeam = () => {
		if (teamName.trim() && selectedTeam) {
			updateMutation.mutate({ id: selectedTeam.id, name: teamName.trim() })
		}
	}

	const handleDeleteTeam = () => {
		if (selectedTeam) {
			deleteMutation.mutate(selectedTeam.id)
		}
	}

	const handleInvite = () => {
		if (inviteEmail.trim() && selectedTeam) {
			inviteMutation.mutate({
				teamId: selectedTeam.id,
				email: inviteEmail.trim(),
				role: inviteRole
			})
		}
	}

	const handleClose = () => {
		setView('list')
		setSelectedTeam(null)
		setTeamName('')
		setError(null)
		onClose()
	}

	const handleBack = () => {
		setView('list')
		setSelectedTeam(null)
		setTeamName('')
		setError(null)
	}

	if (!isOpen) return null

	const getRoleIcon = (role: 'owner' | 'editor' | 'viewer') => {
		if (role === 'owner') return <Crown className="w-4 h-4 text-yellow-500" />
		if (role === 'editor') return <Shield className="w-4 h-4 text-blue-500" />
		return <Eye className="w-4 h-4 text-gray-500" />
	}

	return (
		<>
			<div className="manage-teams-overlay">
				{/* Backdrop */}
				<div className="manage-teams-backdrop" onClick={handleClose} />

				{/* Dialog */}
				<div className="manage-teams-dialog">
					{/* Header */}
					<div className="manage-teams-header">
						<div className="manage-teams-header-content">
							{view !== 'list' && (
								<Button onClick={handleBack} variant="ghost" size="icon">
									<ChevronLeft className="w-5 h-5" />
								</Button>
							)}
							<h2 className="manage-teams-title">
								{view === 'list' && 'Manage Teams'}
								{view === 'create' && 'Create Team'}
								{view === 'edit' && 'Edit Team'}
								{view === 'members' && selectedTeam?.name}
							</h2>
						</div>
						<Button onClick={handleClose} variant="ghost" size="icon">
							<X className="w-5 h-5" />
						</Button>
					</div>

					{/* Content */}
					<div className="manage-teams-content">
						{error && (
							<div className="manage-teams-error">
								{error}
							</div>
						)}

						{/* List View */}
						{view === 'list' && (
							<div className="manage-teams-list">
								{isLoading ? (
									<div className="manage-teams-loading">Loading teams...</div>
								) : teams.length === 0 ? (
									<div className="manage-teams-empty">No teams yet. Create one to get started!</div>
								) : (
									teams.map((team) => (
										<div
											key={team.id}
											className="manage-teams-item"
										>
											<div className="manage-teams-item-info">
												<Users className="w-5 h-5 text-muted-foreground" />
												<div className="manage-teams-item-details">
													<div className="manage-teams-item-name">{team.name}</div>
													<div className="manage-teams-item-role">
														{getRoleIcon(team.role)}
														<span>{team.role}</span>
													</div>
												</div>
											</div>
											<div className="manage-teams-item-actions">
												<Button
													onClick={() => handleSelectTeam(team)}
													variant="outline"
													size="sm"
												>
													<UserPlus className="w-4 h-4 mr-2" />
													Manage Members
												</Button>
												{team.role === 'owner' && (
													<Button
														onClick={() => handleEditTeam(team)}
														variant="ghost"
														size="icon"
													>
														<Edit2 className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
									))
								)}
								<Button
									onClick={() => setView('create')}
									className="w-full"
									variant="outline"
								>
									<Plus className="w-4 h-4 mr-2" />
									Create New Team
								</Button>
							</div>
						)}

						{/* Create View */}
						{view === 'create' && (
							<div className="manage-teams-form">
								<div>
									<label className="manage-teams-form-label">Team Name</label>
									<Input
										type="text"
										value={teamName}
										onChange={(e) => setTeamName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleCreateTeam()
											}
										}}
										placeholder="Enter team name..."
										autoFocus
									/>
								</div>
								<div className="manage-teams-form-actions">
									<Button onClick={handleBack} variant="outline">
										Cancel
									</Button>
									<Button
										onClick={handleCreateTeam}
										disabled={!teamName.trim() || createMutation.isPending}
									>
										{createMutation.isPending ? 'Creating...' : 'Create Team'}
									</Button>
								</div>
							</div>
						)}

						{/* Edit View */}
						{view === 'edit' && selectedTeam && (
							<div className="manage-teams-form">
								<div>
									<label className="manage-teams-form-label">Team Name</label>
									<Input
										type="text"
										value={teamName}
										onChange={(e) => setTeamName(e.target.value)}
										placeholder="Enter team name..."
										autoFocus
									/>
								</div>
								<div className="manage-teams-form-actions-split">
									<Button
										onClick={() => setDeleteConfirmOpen(true)}
										variant="destructive"
										disabled={deleteMutation.isPending}
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete Team
									</Button>
									<div>
										<Button onClick={handleBack} variant="outline">
											Cancel
										</Button>
										<Button
											onClick={handleUpdateTeam}
											disabled={!teamName.trim() || updateMutation.isPending}
										>
											{updateMutation.isPending ? 'Saving...' : 'Save Changes'}
										</Button>
									</div>
								</div>
							</div>
						)}

						{/* Members View */}
						{view === 'members' && selectedTeam && (
							<div className="manage-teams-members">
								{/* Members List */}
								<div>
									<h3 className="manage-teams-section-title">Members</h3>
									<div className="manage-teams-member-list">
										{membersData?.members.map((member) => (
											<div
												key={member.id}
												className="manage-teams-member"
											>
												<div className="manage-teams-member-info">
													<div>
														{getRoleIcon(member.role)}
													</div>
													<div>
														<div className="manage-teams-member-name">
															{member.user_name}
															{member.user_id === user?.id && ' (you)'}
														</div>
														<div className="manage-teams-member-email">{member.user_email}</div>
													</div>
												</div>
												{selectedTeam.role === 'owner' && member.user_id !== user?.id && (
													<div className="manage-teams-member-actions">
														<Select
															value={member.role}
															onValueChange={(value) =>
																roleMutation.mutate({
																	teamId: selectedTeam.id,
																	userId: member.user_id,
																	role: value as 'owner' | 'editor' | 'viewer'
																})
															}
														>
															<SelectTrigger className="manage-teams-select-width">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="owner">Owner</SelectItem>
																<SelectItem value="editor">Editor</SelectItem>
																<SelectItem value="viewer">Viewer</SelectItem>
															</SelectContent>
														</Select>
														<Button
															onClick={() => setRemoveMemberConfirm({ userId: member.user_id, name: member.user_name })}
															variant="ghost"
															size="icon"
														>
															<Trash2 className="w-4 h-4 text-destructive" />
														</Button>
													</div>
												)}
											</div>
										))}
									</div>
								</div>

								{/* Pending Invitations */}
								{selectedTeam.role === 'owner' && membersData?.pendingInvitations && membersData.pendingInvitations.length > 0 && (
									<div>
										<Separator />
										<h3 className="manage-teams-section-title manage-teams-section-title-spacing">Pending Invitations</h3>
										<div className="manage-teams-member-list">
											{membersData.pendingInvitations.map((invitation) => (
												<div
													key={invitation.id}
													className="manage-teams-invitation"
												>
													<div className="manage-teams-invitation-info">
														<Mail className="w-4 h-4 text-muted-foreground" />
														<div>
															<div className="manage-teams-invitation-email">{invitation.email}</div>
															<div className="manage-teams-invitation-role">{invitation.role}</div>
														</div>
													</div>
													<Button
														onClick={() =>
															cancelInviteMutation.mutate({
																teamId: selectedTeam.id,
																invitationId: invitation.id
															})
														}
														variant="ghost"
														size="icon"
													>
														<X className="w-4 h-4" />
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Invite Form */}
								{selectedTeam.role === 'owner' && (
									<div>
										<Separator />
										<h3 className="manage-teams-section-title manage-teams-section-title-spacing">Invite Member</h3>
										<div className="manage-teams-invite-form">
											<Input
												type="email"
												value={inviteEmail}
												onChange={(e) => setInviteEmail(e.target.value)}
												placeholder="Email address"
												className="manage-teams-invite-email"
											/>
											<Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'editor' | 'viewer')}>
												<SelectTrigger className="manage-teams-select-width">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="viewer">Viewer</SelectItem>
													<SelectItem value="editor">Editor</SelectItem>
												</SelectContent>
											</Select>
											<Button
												onClick={handleInvite}
												disabled={!inviteEmail.trim() || inviteMutation.isPending}
											>
												<UserPlus className="w-4 h-4 mr-2" />
												{inviteMutation.isPending ? 'Sending...' : 'Send'}
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Team?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{selectedTeam?.name}"? This will remove all members and cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteTeam} variant="destructive">
							Delete Team
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Remove Member Confirmation Dialog */}
			<AlertDialog open={!!removeMemberConfirm} onOpenChange={() => setRemoveMemberConfirm(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove {removeMemberConfirm?.name} from the team?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (removeMemberConfirm && selectedTeam) {
									removeMutation.mutate({
										teamId: selectedTeam.id,
										userId: removeMemberConfirm.userId
									})
								}
							}}
							variant="destructive"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
