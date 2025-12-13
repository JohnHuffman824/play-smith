import { eventBus } from '../../../services/EventBus'
import { DialogCloseButton } from '../../ui/dialog-close-button'
import './route-dialog.css'

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
  const handleRouteSelect = (route: typeof routes[0]) => {
    eventBus.emit('drawing:add', { drawing: route })
    onClose()
  }

  return (
    <div
      data-drawing-dialog
      className="route-dialog">
      <div className="route-dialog-header">
        <span className="route-dialog-title">Add Drawing</span>
        <DialogCloseButton onClose={onClose} />
      </div>

      <div className="route-dialog-list">
        {routes.map((route) => (
          <button
            key={route.number}
            onClick={() => handleRouteSelect(route)}
            className="route-dialog-item"
          >
            <div className="route-dialog-item-content">
              <div className="route-dialog-item-badge">
                {route.number}
              </div>
              <div className="route-dialog-item-details">
                <div className="route-dialog-item-name">
                  {route.name}
                </div>
                <div className="route-dialog-item-description">
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