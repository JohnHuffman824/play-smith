import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Circle 
} from 'lucide-react'
import { useState } from 'react'
import {
  PLAY_TYPE_PASS,
  PLAY_TYPE_LIST_PASS,
  PLAY_TYPE_LIST_RUN,
  MENU_ITEM_BASE,
} from '../constants/playbook'

interface Play {
  id: string
  name: string
  formation: string
  playType: string
  defensiveFormation: string
  tags: string[]
  lastModified: string
}

interface PlayListViewProps {
  plays: Play[]
  selectedPlays: Set<string>
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

interface MenuItem {
  label: string
  icon: typeof Edit
  onClick: () => void
  destructive?: boolean
}

function PlayRowMenu({ 
  menuItems, 
  isActive, 
  onClose 
}: { 
  menuItems: MenuItem[]
  isActive: boolean
  onClose: () => void
}) {
  if (!isActive) return null

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div 
        className="absolute right-0 top-full mt-1 w-48 
          bg-popover border border-border rounded-lg shadow-lg 
          z-20 py-1"
      >
        {menuItems.map((item, index) => (
          <div key={item.label}>
            {item.destructive && index > 0 && (
              <div className="h-px bg-border my-1" />
            )}
            <button onClick={item.onClick} className={MENU_ITEM_BASE}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

export function PlayListView({
  plays,
  selectedPlays,
  onSelect,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}: PlayListViewProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const closeMenu = () => setActiveMenu(null)

  const createMenuItems = (playId: string): MenuItem[] => [
    {
      label: 'Open',
      icon: Edit,
      onClick: () => {
        onOpen(playId)
        closeMenu()
      },
    },
    {
      label: 'Rename',
      icon: Edit,
      onClick: () => {
        onRename(playId)
        closeMenu()
      },
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: () => {
        onDuplicate(playId)
        closeMenu()
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => {
        onDelete(playId)
        closeMenu()
      },
      destructive: true,
    },
  ]

  return (
    <div 
      className="bg-card border border-border rounded-xl 
        overflow-hidden"
    >
      <div 
        className="grid grid-cols-12 gap-4 px-4 py-3 
          border-b border-border bg-muted"
      >
        <div className="col-span-1 flex items-center">
          <Circle className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="col-span-4">
          <span className="text-muted-foreground">Name</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Formation</span>
        </div>
        <div className="col-span-1">
          <span className="text-muted-foreground">Type</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Tags</span>
        </div>
        <div className="col-span-1">
          <span className="text-muted-foreground">Modified</span>
        </div>
        <div className="col-span-1"></div>
      </div>

      <div className="divide-y divide-border">
        {plays.map((play) => {
          const isSelected = selectedPlays.has(play.id)
          const typeClass = play.playType == PLAY_TYPE_PASS 
            ? PLAY_TYPE_LIST_PASS 
            : PLAY_TYPE_LIST_RUN

          return (
            <div
              key={play.id}
              className={`grid grid-cols-12 gap-4 px-4 py-3 
                hover:bg-accent transition-colors duration-200 ${
                  isSelected ? 'bg-accent/50' : ''
                }`}
            >
              <div className="col-span-1 flex items-center">
                <button
                  onClick={() => onSelect(play.id)}
                  className="p-1 hover:bg-accent rounded 
                    transition-all duration-200"
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="col-span-4 flex items-center">
                <button
                  onClick={() => onOpen(play.id)}
                  className="hover:underline text-left"
                >
                  {play.name}
                </button>
              </div>

              <div className="col-span-2 flex items-center">
                <span className="text-muted-foreground">
                  {play.formation || '-'}
                </span>
              </div>

              <div className="col-span-1 flex items-center">
                <span className={`px-2 py-0.5 rounded text-xs ${typeClass}`}>
                  {play.playType}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-1">
                {play.tags.length > 0 ? (
                  <>
                    <span 
                      className="px-2 py-0.5 bg-muted rounded 
                        text-muted-foreground"
                    >
                      {play.tags[0]}
                    </span>
                    {play.tags.length > 1 && (
                      <span className="text-muted-foreground">
                        +{play.tags.length - 1}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>

              <div className="col-span-1 flex items-center">
                <span className="text-muted-foreground">
                  {play.lastModified}
                </span>
              </div>

              <div 
                className="col-span-1 flex items-center 
                  justify-end relative"
              >
                <button
                  onClick={() => 
                    setActiveMenu(activeMenu == play.id ? null : play.id)
                  }
                  className="p-1 hover:bg-accent rounded 
                    transition-all duration-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <PlayRowMenu
                  menuItems={createMenuItems(play.id)}
                  isActive={activeMenu == play.id}
                  onClose={closeMenu}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
