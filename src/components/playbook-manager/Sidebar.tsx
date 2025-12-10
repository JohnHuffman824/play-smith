interface SidebarProps {
	activeSection: string
	onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
	const sections = [
		{ id: 'all', label: 'All Playbooks', icon: '📚' },
		{ id: 'shared', label: 'Shared with me', icon: '👥' },
		{ id: 'starred', label: 'Starred', icon: '⭐' },
		{ id: 'recent', label: 'Recent', icon: '🕒' },
		{ id: 'trash', label: 'Trash', icon: '🗑️' }
	]

	return (
		<div className="w-64 bg-background border-r border-border h-full">
			<div className="p-4">
				<h2 className="text-lg font-semibold mb-4">Playbooks</h2>
				<nav className="space-y-1">
					{sections.map(section => (
						<button
							key={section.id}
							onClick={() => onSectionChange(section.id)}
							className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
								activeSection === section.id
									? 'bg-accent text-accent-foreground'
									: 'hover:bg-accent/50'
							}`}
						>
							<span className="mr-2">{section.icon}</span>
							{section.label}
						</button>
					))}
				</nav>
			</div>
		</div>
	)
}
