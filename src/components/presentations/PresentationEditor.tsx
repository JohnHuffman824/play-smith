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
	playbookId,
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
			<div
				className="flex items-center justify-center h-64"
			>
				Loading...
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div
				className="flex items-center justify-between border-b px-6 py-4"
			>
				<div>
					<h2 className="text-lg font-semibold">
						{presentation?.name}
					</h2>
					<p className="text-sm text-muted-foreground">
						{slides.length} slide
						{slides.length !== 1 ? 's' : ''}
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
				>
					<X className="size-5" />
				</Button>
			</div>

			{/* Slide List */}
			<div className="flex-1 overflow-auto p-6">
				{slides.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground mb-4">
							No slides yet
						</p>
						<Button
							onClick={() => setShowAddMenu(true)}
						>
							<Plus className="size-4 mr-2" />
							Add First Slide
						</Button>
					</div>
				) : (
					<Reorder.Group
						axis="y"
						values={slides}
						onReorder={handleReorder}
						className="space-y-2"
					>
						{slides.map((slide, index) => (
							<Reorder.Item
								key={slide.id}
								value={slide}
								className="flex items-center gap-3 p-3 bg-card rounded-lg border cursor-move"
							>
								<GripVertical
									className="size-5 text-muted-foreground"
								/>
								<span
									className="text-sm font-medium text-muted-foreground w-8"
								>
									{index + 1}
								</span>
								<div className="flex-1">
									<p className="font-medium">
										{slide.play_name ||
											'Untitled Play'}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleRemoveSlide(slide.id)
									}
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="size-4" />
								</Button>
							</Reorder.Item>
						))}
					</Reorder.Group>
				)}
			</div>

			{/* Add Button */}
			<div className="border-t px-6 py-4">
				<Button
					onClick={() => setShowAddMenu(true)}
					disabled={playsToAdd.length === 0}
					className="w-full"
				>
					<Plus className="size-4 mr-2" />
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
						className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
						onClick={() => setShowAddMenu(false)}
					>
						<motion.div
							initial={{ scale: 0.95 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.95 }}
							className="bg-background rounded-lg p-6 max-w-md w-full max-h-96 overflow-auto"
							onClick={(e) => e.stopPropagation()}
						>
							<h3
								className="text-lg font-semibold mb-4"
							>
								Add Play to Presentation
							</h3>
							{playsToAdd.length === 0 ? (
								<p
									className="text-muted-foreground"
								>
									All plays already added
								</p>
							) : (
								<div className="space-y-2">
									{playsToAdd.map((play) => (
										<button
											key={play.id}
											className="w-full p-3 text-left rounded-lg hover:bg-accent transition-colors"
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
