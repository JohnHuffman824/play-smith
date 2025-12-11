import { useState } from 'react'
import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react'
import {
  PLAY_TYPE_PASS,
  PLAY_TYPE_BADGE_PASS,
  PLAY_TYPE_BADGE_RUN,
  MAX_VISIBLE_TAGS,
  TAG_COLORS,
  DEFAULT_TAG_COLOR,
  MENU_ITEM_BASE,
} from './constants/playbook'

interface PlayCardProps {
  id: string
  name: string
  formation: string
  playType: string
  defensiveFormation: string
  tags: string[]
  lastModified: string
  thumbnail?: string
  personnel?: string
  selected?: boolean
  onSelect?: (id: string) => void
  onOpen: (id: string) => void
  onAnimate?: (id: string) => void
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

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR
}

function PlayCardThumbnail({
  thumbnail,
  name,
  playType,
  onOpen,
  onAnimate
}: {
  thumbnail?: string
  name: string
  playType: string
  onOpen: () => void
  onAnimate?: () => void
}) {
  const badgeClass = playType == PLAY_TYPE_PASS
    ? PLAY_TYPE_BADGE_PASS
    : PLAY_TYPE_BADGE_RUN

  const handleClick = () => {
    // If onAnimate is provided, use it; otherwise fall back to onOpen
    if (onAnimate) {
      onAnimate()
    } else {
      onOpen()
    }
  }

  return (
    <div className="relative group/thumbnail">
      <div
        onClick={handleClick}
        className="aspect-video bg-muted flex items-center
          justify-center cursor-pointer hover:bg-accent
          transition-colors duration-200"
      >
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="text-center p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="text-muted-foreground">
              <svg
                width="100"
                height="60"
                viewBox="0 0 100 60"
                className="mx-auto opacity-50"
              >
                <line
                  x1="20"
                  y1="30"
                  x2="20"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="40"
                  y1="30"
                  x2="50"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="60"
                  y1="30"
                  x2="50"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="80"
                  y1="30"
                  x2="80"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2">
        <span
          className={`px-2.5 py-1 rounded-md text-xs shadow-sm
            backdrop-blur-sm ${badgeClass}`}
        >
          {playType}
        </span>
      </div>

      {/* Play button overlay for animation */}
      {onAnimate && (
        <div
          className="absolute inset-0 flex items-center justify-center
            bg-black/0 group-hover/thumbnail:bg-black/30
            transition-all duration-200 pointer-events-none"
        >
          <div
            className="w-12 h-12 rounded-full bg-primary/90 flex items-center
              justify-center opacity-0 group-hover/thumbnail:opacity-100
              transform scale-75 group-hover/thumbnail:scale-100
              transition-all duration-200 pointer-events-auto"
          >
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}
    </div>
  )
}

function PlayCardMenu({ 
  menuItems, 
  showMenu, 
  onClose 
}: { 
  menuItems: MenuItem[]
  showMenu: boolean
  onClose: () => void
}) {
  if (!showMenu) return null

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
            <button
              onClick={item.onClick}
              className={`${MENU_ITEM_BASE} ${
                item.destructive ? 'text-destructive' : ''
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

function PlayCardTags({ tags }: { tags: string[] }) {
  if (tags.length == 0) return null

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = tags.length - MAX_VISIBLE_TAGS

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {visibleTags.map((tag) => {
        const colors = getTagColor(tag)
        return (
          <span
            key={tag}
            className={`px-2.5 py-1 rounded-full text-xs 
              ${colors.bg} ${colors.text}`}
          >
            {tag}
          </span>
        )
      })}
      {hiddenCount > 0 && (
        <span className="px-2.5 py-1 text-muted-foreground text-xs">
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

export function PlayCard({
  id,
  name,
  formation,
  playType,
  defensiveFormation,
  tags,
  lastModified,
  thumbnail,
  personnel,
  selected = false,
  onSelect,
  onOpen,
  onAnimate,
  onRename,
  onDelete,
  onDuplicate,
}: PlayCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const closeMenu = () => setShowMenu(false)

  const menuItems: MenuItem[] = [
    {
      label: 'Open',
      icon: Edit,
      onClick: () => {
        onOpen(id)
        closeMenu()
      },
    },
    {
      label: 'Rename',
      icon: Edit,
      onClick: () => {
        onRename(id)
        closeMenu()
      },
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: () => {
        onDuplicate(id)
        closeMenu()
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => {
        onDelete(id)
        closeMenu()
      },
      destructive: true,
    },
  ]

  const cardClass = `group relative bg-card border border-border 
    rounded-xl overflow-hidden hover:shadow-lg 
    transition-all duration-200 ${
      selected ? 'ring-2 ring-primary' : ''
    }`

  return (
    <div className={cardClass}>
      <PlayCardThumbnail
        thumbnail={thumbnail}
        name={name}
        playType={playType}
        onOpen={() => onOpen(id)}
        onAnimate={onAnimate ? () => onAnimate(id) : undefined}
      />

      {onSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect(id)
          }}
          className="absolute top-2 left-2 p-1 bg-background/80 
            backdrop-blur-sm rounded-full hover:bg-background 
            transition-all duration-200"
        >
          {selected ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle 
              className="w-5 h-5 text-muted-foreground opacity-0 
                group-hover:opacity-100 transition-opacity" 
            />
          )}
        </button>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="flex-1 line-clamp-1">{name}</h3>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-accent rounded 
                transition-all duration-200 opacity-0 
                group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <PlayCardMenu
              menuItems={menuItems}
              showMenu={showMenu}
              onClose={closeMenu}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {formation && (
            <span className="text-muted-foreground">
              {formation}
            </span>
          )}
          {personnel && (
            <>
              <span className="text-muted-foreground">•</span>
              <span 
                className="px-2 py-0.5 bg-muted rounded 
                  text-muted-foreground text-xs"
              >
                {personnel}
              </span>
            </>
          )}
        </div>

        {defensiveFormation && (
          <p className="text-muted-foreground mb-3">
            vs {defensiveFormation}
          </p>
        )}

        <PlayCardTags tags={tags} />

        <div className="pt-2 border-t border-border">
          <p className="text-muted-foreground">{lastModified}</p>
        </div>
      </div>
    </div>
  )
}
