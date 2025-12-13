import { useState, useEffect, useMemo } from 'react'
import { PlaybookEditorToolbar } from './PlaybookEditorToolbar'
import { PlayCard } from './PlayCard'
import { PlayListView } from './PlayListView'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '../ui/input'
import { SearchInput } from '../ui/search-input'
import { UnifiedSettingsDialog } from '@/components/shared/UnifiedSettingsDialog'
import { ShareDialog } from '@/components/shared/ShareDialog'
import { AnimationDialog } from '@/components/animation/AnimationDialog'
import { CallSheetExportDialog } from '@/components/export/CallSheetExportDialog'
import { useTheme } from '@/contexts/SettingsContext'
import { usePlaybookData } from '@/hooks/usePlaybookData'
import { useConceptData } from '@/hooks/useConceptData'
import { ConceptCard } from './ConceptCard'
import type { ConceptFilter } from './ConceptsToolbar'
import { ConceptDialog } from '@/components/concepts/ConceptDialog'
import type { BaseConcept } from '@/types/concept.types'
import { IconButton } from '../ui/icon-button'
import { ViewToggle } from '../ui/view-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import './playbook-editor.css'

type ConceptType = 'concept' | 'formation' | 'group'

type ConceptItem = {
	id: number
	name: string
	type: ConceptType
	thumbnail: string | null
	description: string | null
	isMotion?: boolean
	isModifier?: boolean
	updatedAt: string
}

type ConceptToDelete = {
	id: number
	type: ConceptType
}

// Concept filters
const CONCEPT_FILTERS = [
	{ id: 'all' as const, label: 'All' },
	{ id: 'routes' as const, label: 'Routes' },
	{ id: 'motions' as const, label: 'Motions' },
	{ id: 'modifiers' as const, label: 'Modifiers' },
	{ id: 'formations' as const, label: 'Formations' },
	{ id: 'groups' as const, label: 'Groups' },
]

import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  Settings,
  Upload,
  Download,
  Share2,
  Plus,
  FolderPlus,
} from 'lucide-react'
import {
  PLAY_TYPE_PASS,
  VIEW_MODE_GRID,
  VIEW_MODE_LIST,
  DEFAULT_PLAYBOOK_NAME,
} from './constants/playbook'
import type { Play, Section } from './types'

interface PlaybookEditorProps {
  playbookId?: string
  playbookName?: string
  teamId?: string
  teamName?: string
  onBack?: () => void
  onOpenPlay?: (playId: string) => void
  onImport?: () => void
  onExport?: (selectedPlayIds?: string[]) => void
}

const DARK_MODE_CLASS = 'dark'
const LOCALE_OPTIONS = {
  month: 'short' as const,
  day: 'numeric' as const,
  year: 'numeric' as const,
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', LOCALE_OPTIONS)
}

