import { describe, test, expect, afterEach, mock } from 'bun:test'
import { render, cleanup } from '@testing-library/react'
import { CanvasTransitionOverlay } from '../../../../src/components/canvas/CanvasTransitionOverlay'
import type { CanvasSnapshot } from '../../../../src/hooks/useCanvasSnapshot'

describe('CanvasTransitionOverlay', () => {
	afterEach(cleanup)

	const mockSnapshot: CanvasSnapshot = {
		dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
		width: 800,
		height: 600,
	}

	const mockSourceRect: DOMRect = {
		left: 100,
		top: 100,
		width: 800,
		height: 600,
		right: 900,
		bottom: 700,
		x: 100,
		y: 100,
		toJSON: () => ({}),
	}

	const mockTargetRect: DOMRect = {
		left: 50,
		top: 500,
		width: 240,
		height: 180,
		right: 290,
		bottom: 680,
		x: 50,
		y: 500,
		toJSON: () => ({}),
	}

	test('renders nothing when not animating', () => {
		const onComplete = mock(() => {})
		const { container } = render(
			<CanvasTransitionOverlay
				snapshot={mockSnapshot}
				sourceRect={mockSourceRect}
				targetRect={mockTargetRect}
				isAnimating={false}
				onAnimationComplete={onComplete}
			/>
		)
		expect(container.firstChild).toBeNull()
	})

	test('renders overlay when animating with all required props', () => {
		const onComplete = mock(() => {})
		const { container } = render(
			<CanvasTransitionOverlay
				snapshot={mockSnapshot}
				sourceRect={mockSourceRect}
				targetRect={mockTargetRect}
				isAnimating={true}
				onAnimationComplete={onComplete}
			/>
		)
		expect(container.firstChild).not.toBeNull()
	})

	test('renders nothing when snapshot is null', () => {
		const onComplete = mock(() => {})
		const { container } = render(
			<CanvasTransitionOverlay
				snapshot={null}
				sourceRect={mockSourceRect}
				targetRect={mockTargetRect}
				isAnimating={true}
				onAnimationComplete={onComplete}
			/>
		)
		expect(container.firstChild).toBeNull()
	})

	test('renders nothing when sourceRect is null', () => {
		const onComplete = mock(() => {})
		const { container } = render(
			<CanvasTransitionOverlay
				snapshot={mockSnapshot}
				sourceRect={null}
				targetRect={mockTargetRect}
				isAnimating={true}
				onAnimationComplete={onComplete}
			/>
		)
		expect(container.firstChild).toBeNull()
	})

	test('renders nothing when targetRect is null', () => {
		const onComplete = mock(() => {})
		const { container } = render(
			<CanvasTransitionOverlay
				snapshot={mockSnapshot}
				sourceRect={mockSourceRect}
				targetRect={null}
				isAnimating={true}
				onAnimationComplete={onComplete}
			/>
		)
		expect(container.firstChild).toBeNull()
	})
})
