import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Circle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PLAY_TYPE_PASS,
  PLAY_TYPE_BADGE_PASS,
  PLAY_TYPE_BADGE_RUN,
  MAX_VISIBLE_TAGS,
  TAG_COLORS,
  DEFAULT_TAG_COLOR,
} from './constants/playbook'
import { formatDateDayMonthYear } from '@/utils/date.utils'
import { PlayThumbnailSVG } from './PlayThumbnailSVG'
import type { Drawing } from '@/types/drawing.types'

type PlayCardProps = {
  id: string
  name: string
  formation: string
  playType: string
  defensiveFormation: string
  tags: string[]
  lastModified: string
  thumbnail?: string
  drawings?: Drawing[]
  personnel?: string
  selected?: boolean
  onSelect?: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

type PlayCardThumbnailProps = {
  thumbnail?: string
  drawings?: Drawing[]
  name: string
  playType: string
  onOpen: () => void
}

type PlayCardTagsProps = {
  tags: string[]
}

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR
}

function PlayCardThumbnail({
  thumbnail,
  drawings,
  name,
  playType,
  onOpen
}: PlayCardThumbnailProps) {
  console.log(`PlayCard "${name}" - drawings:`, drawings, 'length:', drawings?.length)

  const badgeClass = playType == PLAY_TYPE_PASS
    ? PLAY_TYPE_BADGE_PASS
    : PLAY_TYPE_BADGE_RUN

  return (
    <div className="relative">
      <div
        onClick={onOpen}
        className="aspect-video bg-muted flex items-center
          justify-center cursor-pointer hover:bg-accent
          transition-colors duration-200"
      >
        {drawings && drawings.length > 0 ? (
          <PlayThumbnailSVG drawings={drawings} className="w-full h-full" />
        ) : thumbnail ? (
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

      {playType && (
        <div className="absolute top-2 right-2">
          <span
            className={`px-2.5 py-1 rounded-md text-xs shadow-sm
              backdrop-blur-sm ${badgeClass}`}
          >
            {playType}
          </span>
        </div>
      )}
    </div>
  )
}


function PlayCardTags({ tags }: PlayCardTagsProps) {
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
  drawings,
  personnel,
  selected = false,
  onSelect,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}: PlayCardProps) {
  const cardClass = `group relative bg-card border border-border
    rounded-xl overflow-hidden hover:shadow-lg
    transition-all duration-200 ${
      selected ? 'ring-2 ring-primary' : ''
    }`

  return (
    <div className={cardClass}>
      <PlayCardThumbnail
        thumbnail={thumbnail}
        drawings={drawings}
        name={name}
        playType={playType}
        onOpen={() => onOpen(id)}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 hover:bg-accent rounded
                  transition-all duration-200 opacity-0
                  group-hover:opacity-100 cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(id)}>
                <Edit className="w-4 h-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(id)}>
                <Edit className="w-4 h-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(id)}>
                <Copy className="w-4 h-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(id)} variant="destructive">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <p className="text-muted-foreground">{formatDateDayMonthYear(lastModified)}</p>
        </div>
      </div>
    </div>
  )
}
