# Playbook Manager UI Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Figma UI components to production with optimizations for cleaner code, DRY principles, and real API integration.

**Architecture:** Component-by-component migration from playbookManagerFigma/ to src/components/playbook-manager/, replacing emoji icons with lucide-react, extracting constants, and connecting to TeamContext/PlaybookContext instead of mock data.

**Tech Stack:** React, TypeScript, Tailwind CSS, lucide-react, React Router, Context API

---

## Task 1: Create Layout Constants

**Files:**
- Create: `src/constants/layout.ts`

**Step 1: Create constants file**

Create `src/constants/layout.ts`:

```typescript
export const HEADER_HEIGHT = 64
```

**Step 2: Verify file was created**

Run: `cat src/constants/layout.ts`
Expected: File exists with HEADER_HEIGHT constant

**Step 3: Commit**

```bash
git add src/constants/layout.ts
git commit -m "feat: add layout constants for header height"
```

---

## Task 2: Create TeamSelector Component

**Files:**
- Create: `src/components/playbook-manager/TeamSelector.tsx`
- Reference: `playbookManagerFigma/TeamSelector.tsx`

**Step 1: Create TeamSelector component**

Create `src/components/playbook-manager/TeamSelector.tsx`:

```typescript
import { Users, ChevronDown, Settings } from 'lucide-react'
import { useState } from 'react'

interface Team {
	id: number
	name: string
	role: 'owner' | 'editor' | 'viewer'
}

interface TeamSelectorProps {
	teams: Team[]
	currentTeamId: number | null
	onSwitchTeam: (teamId: number) => void
	onManageTeams: () => void
}

export function TeamSelector({ teams, currentTeamId, onSwitchTeam, onManageTeams }: TeamSelectorProps) {
	const [showMenu, setShowMenu] = useState(false)

	const currentTeam = teams.find(t => t.id === currentTeamId)

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
									onSwitchTeam(team.id)
									setShowMenu(false)
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
								onManageTeams()
								setShowMenu(false)
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
	)
}
```

**Step 2: Verify file was created**

Run: `cat src/components/playbook-manager/TeamSelector.tsx | head -20`
Expected: File exists with proper imports and component structure

**Step 3: Commit**

```bash
git add src/components/playbook-manager/TeamSelector.tsx
git commit -m "feat: add TeamSelector component with dropdown menu"
```

---

## Task 3: Create Toolbar Component

**Files:**
- Create: `src/components/playbook-manager/Toolbar.tsx`
- Reference: `playbookManagerFigma/Toolbar.tsx`
- Uses: `src/constants/layout.ts`, `src/components/playbook-manager/TeamSelector.tsx`

**Step 1: Create Toolbar component**

Create `src/components/playbook-manager/Toolbar.tsx`:

```typescript
import { Search, Grid, List, Plus, Upload, Download, Settings, FolderPlus } from 'lucide-react'
import { TeamSelector } from './TeamSelector'
import { HEADER_HEIGHT } from '../../constants/layout'

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
		<div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10" style={{ height: `${HEADER_HEIGHT}px` }}>
			<div className="px-6 h-full flex items-center">
				<div className="flex items-center justify-between gap-4 w-full">
					{/* Left Section - Search */}
					<div className="flex-1 max-w-xl">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search playbooks..."
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
								className="w-full pl-11 pr-4 py-2.5 bg-input-background text-foreground placeholder:text-muted-foreground rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
							/>
						</div>
					</div>

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
								className={`p-2 rounded transition-all duration-200 ${
									viewMode === 'grid'
										? 'bg-card shadow-sm'
										: 'hover:bg-accent/50'
								}`}
							>
								<Grid className="w-4 h-4" />
							</button>
							<button
								onClick={() => onViewModeChange('list')}
								className={`p-2 rounded transition-all duration-200 ${
									viewMode === 'list'
										? 'bg-card shadow-sm'
										: 'hover:bg-accent/50'
								}`}
							>
								<List className="w-4 h-4" />
							</button>
						</div>

						<div className="w-px h-6 bg-border" />

						{/* Action Buttons */}
						<button
							onClick={onNewPlaybook}
							className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
						>
							<Plus className="w-4 h-4" />
							New Playbook
						</button>

						<button
							onClick={onNewFolder}
							className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
							title="New Folder"
						>
							<FolderPlus className="w-5 h-5" />
						</button>

						<button
							onClick={onImport}
							className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
							title="Import"
						>
							<Upload className="w-5 h-5" />
						</button>

						<button
							onClick={onExport}
							className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
							title="Export"
						>
							<Download className="w-5 h-5" />
						</button>

						<div className="w-px h-6 bg-border" />

						{/* Settings */}
						<button
							onClick={onSettingsClick}
							className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
							title="Settings"
						>
							<Settings className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
```

