import { Plus, FolderPlus } from 'lucide-react'

interface Section {
  id: string
  name: string
}

interface PlaybookEditorToolbarProps {
  onNewPlay: () => void
  onNewSection: () => void
  sections: Section[]
  activeSectionFilter: string | null
  onSectionFilterChange: (sectionId: string | null) => void
}

const BUTTON_ACTIVE = 'bg-primary text-primary-foreground'
const BUTTON_INACTIVE = 'hover:bg-accent'
const BUTTON_BASE_CLASS = 'px-4 py-2 rounded-lg transition-all duration-200'

export function PlaybookEditorToolbar({
  onNewPlay,
  onNewSection,
  sections,
  activeSectionFilter,
  onSectionFilterChange,
}: PlaybookEditorToolbarProps) {
  return (
    <div className="border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onNewPlay}
            className={`${BUTTON_BASE_CLASS} ${BUTTON_ACTIVE}
              flex items-center gap-2 cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            <span>New Play</span>
          </button>

          <button
            onClick={onNewSection}
            className={`${BUTTON_BASE_CLASS} ${BUTTON_INACTIVE}
              flex items-center gap-2 cursor-pointer`}
            title="Create New Section"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Section</span>
          </button>
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSectionFilterChange(null)}
            className={`${BUTTON_BASE_CLASS} ${
              activeSectionFilter == null ? BUTTON_ACTIVE : BUTTON_INACTIVE
            } cursor-pointer`}
          >
            All Plays
          </button>

          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionFilterChange(section.id)}
              className={`${BUTTON_BASE_CLASS} ${
                activeSectionFilter == section.id
                  ? BUTTON_ACTIVE
                  : BUTTON_INACTIVE
              } cursor-pointer`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
