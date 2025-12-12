import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasSnapshot } from '../../hooks/useCanvasSnapshot'
import {
	TRANSITION_DURATION_S,
	TRANSITION_EASING,
	TRANSITION_OVERLAY_Z_INDEX,
	TRANSITION_BORDER_RADIUS,
	TRANSITION_FINAL_OPACITY,
} from '../../constants/animation.constants'

interface CanvasTransitionOverlayProps {
	snapshot: CanvasSnapshot | null
	sourceRect: DOMRect | null
	targetRect: DOMRect | null
	isAnimating: boolean
	onAnimationComplete: () => void
}

export function CanvasTransitionOverlay({
	snapshot,
	sourceRect,
	targetRect,
	isAnimating,
	onAnimationComplete,
}: CanvasTransitionOverlayProps) {
	if (!snapshot || !sourceRect || !targetRect) return null

	return (
		<AnimatePresence>
			{isAnimating && (
				<motion.div
					initial={{
						position: 'fixed',
						left: sourceRect.left,
						top: sourceRect.top,
						width: sourceRect.width,
						height: sourceRect.height,
						opacity: 1,
						zIndex: TRANSITION_OVERLAY_Z_INDEX,
					}}
					animate={{
						left: targetRect.left,
						top: targetRect.top,
						width: targetRect.width,
						height: targetRect.height,
						opacity: TRANSITION_FINAL_OPACITY,
					}}
					transition={{
						duration: TRANSITION_DURATION_S,
						ease: TRANSITION_EASING,
					}}
					onAnimationComplete={onAnimationComplete}
					style={{
						backgroundImage: `url(${snapshot.dataUrl})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						borderRadius: TRANSITION_BORDER_RADIUS,
						boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
					}}
				/>
			)}
		</AnimatePresence>
	)
}