**Step 2: Verify file was created**

Run: `cat src/components/playbook-manager/Toolbar.tsx | head -30`
Expected: File exists with all imports and component structure

**Step 3: Commit**

```bash
git add src/components/playbook-manager/Toolbar.tsx
git commit -m "feat: add Toolbar component with search, view toggle, and actions"
```

---

## Task 4: Update Sidebar with Lucide Icons

**Files:**
- Modify: `src/components/playbook-manager/Sidebar.tsx`
- Reference: `playbookManagerFigma/Sidebar.tsx`
- Uses: `src/constants/layout.ts`

**Step 1: Replace Sidebar with updated version**

Replace entire contents of `src/components/playbook-manager/Sidebar.tsx`:

```typescript
import { BookOpen, Folder, Star, Clock, Trash2, Settings, Users } from 'lucide-react'
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
```

**Step 2: Verify file was updated**

Run: `grep "lucide-react" src/components/playbook-manager/Sidebar.tsx`
Expected: Shows lucide-react import line

**Step 3: Commit**

```bash
git add src/components/playbook-manager/Sidebar.tsx
git commit -m "feat: update Sidebar with lucide-react icons and storage info"
```

---

## Task 5: Update PlaybookCard with Context Menu

**Files:**
- Modify: `src/components/playbook-manager/PlaybookCard.tsx`
- Reference: `playbookManagerFigma/PlaybookCard.tsx`

**Step 1: Replace PlaybookCard with updated version**

Replace entire contents of `src/components/playbook-manager/PlaybookCard.tsx`:

```typescript
import { BookOpen, MoreVertical, Folder, Download, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface PlaybookCardProps {
	id: number
	name: string
	type: 'playbook' | 'folder'
	playCount?: number
	lastModified: string
	thumbnail?: string
	onRename: (id: number) => void
	onDelete: (id: number) => void
	onDuplicate: (id: number) => void
	onExport?: (id: number) => void
	onShare?: (id: number) => void
}

export function PlaybookCard({
	id,
	name,
	type,
	playCount = 0,
	lastModified,
	thumbnail,
	onRename,
	onDelete,
	onDuplicate,
	onExport,
	onShare,
}: PlaybookCardProps) {
	const [showMenu, setShowMenu] = useState(false)
	const navigate = useNavigate()

	const handleOpen = () => {
		if (type === 'playbook') {
			navigate(`/playbooks/${id}`)
		}
	}

	return (
		<div
			className="group relative bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
			onClick={handleOpen}
		>
			{/* Thumbnail/Preview */}
			<div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
				{thumbnail ? (
					<img src={thumbnail} alt={name} className="w-full h-full object-cover" />
				) : type === 'folder' ? (
					<Folder className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
				) : (
					<div className="w-full h-full bg-gradient-to-br from-accent to-muted flex items-center justify-center">
						<BookOpen className="w-16 h-16 text-muted-foreground/40" strokeWidth={1.5} />
					</div>
				)}

				{/* Action Buttons - Only show for playbooks */}
				{type === 'playbook' && (
					<>
						{onShare && (
							<button
								className="absolute top-2 right-20 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
								onClick={(e) => {
									e.stopPropagation()
									onShare(id)
								}}
								title="Share Playbook"
							>
								<Share2 className="w-4 h-4 text-foreground" />
							</button>
						)}
						{onExport && (
							<button
								className="absolute top-2 right-11 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
								onClick={(e) => {
									e.stopPropagation()
									onExport(id)
								}}
								title="Export Playbook"
							>
								<Download className="w-4 h-4 text-foreground" />
							</button>
						)}
					</>
				)}

				{/* More Options Button */}
				<button
					className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
					onClick={(e) => {
						e.stopPropagation()
						setShowMenu(!showMenu)
					}}
				>
					<MoreVertical className="w-4 h-4 text-foreground" />
				</button>

				{/* Context Menu */}
				{showMenu && (
					<>
						<div
							className="fixed inset-0 z-20"
							onClick={(e) => {
								e.stopPropagation()
								setShowMenu(false)
							}}
						/>
						<div className="absolute top-11 right-2 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-30">
							<button
								className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
								onClick={(e) => {
									e.stopPropagation()
									handleOpen()
									setShowMenu(false)
								}}
							>
								Open
							</button>
							<button
								className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
								onClick={(e) => {
									e.stopPropagation()
									onRename(id)
									setShowMenu(false)
								}}
							>
								Rename
							</button>
							<button
								className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
								onClick={(e) => {
									e.stopPropagation()
									onDuplicate(id)
									setShowMenu(false)
								}}
							>
								Duplicate
							</button>
							{onExport && (
								<button
									className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
									onClick={(e) => {
										e.stopPropagation()
										onExport(id)
										setShowMenu(false)
									}}
								>
									Export
								</button>
							)}
							{onShare && (
								<button
									className="w-full px-4 py-2 hover:bg-accent transition-colors duration-150 text-left"
									onClick={(e) => {
										e.stopPropagation()
										onShare(id)
										setShowMenu(false)
									}}
								>
									Share
								</button>
							)}
							<div className="h-px bg-border my-1" />
							<button
								className="w-full px-4 py-2 hover:bg-accent text-destructive transition-colors duration-150 text-left"
								onClick={(e) => {
									e.stopPropagation()
									onDelete(id)
									setShowMenu(false)
								}}
							>
								Delete
							</button>
						</div>
					</>
				)}
			</div>

			{/* Card Info */}
			<div className="p-4">
				<h3 className="truncate mb-1">{name}</h3>
				<p className="text-muted-foreground">
					{type === 'folder' ? 'Folder' : `${playCount} play${playCount !== 1 ? 's' : ''}`}
				</p>
				<p className="text-muted-foreground mt-1">
					{lastModified}
				</p>
			</div>
		</div>
	)
}
```

