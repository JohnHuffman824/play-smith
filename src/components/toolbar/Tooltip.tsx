import { useState, useRef, useEffect, ReactNode } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface TooltipProps {
  content: string
  children: ReactNode
  delay?: number // delay in milliseconds before showing
}

export function Tooltip({ content, children, delay = 300 }: TooltipProps) {
  const { theme } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + 12, // 12px gap from the button
        })
        setIsVisible(true)
      }
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`fixed z-[9999] px-3 py-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${
            theme === 'dark'
              ? 'bg-gray-700 text-white border border-gray-600'
              : 'bg-gray-900 text-white'
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(-50%)',
            fontSize: '13px',
            fontWeight: 500,
            animation: 'tooltipFadeIn 0.15s ease-out',
          }}
        >
          {content}
          {/* Arrow pointing left */}
          <div
            className={`absolute w-2 h-2 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-900'
            }`}
            style={{
              top: '50%',
              left: '-4px',
              transform: 'translateY(-50%) rotate(45deg)',
              borderLeft: theme === 'dark' ? '1px solid rgb(75, 85, 99)' : 'none',
              borderBottom: theme === 'dark' ? '1px solid rgb(75, 85, 99)' : 'none',
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0
            transform: translateY(-50%) translateX(-4px)
          }
          to {
            opacity: 1
            transform: translateY(-50%) translateX(0)
          }
        }
      `}</style>
    </>
  )
}
