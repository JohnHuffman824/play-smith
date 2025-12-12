export interface CallSheetPlay {
	number: number
	name: string
	formation?: string
	personnel?: string
	playType?: string
}

export interface CallSheetSection {
	name: string
	plays: CallSheetPlay[]
}

export interface CallSheetConfig {
	title: string
	sections: CallSheetSection[]
	columns: ('number' | 'name' | 'formation' | 'personnel' | 'playType')[]
	groupBy?: 'section' | 'formation' | 'personnel' | 'tag'
}

export interface ExportCallSheetRequest {
	playbookId: string
	config: CallSheetConfig
}