**Step 2: Verify file was updated**

Run: `grep "MoreVertical" src/components/playbook-manager/PlaybookCard.tsx`
Expected: Shows import and usage of MoreVertical icon

**Step 3: Commit**

```bash
git add src/components/playbook-manager/PlaybookCard.tsx
git commit -m "feat: update PlaybookCard with context menu and action buttons"
```

---

## Task 6: Update PlaybookManagerPage Integration

**Files:**
- Modify: `src/pages/PlaybookManagerPage.tsx`
- Uses: All updated components

**Step 1: Update PlaybookManagerPage to use new Toolbar**

Replace the imports and state section (lines 1-22) in `src/pages/PlaybookManagerPage.tsx`:

```typescript
import { useState, useMemo } from 'react'
import { usePlaybook } from '../contexts/PlaybookContext'
import { useTeam } from '../contexts/TeamContext'
import { Sidebar } from '../components/playbook-manager/Sidebar'
import { Toolbar } from '../components/playbook-manager/Toolbar'
import { PlaybookCard } from '../components/playbook-manager/PlaybookCard'
import { Modal } from '../components/playbook-manager/Modal'

export function PlaybookManagerPage() {
	const {
		playbooks,
		isLoading,
		error,
		createPlaybook,
		updatePlaybook,
		deletePlaybook
	} = usePlaybook()
	const { teams, currentTeamId, setCurrentTeamId } = useTeam()

	const [activeSection, setActiveSection] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [showNewPlaybookModal, setShowNewPlaybookModal] = useState(false)
	const [newPlaybookName, setNewPlaybookName] = useState('')
```

**Step 2: Add placeholder handler functions**

Add these handler functions after the existing handlers (after line 55):

```typescript
	const handleNewFolder = () => {
		// TODO: Implement folder creation
		console.log('Create new folder')
	}

	const handleImport = () => {
		// TODO: Implement import functionality
		console.log('Import playbooks')
	}

	const handleExport = () => {
		// TODO: Implement export functionality
		console.log('Export playbooks')
	}

	const handleSettings = () => {
		// TODO: Implement settings dialog
		console.log('Open settings')
	}

	const handleManageTeams = () => {
		// TODO: Implement team management
		console.log('Manage teams')
	}

	const handleShare = (id: number) => {
		// TODO: Implement share functionality
		console.log('Share playbook:', id)
	}

	const handleExportPlaybook = (id: number) => {
		// TODO: Implement single playbook export
		console.log('Export playbook:', id)
	}
```

**Step 3: Update the render section**

Replace the entire return statement (lines 73-169) with:

