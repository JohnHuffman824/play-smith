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
  PLAY_TYPE_LIST_PASS,
  PLAY_TYPE_LIST_RUN,
} from './constants/playbook'
import type { Play } from './types'

type PlayListViewProps = {
  plays: Play[]
  selectedPlays: Set<string>
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
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
                  justify-end"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 hover:bg-accent rounded
                        transition-all duration-200 cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOpen(play.id)}>
                      <Edit className="w-4 h-4" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRename(play.id)}>
                      <Edit className="w-4 h-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(play.id)}>
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(play.id)} variant="destructive">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