function PlaybookEditorContent({
  playbookId,
  playbookName = DEFAULT_PLAYBOOK_NAME,
  teamId,
  teamName,
  onBack,
  onOpenPlay,
  onImport,
  onExport
}: PlaybookEditorProps) {
  const {
    theme,
    setTheme,
    positionNaming,
    setPositionNaming,
    fieldLevel,
    setFieldLevel
  } = useTheme()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const cached = localStorage.getItem('playbook-view-mode')
    return (cached === 'grid' || cached === 'list') ? cached : VIEW_MODE_GRID
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewPlayModal, setShowNewPlayModal] = useState(false)
  const [showNewSectionModal, setShowNewSectionModal] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [renamePlayId, setRenamePlayId] = useState<string | null>(null)
  const [renamePlayName, setRenamePlayName] = useState('')
  const [deletePlayId, setDeletePlayId] = useState<string | null>(null)
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set())
  const [activeSectionFilter, setActiveSectionFilter] = useState<string | null>(null)
  const [showPlayViewer, setShowPlayViewer] = useState(false)
  const [viewingPlayId, setViewingPlayId] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Concepts tab state
  const [activeTab, setActiveTab] = useState<'plays' | 'concepts'>('plays')
  const [conceptFilter, setConceptFilter] = useState<ConceptFilter>('all')
  const [showConceptDialog, setShowConceptDialog] = useState(false)
  const [editingConcept, setEditingConcept] = useState<BaseConcept | null>(null)
  const [showDeleteConceptModal, setShowDeleteConceptModal] = useState(false)
  const [conceptToDelete, setConceptToDelete] =
    useState<ConceptToDelete | null>(null)

  const {
    sections,
    isLoading: isLoadingData,
    error: dataError,
    createPlay,
    updatePlay,
    deletePlay,
    duplicatePlay,
    createSection,
    updateSection,
    deleteSection
  } = usePlaybookData(playbookId)

  // Fetch concept data
  const {
    concepts,
    formations,
    conceptGroups,
    isLoading: conceptsLoading,
    createConcept,
    updateConcept,
    deleteConcept,
    deleteFormation,
    deleteConceptGroup,
  } = useConceptData(teamId ?? '', playbookId)

  useEffect(() => {
    if (theme == DARK_MODE_CLASS) {
      document.documentElement.classList.add(DARK_MODE_CLASS)
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS)
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem('playbook-view-mode', viewMode)
  }, [viewMode])

  // Concept filtering (must be before early returns to follow Rules of Hooks)
  const filteredConcepts = useMemo(() => {
    let items: ConceptItem[] = []

    // Formations
    if (conceptFilter === 'all' || conceptFilter === 'formations') {
      items.push(
        ...formations.map(f => ({
          id: f.id,
          name: f.name,
          type: 'formation' as const,
          thumbnail: f.thumbnail,
          description: f.description,
          updatedAt: new Date(f.updated_at).toLocaleDateString(),
        }))
      )
    }

    // Concepts (routes, motions, modifiers)
    if (conceptFilter !== 'formations' && conceptFilter !== 'groups') {
      const conceptItems = concepts
        .filter(c => {
          if (conceptFilter === 'all') return true
          if (conceptFilter === 'routes') {
            return !c.is_motion && !c.is_modifier
          }
          if (conceptFilter === 'motions') return c.is_motion
          if (conceptFilter === 'modifiers') return c.is_modifier
          return false
        })
        .map(c => ({
          id: c.id,
          name: c.name,
          type: 'concept' as const,
          thumbnail: c.thumbnail,
          description: c.description,
          isMotion: c.is_motion,
          isModifier: c.is_modifier,
          updatedAt: new Date(c.updated_at).toLocaleDateString(),
        }))
      items.push(...conceptItems)
    }

    // Groups
    if (conceptFilter === 'all' || conceptFilter === 'groups') {
      items.push(
        ...conceptGroups.map(g => ({
          id: g.id,
          name: g.name,
          type: 'group' as const,
          thumbnail: g.thumbnail,
          description: g.description,
          updatedAt: new Date(g.updated_at).toLocaleDateString(),
        }))
      )
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(query)
      )
    }

    return items
  }, [concepts, formations, conceptGroups, conceptFilter, searchQuery])

  // Show loading state
  if (isLoadingData) {
    return (
      <div className="playbook-editor-loading">
        <div className="playbook-editor-loading-content">
          <div className="playbook-editor-spinner"></div>
          <p className="playbook-editor-loading-text">Loading playbook...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (dataError) {
    return (
      <div className="playbook-editor-error">
        <div className="playbook-editor-error-content">
          <h1 className="playbook-editor-error-title">Error</h1>
          <p className="playbook-editor-error-message">{dataError}</p>
          <button
            onClick={onBack}
            className="playbook-editor-error-button"
          >
            Back to Playbooks
          </button>
        </div>
      </div>
    )
  }

  const allPlays = sections.flatMap((section) =>
    section.plays.map((play) => ({ ...play, sectionId: section.id }))
  )

  const filteredSections = sections.map((section) => ({
    ...section,
    plays: section.plays.filter(
      (play) =>
        play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.formation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.tags.some((tag) => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ),
  })).filter((section) => section.plays.length > 0)

  const displayedSections = activeSectionFilter
    ? filteredSections.filter((section) => section.id == activeSectionFilter)
    : filteredSections

  // Concept handlers
  const handleEditConcept = (id: number, type: ConceptType) => {
    if (type === 'concept') {
      const concept = concepts.find(c => c.id === id)
      if (concept) {
        setEditingConcept(concept)
        setShowConceptDialog(true)
      }
    }
    // TODO: Formation/group editing in future
  }

  const handleDeleteConcept = (id: number, type: ConceptType) => {
    setConceptToDelete({ id, type })
    setShowDeleteConceptModal(true)
  }

  const confirmDeleteConcept = async () => {
    if (!conceptToDelete) return
    const { id, type } = conceptToDelete
    if (type === 'concept') await deleteConcept(id)
    else if (type === 'formation') await deleteFormation(id)
    else if (type === 'group') await deleteConceptGroup(id)
    setShowDeleteConceptModal(false)
    setConceptToDelete(null)
  }

  const handleDuplicateConcept = async (id: number, type: ConceptType) => {
    // TODO: Implement duplication
  }

  const handleSaveConcept = async (data: Partial<BaseConcept>) => {
    if (editingConcept) {
      await updateConcept(editingConcept.id, data)
    } else {
      await createConcept(data)
    }
    setShowConceptDialog(false)
    setEditingConcept(null)
  }

  async function handleNewPlay() {
    if (!newItemName.trim()) return

    try {
      const sectionId = sections.length > 0 ? sections[0].id : null
      const newPlay = await createPlay(newItemName, sectionId)

      setNewItemName('')
      setShowNewPlayModal(false)

      if (onOpenPlay) {
        onOpenPlay(newPlay.id)
      }
    } catch (err) {
      console.error('Failed to create play:', err)
      alert(err instanceof Error ? err.message : 'Failed to create play')
    }
  }

  async function handleNewSection() {
    if (!newItemName.trim()) return

    try {
      await createSection(newItemName)
      setNewItemName('')
      setShowNewSectionModal(false)
    } catch (err) {
      console.error('Failed to create section:', err)
      alert(err instanceof Error ? err.message : 'Failed to create section')
    }
  }

  function handleOpenPlay(playId: string) {
    if (onOpenPlay) {
      onOpenPlay(playId)
    }
  }

  function handleAnimatePlay(playId: string) {
    setViewingPlayId(playId)
    setShowPlayViewer(true)
  }

  function handleClosePlayViewer() {
    setShowPlayViewer(false)
    setViewingPlayId(null)
  }

  function handleRenamePlay(playId: string) {
    const play = allPlays.find((p) => p.id == playId)
    if (!play) return

    setRenamePlayId(playId)
    setRenamePlayName(play.name)
    setShowRenameModal(true)
  }

  async function confirmRename() {
    if (!renamePlayId || !renamePlayName.trim()) return

    try {
      await updatePlay(renamePlayId, { name: renamePlayName })
      setShowRenameModal(false)
      setRenamePlayId(null)
      setRenamePlayName('')
    } catch (err) {
      console.error('Failed to rename play:', err)
      alert(err instanceof Error ? err.message : 'Failed to rename play')
    }
  }

  function handleDeletePlay(playId: string) {
    setDeletePlayId(playId)
    setShowDeleteConfirmModal(true)
  }

  async function confirmDelete() {
    if (!deletePlayId) return

    try {
      await deletePlay(deletePlayId)
      setShowDeleteConfirmModal(false)
      setDeletePlayId(null)
    } catch (err) {
      console.error('Failed to delete play:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete play')
    }
  }

  async function handleDuplicatePlay(playId: string) {
    try {
      await duplicatePlay(playId)
    } catch (err) {
      console.error('Failed to duplicate play:', err)
      alert(err instanceof Error ? err.message : 'Failed to duplicate play')
    }
  }

  function handleImport() {
    if (onImport) {
      onImport()
    }
  }

  function handleExport() {
    setShowExportDialog(true)
  }

  function handleShare(
    recipients: Array<{ email: string; role: 'viewer' | 'collaborator' }>
  ) {
  }

  function togglePlaySelection(playId: string) {
    const newSelection = new Set(selectedPlays)
    if (newSelection.has(playId)) {
      newSelection.delete(playId)
    } else {
      newSelection.add(playId)
    }
    setSelectedPlays(newSelection)
  }

  function closeNewPlayModal() {
    setShowNewPlayModal(false)
    setNewItemName('')
  }

  function closeNewSectionModal() {
    setShowNewSectionModal(false)
    setNewItemName('')
  }

  function closeRenameModal() {
    setShowRenameModal(false)
    setRenamePlayId(null)
    setRenamePlayName('')
  }

  function closeDeleteConfirmModal() {
    setShowDeleteConfirmModal(false)
    setDeletePlayId(null)
  }

  const totalPlays = allPlays.length
  const exportTitle = selectedPlays.size > 0 
    ? `Export ${selectedPlays.size} selected` 
    : 'Export All'

  return (
    <div className="playbook-editor">
      <div className="playbook-editor-main">
        <div className="playbook-editor-header">
          <div className="playbook-editor-header-content">
            <div className="playbook-editor-header-left">
              <TooltipProvider>
                <IconButton
                  icon={ArrowLeft}
                  tooltip="Back to Playbooks"
                  onClick={onBack}
                  variant="ghost"
                />
              </TooltipProvider>
              <div>
                <div className="playbook-editor-title-row">
                  <h1>{playbookName}</h1>
                  {teamName && (
                    <span className="playbook-editor-team-name">
                      {teamName}
                    </span>
                  )}
                </div>
              </div>

              <div className="playbook-editor-header-divider" />

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search plays, formations, tags..."
                className="playbook-editor-search-input"
              />
            </div>

            <div className="playbook-editor-header-right">
              <TooltipProvider>
                <IconButton
                  icon={Upload}
                  tooltip="Import Plays"
                  onClick={handleImport}
                  variant="ghost"
                />
                <IconButton
                  icon={Download}
                  tooltip={exportTitle}
                  onClick={handleExport}
                  variant="ghost"
                />

                <div className="playbook-editor-header-divider-small" />

                <IconButton
                  icon={Share2}
                  tooltip="Share"
                  onClick={() => setShowShareDialog(true)}
                  variant="ghost"
                />

                <div className="playbook-editor-header-divider-small" />

                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

                <div className="playbook-editor-header-divider-small" />

                <IconButton
                  icon={Settings}
                  tooltip="Settings"
                  onClick={() => setShowSettingsDialog(true)}
                  variant="ghost"
                />
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Combined Tab Bar and Toolbar */}
        <div className="playbook-editor-tabs">
          <div className="playbook-editor-tabs-content">
            {/* Tabs */}
            <div className="playbook-editor-tabs-list">
              {(['plays', 'concepts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`playbook-editor-tab ${
                      activeTab === tab
                        ? 'playbook-editor-tab-active'
                        : 'playbook-editor-tab-inactive'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="playbook-editor-tabs-divider" />

            {/* Conditional Toolbar Content */}
            {activeTab === 'plays' ? (
              <>
                <div className="playbook-editor-toolbar-buttons">
                  <button
                    onClick={() => setShowNewPlayModal(true)}
                    className="playbook-editor-action-button playbook-editor-action-button--primary"
                  >
                    <Plus className="icon-sm" />
                    <span>New Play</span>
                  </button>

                  <button
                    onClick={() => setShowNewSectionModal(true)}
                    className="playbook-editor-action-button playbook-editor-action-button--secondary"
                    title="Create New Section"
                  >
                    <FolderPlus className="icon-sm" />
                    <span>New Section</span>
                  </button>
                </div>

                <div className="playbook-editor-tabs-divider" />

                <div className="playbook-editor-filter-buttons">
                  <button
                    onClick={() => setActiveSectionFilter(null)}
                    className={`playbook-editor-filter-button ${
                      activeSectionFilter == null
                        ? 'playbook-editor-filter-button--active'
                        : 'playbook-editor-filter-button--inactive'
                    }`}
                  >
                    All Plays
                  </button>

                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionFilter(section.id)}
                      className={`playbook-editor-filter-button ${
                        activeSectionFilter == section.id
                          ? 'playbook-editor-filter-button--active'
                          : 'playbook-editor-filter-button--inactive'
                      }`}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingConcept(null)
                    setShowConceptDialog(true)
                  }}
                  className="playbook-editor-action-button playbook-editor-action-button--primary"
                >
                  <Plus className="icon-sm" />
                  <span>New Concept</span>
                </button>

                <div className="playbook-editor-tabs-divider" />

                <div className="playbook-editor-filter-buttons">
                  {CONCEPT_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setConceptFilter(filter.id)}
                      className={`playbook-editor-filter-button ${
                        conceptFilter === filter.id
                          ? 'playbook-editor-filter-button--active'
                          : 'playbook-editor-filter-button--inactive'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {activeTab === 'plays' ? (
          <>
            <div className="playbook-editor-content">
            {displayedSections.length > 0 ? (
              <div className="playbook-editor-sections">
                {displayedSections.map((section) => (
                  <div key={section.id}>
                    <div className="playbook-editor-section-header">
                      {section.section_type === 'ideas' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h2 className="playbook-editor-section-title-help">{section.name}</h2>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="playbook-editor-tooltip-text">
                                Ideas & Experiments - plays here are in development. All team members can contribute ideas. These aren't required learning.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <h2>{section.name}</h2>
                      )}
                      <p className="playbook-editor-section-count">
                        {section.plays.length} play
                        {section.plays.length != 1 ? 's' : ''}
                      </p>
                    </div>

                    {section.plays.length === 0 && section.section_type === 'ideas' ? (
                      <div className="playbook-editor-ideas-empty">
                        <p className="playbook-editor-ideas-empty-text">
                          This is a space for play ideas and experiments. Anyone on the team can add their ideas here - they won't be part of the main playbook until a coach promotes them.
                        </p>
                      </div>
                    ) : viewMode == VIEW_MODE_GRID ? (
                      <div className="playbook-editor-grid">
                        {section.plays.map((play) => (
                          <PlayCard
                            key={play.id}
                            {...play}
                            selected={selectedPlays.has(play.id)}
                            onSelect={() => togglePlaySelection(play.id)}
                            onOpen={handleOpenPlay}
                            onAnimate={handleAnimatePlay}
                            onRename={handleRenamePlay}
                            onDelete={handleDeletePlay}
                            onDuplicate={handleDuplicatePlay}
                          />
                        ))}
                      </div>
                    ) : section.plays.length > 0 ? (
                      <PlayListView
                        plays={section.plays}
                        selectedPlays={selectedPlays}
                        onSelect={togglePlaySelection}
                        onOpen={handleOpenPlay}
                        onAnimate={handleAnimatePlay}
                        onRename={handleRenamePlay}
                        onDelete={handleDeletePlay}
                        onDuplicate={handleDuplicatePlay}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="playbook-editor-empty">
                  <p className="playbook-editor-empty-text">
                    {searchQuery 
                      ? 'No plays found matching your search' 
                      : 'No plays in this playbook'
                    }
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewPlayModal(true)}
                      className="playbook-editor-empty-button"
                    >
                      Create Your First Play
                    </button>
                  )}
              </div>
            )}
            </div>
          </>
        ) : (
          <div className="playbook-editor-content">
              {conceptsLoading ? (
                <div className="playbook-editor-concepts-loading">
                  <p className="playbook-editor-concepts-loading-text">Loading concepts...</p>
                </div>
              ) : filteredConcepts.length === 0 ? (
                <div className="playbook-editor-concepts-empty">
                  <p className="playbook-editor-concepts-empty-text">No concepts found</p>
                  <button
                    onClick={() => {
                      setEditingConcept(null)
                      setShowConceptDialog(true)
                    }}
                    className="playbook-editor-empty-button"
                  >
                    Create your first concept
                  </button>
                </div>
              ) : (
                <div className="playbook-editor-grid">
                  {filteredConcepts.map((item) => (
                    <ConceptCard
                      key={`${item.type}-${item.id}`}
                      id={item.id}
                      name={item.name}
                      type={item.type}
                      thumbnail={item.thumbnail}
                      description={item.description}
                      isMotion={item.isMotion}
                      isModifier={item.isModifier}
                      lastModified={item.updatedAt}
                      onEdit={handleEditConcept}
                      onDelete={handleDeleteConcept}
                      onDuplicate={handleDuplicateConcept}
                    />
                  ))}
                </div>
              )}
            </div>
        )}
      </div>

      {/* Concept Dialog */}
      <ConceptDialog
        isOpen={showConceptDialog}
        onClose={() => {
          setShowConceptDialog(false)
          setEditingConcept(null)
        }}
        mode={editingConcept ? 'edit' : 'create'}
        concept={editingConcept ?? undefined}
        teamId={teamId ?? ''}
        playbookId={playbookId}
        onSave={handleSaveConcept}
      />

      {/* Delete Concept Confirmation */}
      <Dialog open={showDeleteConceptModal} onOpenChange={setShowDeleteConceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Concept</DialogTitle>
          </DialogHeader>
          <p className="playbook-editor-modal-message">
            Are you sure you want to delete this {conceptToDelete?.type}? This action cannot be undone.
          </p>
          <div className="playbook-editor-modal-actions">
            <button onClick={() => setShowDeleteConceptModal(false)} className="playbook-editor-modal-button playbook-editor-modal-button--secondary">
              Cancel
            </button>
            <button onClick={confirmDeleteConcept} className="playbook-editor-modal-button playbook-editor-modal-button--destructive">
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewPlayModal} onOpenChange={setShowNewPlayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Play</DialogTitle>
          </DialogHeader>
          <div className="playbook-editor-modal-content">
            <div>
              <label className="playbook-editor-modal-label">Play Name</label>
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key == 'Enter') {
                    handleNewPlay()
                  }
                }}
                placeholder="Enter play name..."
                autoFocus
              />
            </div>
            <div className="playbook-editor-modal-actions">
              <button onClick={closeNewPlayModal} className="playbook-editor-modal-button playbook-editor-modal-button--secondary">
                Cancel
              </button>
              <button
                onClick={handleNewPlay}
                disabled={!newItemName.trim()}
                className="playbook-editor-modal-button playbook-editor-modal-button--primary"
              >
                Create
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewSectionModal} onOpenChange={setShowNewSectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
          </DialogHeader>
          <div className="playbook-editor-modal-content">
            <div>
              <label className="playbook-editor-modal-label">Section Name</label>
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key == 'Enter') {
                    handleNewSection()
                  }
                }}
                placeholder="Enter section name..."
                autoFocus
              />
            </div>
            <div className="playbook-editor-modal-actions">
              <button
                onClick={closeNewSectionModal}
                className="playbook-editor-modal-button playbook-editor-modal-button--secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleNewSection}
                disabled={!newItemName.trim()}
                className="playbook-editor-modal-button playbook-editor-modal-button--primary"
              >
                Create
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnifiedSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        context="playbook-editor"
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        playbookName={playbookName}
        onShare={handleShare}
      />

      <CallSheetExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        sections={sections}
        playbookName={playbookName}
        playbookId={playbookId || ''}
      />

      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Play</DialogTitle>
          </DialogHeader>
          <div className="playbook-editor-modal-content">
            <div>
              <label className="playbook-editor-modal-label">Play Name</label>
              <Input
                type="text"
                value={renamePlayName}
                onChange={(e) => setRenamePlayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key == 'Enter') {
                    confirmRename()
                  }
                }}
                placeholder="Enter play name..."
                autoFocus
              />
            </div>
            <div className="playbook-editor-modal-actions">
              <button onClick={closeRenameModal} className="playbook-editor-modal-button playbook-editor-modal-button--secondary">
                Cancel
              </button>
              <button
                onClick={confirmRename}
                disabled={!renamePlayName.trim()}
                className="playbook-editor-modal-button playbook-editor-modal-button--primary"
              >
                Rename
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Play</DialogTitle>
          </DialogHeader>
          <div className="playbook-editor-modal-content">
            <p className="playbook-editor-modal-message">
              Are you sure you want to delete this play? This action cannot be undone.
            </p>
            <div className="playbook-editor-modal-actions">
              <button
                onClick={closeDeleteConfirmModal}
                className="playbook-editor-modal-button playbook-editor-modal-button--secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="playbook-editor-modal-button playbook-editor-modal-button--destructive"
              >
                Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Play Animation Dialog */}
      <AnimationDialog
        isOpen={showPlayViewer}
        onClose={handleClosePlayViewer}
        playId={viewingPlayId}
        playName={allPlays.find(p => p.id === viewingPlayId)?.name}
      />
    </div>
  )
}

export default function PlaybookEditor(props: PlaybookEditorProps) {
  return <PlaybookEditorContent {...props} />
}
