/**
 * Email Service - Placeholder Implementation
 *
 * This is a placeholder email service that logs to console.
 * Replace with a real email service (Resend, SendGrid, AWS SES, etc.) for production.
 */

export interface EmailService {
	sendTeamInvitation(_params: {
		to: string
		teamName: string
		inviterName: string
		inviteLink: string
		role: string
	}): Promise<void>
}

/**
 * Console Email Service - Development/Testing
 *
 * Logs email details to console instead of sending actual emails.
 * Useful for development and testing without email infrastructure.
 */
export class ConsoleEmailService implements EmailService {
	async sendTeamInvitation(params: {
		to: string
		teamName: string
		inviterName: string
		inviteLink: string
		role: string
	}): Promise<void> {
		console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.warn('📧 TEAM INVITATION EMAIL (Console)')
		console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.warn(`To: ${params.to}`)
		console.warn(`Team: ${params.teamName}`)
		console.warn(`Invited by: ${params.inviterName}`)
		console.warn(`Role: ${params.role}`)
		console.warn(`Invitation Link: ${params.inviteLink}`)
		console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	}
}

/**
 * TODO: Implement production email service
 *
 * Options for production:
 *
 * 1. Resend (recommended for modern apps)
 *    - npm install resend
 *    - https://resend.com/docs/send-with-nodejs
 *
 * 2. SendGrid
 *    - npm install @sendgrid/mail
 *    - https://www.npmjs.com/package/@sendgrid/mail
 *
 * 3. AWS SES
 *    - npm install @aws-sdk/client-ses
 *    - https://docs.aws.amazon.com/ses/
 *
 * 4. Mailgun
 *    - npm install mailgun.js
 *    - https://www.mailgun.com/
 *
 * Example implementation with Resend:
 *
 * import { Resend } from 'resend'
 *
 * export class ResendEmailService implements EmailService {
 *   private resend: Resend
 *
 *   constructor(apiKey: string) {
 *     this.resend = new Resend(apiKey)
 *   }
 *
 *   async sendTeamInvitation(params) {
 *     await this.resend.emails.send({
 *       from: 'noreply@play-smith.com',
 *       to: params.to,
 *       subject: `You've been invited to join ${params.teamName}`,
 *       html: `
 *         <h1>Join ${params.teamName} on Play Smith</h1>
 *         <p>${params.inviterName} has invited you to join their team as a ${params.role}.</p>
 *         <a href="${params.inviteLink}">Accept Invitation</a>
 *       `
 *     })
 *   }
 * }
 */
