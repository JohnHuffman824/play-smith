// Animation timing and styling constants
// Used for consistent animation behavior across the app

// Transition overlay animation (play card → canvas)
export const TRANSITION_DURATION_S = 0.7 // seconds
export const TRANSITION_EASING = [0.32, 0.72, 0, 1] as const // smooth deceleration curve
export const TRANSITION_OVERLAY_Z_INDEX = 1000
export const TRANSITION_BORDER_RADIUS = '12px'
export const TRANSITION_FINAL_OPACITY = 0.3 // Keep some visibility at end for smoother shrink effect

// Canvas fade-in animation
export const CANVAS_FADE_DURATION_S = 0.4 // seconds
export const CANVAS_FADE_DELAY_S = 0.2 // seconds
export const CANVAS_FADE_SCALE_START = 0.98
