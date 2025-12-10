import { useState, useEffect } from 'react'
import { PlaybookEditorToolbar } from './components/PlaybookEditorToolbar'
import { PlayCard } from './components/PlayCard'
import { PlayListView } from './components/PlayListView'
import { Modal } from './components/Modal'
import { SettingsDialog } from './components/SettingsDialog'
import { ShareDialog } from './components/ShareDialog'
import { ConfigProvider, useConfig } from './contexts/ConfigContext'
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  Settings,
  Upload,
  Download,
  Share2,
} from 'lucide-react'
import {
  PLAY_TYPE_PASS,
  VIEW_MODE_GRID,
  VIEW_MODE_LIST,
  DEFAULT_PLAYBOOK_NAME,
  BUTTON_BASE,
  INPUT_BASE,
  MODAL_BUTTON_BASE,
  PRIMARY_BUTTON_BASE,
} from './constants/playbook'

interface Play {
  id: string
  name: string
  formation: string
  playType: string
  defensiveFormation: string
  tags: string[]
  lastModified: string
  thumbnail?: string
  personnel?: string
}

interface Section {
  id: string
  name: string
  plays: Play[]
}

interface PlaybookEditorProps {
  playbookId?: string
  playbookName?: string
  onBack?: () => void
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
  onBack 
}: PlaybookEditorProps) {
  const { 
    theme, 
    setTheme, 
    positionNaming, 
    setPositionNaming, 
    fieldLevel, 
    setFieldLevel 
  } = useConfig()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(VIEW_MODE_GRID)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewPlayModal, setShowNewPlayModal] = useState(false)
  const [showNewSectionModal, setShowNewSectionModal] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set())
  const [activeSectionFilter, setActiveSectionFilter] = useState<string | null>(null)

  const [sections, setSections] = useState<Section[]>([
    {
      id: 'opening-drive',
      name: 'Opening Drive',
      plays: [
        {
          id: 'play-1',
          name: 'Power I Right',
          formation: 'I Formation',
          personnel: '21',
          playType: 'Run',
          defensiveFormation: '4-3',
          tags: ['Short Yardage', 'Power'],
          lastModified: formatDate(new Date('2024-12-05')),
        },
        {
          id: 'play-2',
          name: 'PA Bootleg',
          formation: 'I Formation',
          personnel: '12',
          playType: PLAY_TYPE_PASS,
          defensiveFormation: '4-3',
          tags: ['Play Action', 'Bootleg'],
          lastModified: formatDate(new Date('2024-12-05')),
        },
        {
          id: 'play-3',
          name: 'Quick Slant',
          formation: 'Shotgun Spread',
          personnel: '11',
          playType: PLAY_TYPE_PASS,
          defensiveFormation: 'Cover 2',
          tags: ['Quick Game', '3rd Down'],
          lastModified: formatDate(new Date('2024-12-04')),
        },
      ],
    },
    {
      id: 'red-zone',
      name: 'Red Zone',
      plays: [
        {
          id: 'play-4',
          name: 'Goalline ISO',
          formation: 'Heavy',
          personnel: '22',
          playType: 'Run',
          defensiveFormation: 'Goal Line',
          tags: ['Goal Line', 'Power'],
          lastModified: formatDate(new Date('2024-12-03')),
        },
        {
          id: 'play-5',
          name: 'Fade Route',
          formation: 'Trips Right',
          personnel: '11',
          playType: PLAY_TYPE_PASS,
          defensiveFormation: 'Cover 1',
          tags: ['Red Zone', 'Fade'],
          lastModified: formatDate(new Date('2024-12-03')),
        },
      ],
    },
    {
      id: 'third-down',
      name: 'Third Down Package',
      plays: [
        {
          id: 'play-6',
          name: 'Double Slant',
          formation: 'Empty Set',
          personnel: '10',
          playType: PLAY_TYPE_PASS,
          defensiveFormation: 'Nickel',
          tags: ['3rd Down', 'Quick Game'],
          lastModified: formatDate(new Date('2024-12-02')),
        },
        {
          id: 'play-7',
          name: 'Draw Play',
          formation: 'Shotgun',
          personnel: '11',
          playType: 'Run',
          defensiveFormation: 'Nickel',
          tags: ['3rd Down', 'Draw'],
          lastModified: formatDate(new Date('2024-12-02')),
        },
        {
          id: 'play-8',
          name: 'Mesh Concept',
          formation: 'Shotgun Spread',
          personnel: '11',
          playType: PLAY_TYPE_PASS,
          defensiveFormation: 'Cover 3',
          tags: ['3rd Down', 'Mesh'],
          lastModified: formatDate(new Date('2024-12-01')),
        },
      ],
    },
  ])

  useEffect(() => {
    if (theme == DARK_MODE_CLASS) {
      document.documentElement.classList.add(DARK_MODE_CLASS)
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS)
    }
  }, [theme])

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

  function handleNewPlay() {
    if (!newItemName.trim()) return

    const newPlay: Play = {
      id: `play-${Date.now()}`,
      name: newItemName,
      formation: '',
      playType: PLAY_TYPE_PASS,
      defensiveFormation: '',
      tags: [],
      lastModified: formatDate(new Date()),
    }
    
    if (sections.length > 0) {
      setSections(
        sections.map((section, index) =>
          index == 0
            ? { ...section, plays: [newPlay, ...section.plays] }
            : section
        )
      )
    }
    
    setNewItemName('')
    setShowNewPlayModal(false)
    
    alert(`Opening play editor for: ${newPlay.name}`)
  }

  function handleNewSection() {
    if (!newItemName.trim()) return

    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: newItemName,
      plays: [],
    }
    setSections([...sections, newSection])
    setNewItemName('')
    setShowNewSectionModal(false)
  }

  function handleOpenPlay(playId: string) {
    const play = allPlays.find((p) => p.id == playId)
    if (play) {
      alert(`Opening play editor for: ${play.name}`)
    }
  }

  function handleRenamePlay(playId: string) {
    const play = allPlays.find((p) => p.id == playId)
    if (!play) return

    const newName = prompt('Rename play:', play.name)
    if (newName?.trim()) {
      setSections(
        sections.map((section) => ({
          ...section,
          plays: section.plays.map((p) =>
            p.id == playId
              ? { ...p, name: newName, lastModified: formatDate(new Date()) }
              : p
          ),
        }))
      )
    }
  }

  function handleDeletePlay(playId: string) {
    const play = allPlays.find((p) => p.id == playId)
    if (play && confirm(`Delete play "${play.name}"?`)) {
      setSections(
        sections.map((section) => ({
          ...section,
          plays: section.plays.filter((p) => p.id != playId),
        }))
      )
    }
  }

  function handleDuplicatePlay(playId: string) {
    const play = allPlays.find((p) => p.id == playId)
    if (!play) return

    const duplicate: Play = {
      ...play,
      id: `play-${Date.now()}`,
      name: `${play.name} (Copy)`,
      lastModified: formatDate(new Date()),
    }
    
    setSections(
      sections.map((section) =>
        section.id == play.sectionId
          ? { ...section, plays: [...section.plays, duplicate] }
          : section
      )
    )
  }

  function handleImport() {
    alert('Import plays functionality - would open file picker')
  }

  function handleExport() {
    if (selectedPlays.size > 0) {
      alert(`Exporting ${selectedPlays.size} selected play(s)`)
    } else {
      alert('Export entire playbook')
    }
  }

  function handleShare(
    recipients: Array<{ email: string; role: 'viewer' | 'collaborator' }>
  ) {
    console.log('Sharing playbook with:', recipients)
    alert(
      `Playbook "${playbookName}" shared with:\n` +
      recipients.map(r => `${r.email} (${r.role})`).join('\n')
    )
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

  const totalPlays = allPlays.length
  const exportTitle = selectedPlays.size > 0 
    ? `Export ${selectedPlays.size} selected` 
    : 'Export All'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className={BUTTON_BASE}
                title="Back to Playbooks"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="mb-1">{playbookName}</h1>
                <p className="text-muted-foreground">
                  {totalPlays} play{totalPlays != 1 ? 's' : ''} across{' '}
                  {sections.length} section{sections.length != 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="w-px self-stretch bg-border ml-2" />

              <div className="relative min-w-[400px]">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 
                    w-5 h-5 text-muted-foreground" 
                />
                <input
                  type="text"
                  placeholder="Search plays, formations, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 
                    bg-input-background text-foreground 
                    placeholder:text-muted-foreground rounded-lg 
                    border-0 outline-none focus:ring-2 
                    focus:ring-ring/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                className={BUTTON_BASE}
                title="Import Plays"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className={BUTTON_BASE}
                title={exportTitle}
              >
                <Download className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-border" />

              <button
                onClick={() => setShowShareDialog(true)}
                className={BUTTON_BASE}
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-border" />

              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode(VIEW_MODE_GRID)}
                  className={`p-2 rounded transition-all duration-200 ${
                    viewMode == VIEW_MODE_GRID
                      ? 'bg-card shadow-sm'
                      : 'hover:bg-accent/50'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODE_LIST)}
                  className={`p-2 rounded transition-all duration-200 ${
                    viewMode == VIEW_MODE_LIST
                      ? 'bg-card shadow-sm'
                      : 'hover:bg-accent/50'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-border" />

              <button
                onClick={() => setShowSettingsDialog(true)}
                className={BUTTON_BASE}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <PlaybookEditorToolbar
          onNewPlay={() => setShowNewPlayModal(true)}
          onNewSection={() => setShowNewSectionModal(true)}
          sections={sections.map(s => ({ id: s.id, name: s.name }))}
          activeSectionFilter={activeSectionFilter}
          onSectionFilterChange={setActiveSectionFilter}
        />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {displayedSections.length > 0 ? (
              <div className="space-y-8">
                {displayedSections.map((section) => (
                  <div key={section.id}>
                    <div 
                      className="flex items-center justify-between mb-4"
                    >
                      <h2>{section.name}</h2>
                      <p className="text-muted-foreground">
                        {section.plays.length} play
                        {section.plays.length != 1 ? 's' : ''}
                      </p>
                    </div>

                    {viewMode == VIEW_MODE_GRID ? (
                      <div 
                        className="grid grid-cols-1 sm:grid-cols-2 
                          lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      >
                        {section.plays.map((play) => (
                          <PlayCard
                            key={play.id}
                            {...play}
                            selected={selectedPlays.has(play.id)}
                            onSelect={() => togglePlaySelection(play.id)}
                            onOpen={handleOpenPlay}
                            onRename={handleRenamePlay}
                            onDelete={handleDeletePlay}
                            onDuplicate={handleDuplicatePlay}
                          />
                        ))}
                      </div>
                    ) : (
                      <PlayListView
                        plays={section.plays}
                        selectedPlays={selectedPlays}
                        onSelect={togglePlaySelection}
                        onOpen={handleOpenPlay}
                        onRename={handleRenamePlay}
                        onDelete={handleDeletePlay}
                        onDuplicate={handleDuplicatePlay}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="flex flex-col items-center 
                  justify-center py-16"
              >
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'No plays found matching your search' 
                      : 'No plays in this playbook'
                    }
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewPlayModal(true)}
                      className={`${PRIMARY_BUTTON_BASE} px-6 py-2.5`}
                    >
                      Create Your First Play
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showNewPlayModal}
        onClose={closeNewPlayModal}
        title="Create New Play"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Play Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleNewPlay()
                }
              }}
              placeholder="Enter play name..."
              className={INPUT_BASE}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeNewPlayModal} className={MODAL_BUTTON_BASE}>
              Cancel
            </button>
            <button
              onClick={handleNewPlay}
              disabled={!newItemName.trim()}
              className={`${PRIMARY_BUTTON_BASE} 
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNewSectionModal}
        onClose={closeNewSectionModal}
        title="Create New Section"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Section Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleNewSection()
                }
              }}
              placeholder="Enter section name..."
              className={INPUT_BASE}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={closeNewSectionModal} 
              className={MODAL_BUTTON_BASE}
            >
              Cancel
            </button>
            <button
              onClick={handleNewSection}
              disabled={!newItemName.trim()}
              className={`${PRIMARY_BUTTON_BASE} 
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        theme={theme}
        onThemeChange={setTheme}
        positionNaming={positionNaming}
        onPositionNamingChange={setPositionNaming}
        fieldLevel={fieldLevel}
        onFieldLevelChange={setFieldLevel}
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        playbookName={playbookName}
        onShare={handleShare}
      />
    </div>
  )
}

export default function PlaybookEditor(props: PlaybookEditorProps) {
  return (
    <ConfigProvider>
      <PlaybookEditorContent {...props} />
    </ConfigProvider>
  )
}
