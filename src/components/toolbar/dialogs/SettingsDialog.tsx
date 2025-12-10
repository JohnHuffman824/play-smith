import { X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface SettingsDialogProps {
	onClose: () => void
	snapThreshold: number
	onSnapThresholdChange: (value: number) => void
}

type PositionNaming = 'XYZABQ' | 'XYZFTQ' | 'Custom'
type FieldLevel = 'High School' | 'College' | 'Pro'
type ThemeMode = 'Light Mode' | 'Dark Mode'

/**
* Dialog for adjusting app appearance and snap settings.
*/
export function SettingsDialog({
	onClose,
	snapThreshold,
	onSnapThresholdChange,
}: SettingsDialogProps) {
	const { theme, setTheme } = useTheme()
	const [positionNaming, setPositionNaming] = useState<PositionNaming>('XYZABQ')
	const [fieldLevel, setFieldLevel] = useState<FieldLevel>('College')
	const [themeMode, setThemeMode] = useState<ThemeMode>('Light Mode')
	const containerClass = [
		'fixed left-24 top-1/2 -translate-y-1/2 rounded-2xl shadow-2xl',
		'p-6 z-50 w-80',
	].join(' ')
	const containerTheme = theme == 'dark' ? 'bg-gray-800' : 'bg-white'
	const headingClass = theme == 'dark' ? 'text-gray-100' : 'text-gray-900'
	const closeButtonClass =
		theme == 'dark'
			? 'hover:bg-gray-700 text-gray-400'
			: 'hover:bg-gray-100 text-gray-500'
	const closeBaseClass =
		'w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer'
	const labelClass = theme == 'dark' ? 'text-gray-300' : 'text-gray-600'
	const rangeTextClass =
		theme == 'dark' ? 'text-gray-300 text-xs mt-1' : 'text-gray-600 text-xs mt-1'

	function handleThemeChange(newTheme: ThemeMode) {
		setThemeMode(newTheme)
		setTheme(newTheme == 'Dark Mode' ? 'dark' : 'light')
	}

	return (
		<div
			data-settings-dialog
			className={`${containerClass} ${containerTheme}`}>
			<div className='flex items-center justify-between mb-6'>
				<span className={headingClass}>Settings</span>
				<button
					onClick={onClose}
					className={`${closeBaseClass} ${closeButtonClass}`}
				>
					<X size={16} />
				</button>
			</div>

			<div className='space-y-6'>
				{/* Position Naming System */}
				<div>
					<label className={`text-sm mb-2 block ${labelClass}`}>
						Position Naming System
					</label>
					<Select value={positionNaming} onValueChange={(value) => setPositionNaming(value as PositionNaming)}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="XYZABQ">X, Y, Z, A, B, Q</SelectItem>
							<SelectItem value="XYZFTQ">X, Y, Z, F, T, Q</SelectItem>
							<SelectItem value="Custom">Custom</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Competition Level */}
				<div>
					<label className={`text-sm mb-2 block ${labelClass}`}>
						Competition Level
					</label>
					<Select value={fieldLevel} onValueChange={(value) => setFieldLevel(value as FieldLevel)}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="High School">High School</SelectItem>
							<SelectItem value="College">College</SelectItem>
							<SelectItem value="Pro">Pro</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Appearance */}
				<div>
					<label className={`text-sm mb-2 block ${labelClass}`}>
						Appearance
					</label>
					<Select value={themeMode} onValueChange={(value) => handleThemeChange(value as ThemeMode)}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Light Mode">Light Mode</SelectItem>
							<SelectItem value="Dark Mode">Dark Mode</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Snap Distance */}
				<div>
					<label className={`text-sm mb-2 block ${labelClass}`}>
						Snap Distance (px)
					</label>
					<input
						type='range'
						min={10}
						max={50}
						step={1}
						value={snapThreshold}
						onChange={(e) => onSnapThresholdChange(Number(e.target.value))}
						className='w-full'
					/>
					<div className={rangeTextClass}>
						{snapThreshold} px
					</div>
				</div>
			</div>
		</div>
	)
}