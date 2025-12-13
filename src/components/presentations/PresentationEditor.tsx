import { useState, useCallback } from 'react'
import {
	X,
	Plus,
	GripVertical,
	Trash2
} from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Button } from '../ui/button'
import { usePresentationDetail } from '../../hooks/usePresentationsData'
import './presentation-editor.css'

type PresentationEditorProps = {
	presentationId: number
	playbookId: number
	availablePlays: {
		id: number
		name: string
		thumbnail?: string
	}[]
	onClose: () => void
}

export function PresentationEditor({
	presentationId,
	playbookId: _playbookId,
	availablePlays,
	onClose
}: PresentationEditorProps) {
	const {
		presentation,
		slides,
		isLoading,
		addSlide,
		removeSlide,
		reorderSlides
	} = usePresentationDetail(presentationId)

	const [showAddMenu, setShowAddMenu] = useState(false)

	const handleAddPlay = useCallback(async (playId: number) => {
		await addSlide(playId)
		setShowAddMenu(false)
	}, [addSlide])

	const handleRemoveSlide = useCallback(
		async (slideId: number) => {
			await removeSlide(slideId)
		},
		[removeSlide]
	)

	const handleReorder = useCallback(async (
		newOrder: typeof slides
	) => {
		const slideOrders = newOrder.map((slide, index) => ({
			id: slide.id,
			display_order: index
		}))
		await reorderSlides(slideOrders)
	}, [reorderSlides])

	const slidePlayIds = new Set(slides.map(s => s.play_id))
	const playsToAdd = availablePlays.filter(
		p => !slidePlayIds.has(p.id)
	)

	if (isLoading) {
		return (
			<div className="presentation-editor__empty">
				Loading...
			</div>
		)
	}

	return (
		<div className="presentation-editor">
			{/* Header */}
			<div className="presentation-editor__header">
				<div>
					<h2 className="presentation-editor__title">
						{presentation?.name}
					</h2>
					<p className="presentation-editor__subtitle">
						{slides.length} slide
						{slides.length !== 1 ? 's' : ''}
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="presentation-editor__close-icon" />
				</Button>
			</div>

			{/* Slide List */}
			<div className="presentation-editor__content">
				{slides.length === 0 ? (
					<div className="presentation-editor__empty">
						<p className="presentation-editor__empty-text">
							No slides yet
						</p>
						<Button
							onClick={() => setShowAddMenu(true)}
						>
							<Plus className="presentation-editor__add-icon" />
							Add First Slide
						</Button>
					</div>
				) : (
					<Reorder.Group
						axis="y"
						values={slides}
						onReorder={handleReorder}
						className="presentation-editor__slides"
					>
						{slides.map((slide, index) => (
							<Reorder.Item
								key={slide.id}
								value={slide}
								className="presentation-editor__slide"
							>
								<GripVertical
									className="presentation-editor__drag-handle"
								/>
								<span
									className="presentation-editor__slide-number"
								>
									{index + 1}
								</span>
								<div className="presentation-editor__slide-name">
									{slide.play_name ||
										'Untitled Play'}
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleRemoveSlide(slide.id)
									}
									className="presentation-editor__delete-button"
									aria-label="Remove slide"
								>
									<Trash2 className="presentation-editor__icon" />
								</Button>
							</Reorder.Item>
						))}
					</Reorder.Group>
				)}
			</div>

			{/* Add Button */}
			<div className="presentation-editor__footer">
				<Button
					onClick={() => setShowAddMenu(true)}
					disabled={playsToAdd.length === 0}
					className="presentation-editor__add-button"
				>
					<Plus className="presentation-editor__add-icon" />
					Add Slide
				</Button>
			</div>

			{/* Add Play Modal */}
			<AnimatePresence>
				{showAddMenu && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="presentation-editor__modal-overlay"
						onClick={() => setShowAddMenu(false)}
					>
						<motion.div
							initial={{ scale: 0.95 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.95 }}
							className="presentation-editor__modal"
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="presentation-editor__modal-title">
								Add Play to Presentation
							</h3>
							{playsToAdd.length === 0 ? (
								<p className="presentation-editor__modal-empty">
									All plays already added
								</p>
							) : (
								<div className="presentation-editor__modal-list">
									{playsToAdd.map((play) => (
										<button
											key={play.id}
											className="presentation-editor__modal-item"
											onClick={() =>
												handleAddPlay(play.id)
											}
										>
											{play.name ||
												'Untitled Play'}
										</button>
									))}
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
