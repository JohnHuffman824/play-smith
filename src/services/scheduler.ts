import { PlaybookRepository } from '../db/repositories/PlaybookRepository'

const playbookRepo = new PlaybookRepository()

// Configuration constants
const CLEANUP_HOUR = 2 // 2:00 AM
const CLEANUP_MINUTE = 0

/**
 * Cleanup old trash - runs daily at 2:00 AM
 * Permanently deletes playbooks that have been in trash for more than 7 days
 */
async function cleanupOldTrash() {
	try {
		const deletedCount = await playbookRepo.cleanupOldTrash()
		const timestamp = new Date().toISOString()
		console.log(`[${timestamp}] Trash cleanup completed: ${deletedCount} playbook(s) permanently deleted`)
	} catch (error) {
		const timestamp = new Date().toISOString()
		console.error(`[${timestamp}] Trash cleanup failed:`, error)
	}
}

/**
 * Calculate milliseconds until next target time (e.g., 2:00 AM)
 */
function getMillisecondsUntilTime(targetHour: number, targetMinute: number = 0): number {
	const now = new Date()
	const target = new Date()
	target.setHours(targetHour, targetMinute, 0, 0)

	// If target time has already passed today, schedule for tomorrow
	if (target <= now) {
		target.setDate(target.getDate() + 1)
	}

	return target.getTime() - now.getTime()
}

/**
 * Schedule a task to run daily at a specific time
 */
function scheduleDailyTask(task: () => Promise<void>, hour: number, minute: number = 0) {
	const scheduleNext = () => {
		const msUntilNext = getMillisecondsUntilTime(hour, minute)
		const nextRun = new Date(Date.now() + msUntilNext)
		console.log(`Next trash cleanup scheduled for: ${nextRun.toLocaleString()}`)

		setTimeout(async () => {
			await task()
			scheduleNext() // Schedule next run after completion
		}, msUntilNext)
	}

	scheduleNext()
}

/**
 * Start all scheduled tasks
 */
export function startScheduler() {
	console.log('Starting scheduler...')

	// Schedule trash cleanup to run daily at configured time
	scheduleDailyTask(cleanupOldTrash, CLEANUP_HOUR, CLEANUP_MINUTE)

	console.log('Scheduler started successfully')
}

/**
 * Manual cleanup endpoint (can be called from API route)
 */
export async function runCleanupNow() {
	return await cleanupOldTrash()
}
