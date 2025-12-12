export interface RouteDrawingPath {
  points: { x: number; y: number }[]
  style: 'solid' | 'dashed'
  end: 'none' | 'arrow' | 'tShape'
}

export interface PresetRoute {
  name: string
  description: string
  route_number?: number // Traditional route tree number
  drawing_data: {
    paths: RouteDrawingPath[]
  }
}

// All coordinates relative to player starting position (0,0)
// Positive x = toward sideline, negative x = toward center
// Negative y = upfield (toward endzone)
export const PRESET_ROUTES: PresetRoute[] = [
  {
    name: 'Flat',
    description: 'Quick route toward sideline, 1-2 yards deep',
    route_number: 1,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 10, y: -2 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Slant',
    description: 'Quick inside break at 45 degrees',
    route_number: 2,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -3 }, { x: -8, y: -10 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Comeback',
    description: 'Vertical stem with comeback toward sideline',
    route_number: 3,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -15 }, { x: 5, y: -12 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Curl',
    description: 'Vertical stem with curl back toward QB',
    route_number: 4,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: 0, y: -10 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Out',
    description: 'Vertical stem with hard break to sideline',
    route_number: 5,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -10 }, { x: 10, y: -10 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'In',
    description: 'Vertical stem with hard break inside (dig route)',
    route_number: 6,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -10 }, { x: -12, y: -10 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Corner',
    description: 'Vertical stem breaking to corner of endzone',
    route_number: 7,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: 10, y: -20 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Post',
    description: 'Vertical stem breaking toward goalpost',
    route_number: 8,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -12 }, { x: -8, y: -20 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Go',
    description: 'Straight vertical route (fly/streak)',
    route_number: 9,
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 0, y: -25 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Wheel',
    description: 'Out of backfield, arc toward sideline then vertical',
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 8, y: -2 }, { x: 12, y: -8 }, { x: 12, y: -20 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Angle',
    description: 'Out of backfield, angle route inside',
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: 5, y: -2 }, { x: -5, y: -8 }],
        style: 'solid',
        end: 'arrow'
      }]
    }
  },
  {
    name: 'Screen',
    description: 'Receiver sets up behind line, catches behind blockers',
    drawing_data: {
      paths: [{
        points: [{ x: 0, y: 0 }, { x: -3, y: 2 }],
        style: 'dashed',
        end: 'arrow'
      }]
    }
  }
]
