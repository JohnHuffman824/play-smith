import { Plus, X } from 'lucide-react'
import type { PlayCard } from '../../types/play.types'
import { useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface PlayCardsSectionProps {
  playCards: PlayCard[]
  onAddCard: () => void
  onDeleteCard: (id: string) => void
  showPlayBar: boolean
}

export function PlayCardsSection({ playCards, onAddCard, onDeleteCard, showPlayBar }: PlayCardsSectionProps) {
  const { theme } = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleAddClick = () => {
    onAddCard()
    // Scroll to the end after adding
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollWidth,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  return (
    <div
      className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} relative`}
      style={{
        height: showPlayBar ? '180px' : '0px',
        overflow: 'hidden',
        zIndex: 0,
        transition: 'height 800ms ease-in-out',
      }}
    >
      <div ref={scrollContainerRef} className="h-[180px] px-8 py-6 flex items-center gap-4 overflow-x-hidden">
        {playCards.map((card) => (
          <div
            key={card.id}
            className={`relative flex-shrink-0 w-64 h-40 rounded-2xl border shadow-sm hover:shadow-md transition-all group overflow-hidden ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Delete button */}
            <button
              onClick={() => onDeleteCard(card.id)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center hover:bg-red-600 cursor-pointer"
            >
              <X size={14} />
            </button>

            {/* Play preview area */}
            <div className={`h-28 flex items-center justify-center border-b ${
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'
            }`}>
              {card.thumbnail ? (
                <img src={card.thumbnail} alt={card.name} className="w-full h-full object-contain" />
              ) : (
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`}>
                  Play Preview
                </div>
              )}
            </div>

            {/* Play name */}
            <div className="h-12 px-4 flex items-center justify-center">
              <input
                type="text"
                defaultValue={card.name}
                className={`w-full text-center text-sm bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={handleAddClick}
          className={`flex-shrink-0 w-64 h-40 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-600 hover:border-blue-400 hover:bg-gray-700 text-gray-500 hover:text-blue-400'
              : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Plus size={24} />
          </div>
          <span className="text-sm">Add Play</span>
        </button>
      </div>
    </div>
  )
}