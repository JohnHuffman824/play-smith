import { useState } from 'react'
import { BookOpen, Folder, Star, Clock, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { HEADER_HEIGHT } from '../../constants/layout'
import type { Folder as FolderType } from '../../db/types'
import './sidebar.css'

interface SidebarProps {
	activeSection: string
	onSectionChange: (section: string) => void
	folders: FolderType[]
	selectedFolderId: number | null
	onFolderSelect: (folderId: number | null) => void
}

export function Sidebar({
	activeSection,
	onSectionChange,
	folders,
	selectedFolderId,
	onFolderSelect
}: SidebarProps) {
	const [isFoldersExpanded, setIsFoldersExpanded] = useState(true)

	const sections = [
		{ id: 'all', label: 'All Playbooks', icon: BookOpen },
		{ id: 'shared', label: 'Shared with me', icon: Users },
		{ id: 'folders', label: 'Folders', icon: Folder },
		{ id: 'starred', label: 'Starred', icon: Star },
		{ id: 'recent', label: 'Recent', icon: Clock },
		{ id: 'trash', label: 'Trash', icon: Trash2 },
	]

	const handleFoldersSectionClick = () => {
		if (activeSection === 'folders') {
			// Toggle expansion when already in folders section
			setIsFoldersExpanded(!isFoldersExpanded)
		} else {
			// Switch to folders section and ensure it's expanded
			onSectionChange('folders')
			setIsFoldersExpanded(true)
			// Clear folder selection to show all folders view
			onFolderSelect(null)
		}
	}

	const handleFolderClick = (folderId: number) => {
		onSectionChange('folders')
		onFolderSelect(folderId)
		setIsFoldersExpanded(true)
	}

	return (
		<div className="playbook-sidebar">
			{/* Logo/Header */}
			<div className="border-b border-sidebar-border" style={{ height: `${HEADER_HEIGHT}px` }}>
				<div className="playbook-sidebar-header">
					<h1 className="playbook-sidebar-title">Play Smith</h1>
				</div>
			</div>

			{/* Navigation */}
			<nav className="playbook-sidebar-nav">
				<ul>
					{sections.map((section) => {
						const Icon = section.icon
						const isActive = activeSection === section.id
						const isFoldersSection = section.id === 'folders'

						return (
							<li key={section.id}>
								{/* Section Button */}
								<button
									onClick={() => isFoldersSection ? handleFoldersSectionClick() : onSectionChange(section.id)}
									className={`playbook-sidebar-section ${isActive ? 'playbook-sidebar-section-active' : ''}`}
								>
									<Icon className="w-5 h-5" strokeWidth={1.5} />
									<span className="playbook-sidebar-section-label">{section.label}</span>
									{isFoldersSection && folders.length > 0 && (
										isFoldersExpanded ? (
											<ChevronDown className="w-4 h-4" />
										) : (
											<ChevronRight className="w-4 h-4" />
										)
									)}
								</button>

								{/* Folder List (only for folders section) */}
								{isFoldersSection && isFoldersExpanded && activeSection === 'folders' && folders.length > 0 && (
									<ul className="playbook-sidebar-folders">
										{folders.map((folder) => {
											const isFolderSelected = selectedFolderId === folder.id
											return (
												<li key={folder.id}>
													<button
														onClick={() => handleFolderClick(folder.id)}
														className={`playbook-sidebar-folder ${isFolderSelected ? 'playbook-sidebar-folder-active' : ''}`}
													>
														<Folder className="w-4 h-4" strokeWidth={1.5} />
														<span className="playbook-sidebar-folder-name">{folder.name}</span>
													</button>
												</li>
											)
										})}
									</ul>
								)}
							</li>
						)
					})}
				</ul>
			</nav>
		</div>
	)
}
