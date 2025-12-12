import puppeteer from 'puppeteer'
import type { CallSheetConfig } from '../../types/export.types'

export async function generateCallSheetPDF(config: CallSheetConfig): Promise<Buffer> {
	const html = renderCallSheetHTML(config)

	const browser = await puppeteer.launch({ headless: true })
	const page = await browser.newPage()
	await page.setContent(html, { waitUntil: 'networkidle0' })

	const pdf = await page.pdf({
		format: 'Letter',
		margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
		printBackground: true,
	})

	await browser.close()
	return Buffer.from(pdf)
}

function renderCallSheetHTML(config: CallSheetConfig): string {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; font-size: 11pt; }
				h1 { font-size: 16pt; margin-bottom: 8px; }
				h2 { font-size: 12pt; margin: 16px 0 8px; background: #eee; padding: 4px 8px; }
				table { width: 100%; border-collapse: collapse; }
				th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
				th { background: #333; color: white; font-weight: bold; }
				tr:nth-child(even) { background: #f9f9f9; }
				.play-number { font-weight: bold; width: 40px; text-align: center; }
			</style>
		</head>
		<body>
			<h1>${config.title}</h1>
			${config.sections.map(section => `
				<h2>${section.name}</h2>
				<table>
					<thead>
						<tr>
							<th class="play-number">#</th>
							<th>Play Name</th>
						</tr>
					</thead>
					<tbody>
						${section.plays.map(play => `
							<tr>
								<td class="play-number">${play.number}</td>
								<td>${play.name}</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			`).join('')}
		</body>
		</html>
	`
}
