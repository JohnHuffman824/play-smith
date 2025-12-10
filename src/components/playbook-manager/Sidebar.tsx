import { BookOpen, Folder, Star, Clock, Trash2, Users } from 'lucide-react'
import { HEADER_HEIGHT } from '../../constants/layout'

interface SidebarProps {
	activeSection: string
	onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
	const sections = [
		{ id: 'all', label: 'All Playbooks', icon: BookOpen },
		{ id: 'shared', label: 'Shared with me', icon: Users },
		{ id: 'folders', label: 'Folders', icon: Folder },
		{ id: 'starred', label: 'Starred', icon: Star },
		{ id: 'recent', label: 'Recent', icon: Clock },
		{ id: 'trash', label: 'Trash', icon: Trash2 },
	]

	return (
		<div className="w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 flex flex-col">
			{/* Logo/Header */}
			<div className="border-b border-sidebar-border" style={{ height: `${HEADER_HEIGHT}px` }}>
				<div className="px-6 h-full flex items-center">
					<h1 className="text-sidebar-foreground">Play Smith</h1>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-3 py-4">
				<ul className="space-y-1">
					{sections.map((section) => {
						const Icon = section.icon
						const isActive = activeSection === section.id

						return (
							<li key={section.id}>
								<button
									onClick={() => onSectionChange(section.id)}
									className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
										isActive
											? 'bg-sidebar-accent text-sidebar-accent-foreground'
											: 'text-sidebar-foreground hover:bg-sidebar-accent/50'
									}`}
								>
									<Icon className="w-5 h-5" strokeWidth={1.5} />
									<span>{section.label}</span>
								</button>
							</li>
						)
					})}
				</ul>
			</nav>

			{/* Storage Info */}
			<div className="px-6 py-4 border-t border-sidebar-border">
				<div className="text-sidebar-foreground/60 mb-2">Storage</div>
				<div className="w-full h-1.5 bg-sidebar-border rounded-full overflow-hidden">
					<div className="h-full w-[45%] bg-sidebar-primary rounded-full" />
				</div>
				<div className="text-sidebar-foreground/60 mt-2">4.5 GB of 10 GB used</div>
			</div>
		</div>
	)
}