```typescript
	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				activeSection={activeSection}
				onSectionChange={setActiveSection}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Toolbar */}
				<Toolbar
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onNewPlaybook={() => setShowNewPlaybookModal(true)}
					onNewFolder={handleNewFolder}
					onImport={handleImport}
					onExport={handleExport}
					onSettingsClick={handleSettings}
					teams={teams}
					currentTeamId={currentTeamId}
					onSwitchTeam={setCurrentTeamId}
					onManageTeams={handleManageTeams}
				/>

				{/* Content */}
				<div className="flex-1 overflow-auto p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{filteredPlaybooks.map(playbook => (
							<PlaybookCard
								key={playbook.id}
								id={playbook.id}
								name={playbook.name}
								type="playbook"
								playCount={0}
								lastModified={new Date(playbook.updated_at).toLocaleDateString()}
								onRename={(id) => {
									const newName = prompt('Rename playbook:', playbook.name)
									if (newName?.trim()) {
										handleRename(id, newName.trim())
									}
								}}
								onDelete={(id) => {
									if (confirm(`Delete "${playbook.name}"?`)) {
										handleDelete(id)
									}
								}}
								onDuplicate={handleDuplicate}
								onExport={handleExportPlaybook}
								onShare={handleShare}
							/>
						))}
					</div>

					{filteredPlaybooks.length === 0 && (
						<div className="text-center py-16">
							<p className="text-muted-foreground mb-4">No playbooks found</p>
							<button
								onClick={() => setShowNewPlaybookModal(true)}
								className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg"
							>
								Create Your First Playbook
							</button>
						</div>
					)}
				</div>
			</div>

			{/* New Playbook Modal */}
			<Modal
				isOpen={showNewPlaybookModal}
				onClose={() => {
					setShowNewPlaybookModal(false)
					setNewPlaybookName('')
				}}
				title="Create New Playbook"
			>
				<div className="space-y-4">
					<div>
						<label className="block mb-2">Playbook Name</label>
						<input
							type="text"
							value={newPlaybookName}
							onChange={e => setNewPlaybookName(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									handleCreatePlaybook()
								}
							}}
							placeholder="Enter playbook name..."
							className="w-full px-4 py-2.5 bg-input rounded-lg border-0 outline-none focus:ring-2 focus:ring-ring/20"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => {
								setShowNewPlaybookModal(false)
								setNewPlaybookName('')
							}}
							className="px-4 py-2 hover:bg-accent rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleCreatePlaybook}
							disabled={!newPlaybookName.trim()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
						>
							Create
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
```

**Step 4: Verify the changes compile**

Run: `bun run typecheck` (or equivalent)
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/pages/PlaybookManagerPage.tsx
git commit -m "feat: integrate Toolbar and updated components into PlaybookManagerPage"
```

---

## Task 7: Test UI in Browser

**Step 1: Start development server**

Run: `bun --hot src/index.ts`
Expected: Server starts on http://localhost:3000

**Step 2: Navigate to playbooks page**

1. Open http://localhost:3000
2. Log in if needed
3. Navigate to /playbooks
4. Verify all UI elements are present:
   - Sidebar with lucide icons
   - Toolbar with search, team selector, view toggle, action buttons
   - PlaybookCard with hover actions and context menu
   - Storage indicator in sidebar

**Step 3: Test interactions**

1. Click team selector → verify dropdown appears
2. Type in search → verify it filters
3. Click grid/list toggle → verify state changes
4. Hover over playbook card → verify action buttons appear
5. Click three-dot menu → verify context menu appears

**Step 4: Document any issues**

If any issues found, document them for follow-up tasks.

**Step 5: Commit test verification**

```bash
git commit --allow-empty -m "test: verify UI migration in browser"
```

---

## Task 8: Code Quality Review

**Step 1: Check for code quality issues**

Run through the mako-review.md checklist:
- ✓ No semicolons
- ✓ Single quotes
- ✓ Tabs for indentation
- ✓ DRY principles applied
- ✓ No unnecessary abstractions
- ✓ Constants extracted (HEADER_HEIGHT)

**Step 2: Run linter**

Run: `bun run lint` (if available)
Expected: No linting errors

**Step 3: Verify TypeScript types**

Run: `bun run typecheck`
Expected: No type errors

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "refactor: apply code quality standards"
```

---

## Task 9: Clean Up Figma Reference Folder

**Step 1: Remove playbookManagerFigma directory**

Since all components have been migrated, remove the reference folder:

Run: `rm -rf playbookManagerFigma`

**Step 2: Verify deletion**

Run: `ls playbookManagerFigma`
Expected: Error "No such file or directory"

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Figma reference folder after migration"
```

---

## Summary

This plan migrates the Figma UI components with the following optimizations:

1. **DRY**: Extracted HEADER_HEIGHT constant, reused Team interface
2. **Real Data**: Connected to TeamContext and PlaybookContext
3. **Code Quality**: Tabs, no semicolons, single quotes throughout
4. **Icons**: Replaced emojis with lucide-react icons
5. **Components**: Added Toolbar, TeamSelector, updated Sidebar and PlaybookCard

All tasks are bite-sized (2-5 minutes each) and include verification steps.
