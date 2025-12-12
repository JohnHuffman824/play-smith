import { motion, AnimatePresence } from 'framer-motion'
import type { CanvasSnapshot } from '../../hooks/useCanvasSnapshot'

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
						zIndex: 1000,
					}}
					animate={{
						left: targetRect.left,
						top: targetRect.top,
						width: targetRect.width,
						height: targetRect.height,
						opacity: 0,
					}}
					transition={{
						duration: 0.5,
						ease: [0.4, 0, 0.2, 1], // Smooth easing
					}}
					onAnimationComplete={onAnimationComplete}
					style={{
						backgroundImage: `url(${snapshot.dataUrl})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						borderRadius: '12px',
						boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
					}}
				/>
			)}
		</AnimatePresence>
	)
}
