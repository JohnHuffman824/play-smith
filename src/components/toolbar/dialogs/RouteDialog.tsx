import { eventBus } from '../../../services/EventBus'
import { DialogCloseButton } from '../../ui/dialog-close-button'

interface RouteDialogProps {
  onClose: () => void
}

const routes = [
  { number: 1, name: 'Flat', description: 'Quick horizontal route' },
  { number: 2, name: 'Slant', description: 'Diagonal inside cut' },
  { number: 3, name: 'Comeback', description: 'Out and back towards QB' },
  { number: 4, name: 'Curl', description: 'Stop and turn back' },
  { number: 5, name: 'Out', description: 'Break towards sideline' },
  { number: 6, name: 'Dig', description: 'Deep in-breaking route' },
  { number: 7, name: 'Corner', description: 'Deep break to corner' },
  { number: 8, name: 'Post', description: 'Deep inside break' },
  { number: 9, name: 'Go', description: 'Straight vertical route' },
]

export function RouteDialog({ onClose }: RouteDialogProps) {
  const containerClass = [
    'absolute left-24 top-6 w-80 rounded-2xl shadow-2xl bg-popover',
    'border border-border p-4 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto',
  ].join(' ')
  const headerClass =
    'flex items-center justify-between mb-4 sticky top-0 pb-2 border-b border-border bg-popover'
  const itemClass =
    'w-full p-3 rounded-xl border border-border bg-muted hover:bg-accent hover:border-action-button transition-all duration-200 text-left group cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
  const numberBadgeClass =
    'w-8 h-8 rounded-lg bg-action-button text-action-button-foreground flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform font-semibold'

  const handleRouteSelect = (route: typeof routes[0]) => {
    eventBus.emit('drawing:add', { drawing: route })
    onClose()
  }

  return (
    <div
      data-drawing-dialog
      className={containerClass}>
      <div className={headerClass}>
        <span className="text-foreground">Add Drawing</span>
        <DialogCloseButton onClose={onClose} />
      </div>

      <div className="space-y-2">
        {routes.map((route) => (
          <button
            key={route.number}
            onClick={() => handleRouteSelect(route)}
            className={itemClass}
          >
            <div className="flex items-start gap-3">
              <div className={numberBadgeClass}>
                {route.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-foreground mb-1">
                  {route.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {route.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}