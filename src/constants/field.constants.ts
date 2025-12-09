/**
 * Football field dimensions and specifications
 * All measurements in feet unless otherwise specified
 */

// Field Dimensions
export const FIELD_WIDTH_FEET = 160
export const FIELD_HEIGHT_FEET = 360

// Hash Mark Positions
export const LEFT_HASH_INNER_EDGE = 60
export const RIGHT_HASH_INNER_EDGE = 100
export const LEFT_HASH_CENTER = 58  // Center of left hash (60 - 2)
export const RIGHT_HASH_CENTER = 102 // Center of right hash (100 + 2)
export const HASH_WIDTH = 4 // Total width of hash mark
export const HASH_SPACING = 3 // Feet between hash marks (1 yard)
export const CENTER_X = 80

// Line of Scrimmage
export const LINE_OF_SCRIMMAGE = 30 // Y position in feet

// Player and Lineman Dimensions
export const PLAYER_RADIUS_FEET = 2.0
export const LINEMAN_RADIUS = 2.0
export const LINEMAN_Y = 28.0
export const SPACING_CENTER_TO_CENTER = 5.0
export const UNLINK_DISTANCE_FEET = 5.0

// Field Markings
export const NUMBER_HEIGHT = 6
export const NUMBER_FROM_EDGE = 15

// Drawing Constants
export const DEFAULT_ERASE_SIZE = 20
export const ANGLE_AVERAGE_POINTS = 10
export const ARROW_LENGTH_MULTIPLIER = 3.5
export const TSHAPE_LENGTH_MULTIPLIER = 2.5
export const ARROW_ANGLE_DEGREES = Math.PI / 6
export const DASH_PATTERN_LENGTH_MULTIPLIER = 3
export const DASH_PATTERN_GAP_MULTIPLIER = 2

// UI Constants
export const INITIALIZATION_DELAY_MS = 150
export const CURSOR_Z_INDEX = 100
export const MAX_HISTORY_SIZE = 10

// Tool Names
export const TOOL_DRAW = 'draw'
export const TOOL_ERASE = 'erase'
export const TOOL_SELECT = 'select'
export const TOOL_FILL = 'fill'
export const TOOL_ADD_PLAYER = 'addPlayer'

// Line Endings
export const LINE_END_NONE = 'none'
export const LINE_END_ARROW = 'arrow'
export const LINE_END_TSHAPE = 'tShape'

// Event Names
export const EVENT_CLEAR_CANVAS = 'clearCanvas'
export const EVENT_FILL_LINEMAN = 'fillLineman'
export const EVENT_FILL_PLAYER = 'fillPlayer'
export const EVENT_RESIZE = 'resize'

// Canvas Composite Operations
export const COMPOSITE_DESTINATION_OUT = 'destination-out'
export const COMPOSITE_SOURCE_OVER = 'source-over'

