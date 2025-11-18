/**
 * Notification Adapter Interface
 *
 * Provides a pluggable interface for sending notifications through various channels
 * (email, Slack, Discord, SMS, etc.). Implementations can be swapped without
 * changing core business logic.
 */

export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  DISCORD = 'discord',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
}

export interface NotificationRecipient {
  id?: string
  email?: string
  name?: string
  phone?: string
  slackUserId?: string
  discordUserId?: string
}

export interface NotificationPayload {
  channel: NotificationChannel
  recipient: NotificationRecipient
  title: string
  message: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  linkUrl?: string
  metadata?: Record<string, unknown>
  templateId?: string
  templateData?: Record<string, unknown>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
  sentAt: Date
}

/**
 * Base interface for notification adapters
 */
export interface INotificationAdapter {
  /**
   * The notification channel this adapter handles
   */
  readonly channel: NotificationChannel

  /**
   * Send a notification
   */
  send(payload: NotificationPayload): Promise<NotificationResult>

  /**
   * Check if the adapter is properly configured and ready
   */
  isConfigured(): boolean

  /**
   * Validate that the payload has all required fields for this channel
   */
  validatePayload(payload: NotificationPayload): { valid: boolean; errors?: string[] }
}

/**
 * In-memory notification adapter (for development/testing)
 */
export class InMemoryNotificationAdapter implements INotificationAdapter {
  readonly channel = NotificationChannel.IN_APP
  private sentNotifications: NotificationPayload[] = []

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    this.sentNotifications.push(payload)

    console.log('[InMemoryNotificationAdapter] Notification sent:', {
      to: payload.recipient.email || payload.recipient.name,
      title: payload.title,
      channel: payload.channel,
    })

    return {
      success: true,
      messageId: `in-memory-${Date.now()}`,
      sentAt: new Date(),
    }
  }

  isConfigured(): boolean {
    return true
  }

  validatePayload(payload: NotificationPayload): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!payload.title) errors.push('Title is required')
    if (!payload.message) errors.push('Message is required')
    if (!payload.recipient.email && !payload.recipient.name) {
      errors.push('Recipient must have at least email or name')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Get all sent notifications (for testing)
   */
  getSentNotifications(): NotificationPayload[] {
    return [...this.sentNotifications]
  }

  /**
   * Clear sent notifications (for testing)
   */
  clear(): void {
    this.sentNotifications = []
  }
}

/**
 * Email notification adapter (stub)
 */
export class EmailNotificationAdapter implements INotificationAdapter {
  readonly channel = NotificationChannel.EMAIL

  constructor(private config: { apiKey?: string; fromEmail?: string } = {}) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email adapter not configured',
        sentAt: new Date(),
      }
    }

    // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
    console.log('[EmailNotificationAdapter] Would send email:', {
      to: payload.recipient.email,
      subject: payload.title,
      from: this.config.fromEmail,
    })

    return {
      success: true,
      messageId: `email-stub-${Date.now()}`,
      sentAt: new Date(),
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.fromEmail
  }

  validatePayload(payload: NotificationPayload): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!payload.recipient.email) {
      errors.push('Email address is required for email notifications')
    }
    if (!payload.title) errors.push('Subject is required')
    if (!payload.message) errors.push('Message body is required')

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}

/**
 * Slack notification adapter (stub)
 */
export class SlackNotificationAdapter implements INotificationAdapter {
  readonly channel = NotificationChannel.SLACK

  constructor(private config: { webhookUrl?: string; botToken?: string } = {}) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Slack adapter not configured',
        sentAt: new Date(),
      }
    }

    // TODO: Integrate with Slack API or Webhook
    console.log('[SlackNotificationAdapter] Would send Slack message:', {
      user: payload.recipient.slackUserId || payload.recipient.email,
      title: payload.title,
    })

    return {
      success: true,
      messageId: `slack-stub-${Date.now()}`,
      sentAt: new Date(),
    }
  }

  isConfigured(): boolean {
    return !!this.config.webhookUrl || !!this.config.botToken
  }

  validatePayload(payload: NotificationPayload): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    if (!payload.recipient.slackUserId && !payload.recipient.email) {
      errors.push('Slack user ID or email is required')
    }
    if (!payload.message) errors.push('Message is required')

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}

/**
 * Notification service that uses adapters
 */
export class NotificationService {
  private adapters: Map<NotificationChannel, INotificationAdapter> = new Map()

  constructor(defaultAdapter?: INotificationAdapter) {
    if (defaultAdapter) {
      this.registerAdapter(defaultAdapter)
    } else {
      // Use in-memory adapter by default
      this.registerAdapter(new InMemoryNotificationAdapter())
    }
  }

  /**
   * Register a notification adapter for a specific channel
   */
  registerAdapter(adapter: INotificationAdapter): void {
    this.adapters.set(adapter.channel, adapter)
  }

  /**
   * Send a notification using the appropriate adapter
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const adapter = this.adapters.get(payload.channel)

    if (!adapter) {
      console.warn(`No adapter registered for channel: ${payload.channel}`)
      return {
        success: false,
        error: `No adapter for channel: ${payload.channel}`,
        sentAt: new Date(),
      }
    }

    // Validate payload
    const validation = adapter.validatePayload(payload)
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`,
        sentAt: new Date(),
      }
    }

    // Send notification
    return adapter.send(payload)
  }

  /**
   * Send notifications to multiple channels
   */
  async sendMulti(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)))
  }

  /**
   * Check if a channel is available
   */
  isChannelAvailable(channel: NotificationChannel): boolean {
    return this.adapters.has(channel)
  }
}

// Global notification service instance
export const notificationService = new NotificationService()
