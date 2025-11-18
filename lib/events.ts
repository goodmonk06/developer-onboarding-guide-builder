/**
 * Domain Events System
 *
 * Provides a typed event system for cross-cutting concerns like notifications,
 * analytics, and integrations. Events are emitted when important domain actions occur.
 */

export enum DomainEventType {
  // Team events
  TEAM_CREATED = 'team.created',
  TEAM_UPDATED = 'team.updated',
  TEAM_DELETED = 'team.deleted',

  // Member events
  MEMBER_JOINED = 'member.joined',
  MEMBER_LEFT = 'member.left',
  MEMBER_ROLE_CHANGED = 'member.role_changed',

  // Guide events
  GUIDE_GENERATED = 'guide.generated',
  GUIDE_PUBLISHED = 'guide.published',
  GUIDE_ARCHIVED = 'guide.archived',
  GUIDE_UPDATED = 'guide.updated',

  // Quest events
  QUEST_ASSIGNED = 'quest.assigned',
  QUEST_STARTED = 'quest.started',
  QUEST_COMPLETED = 'quest.completed',
  QUEST_BLOCKED = 'quest.blocked',

  // Repository events
  REPO_ADDED = 'repo.added',
  REPO_ANALYZED = 'repo.analyzed',
  REPO_REMOVED = 'repo.removed',

  // Template events
  TEMPLATE_CREATED = 'template.created',
  TEMPLATE_USED = 'template.used',

  // System events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
}

export interface BaseDomainEvent {
  type: DomainEventType
  timestamp: Date
  correlationId?: string
  userId?: string
  teamId?: string
  metadata?: Record<string, unknown>
}

// Team Events

export interface TeamCreatedEvent extends BaseDomainEvent {
  type: DomainEventType.TEAM_CREATED
  team: {
    id: string
    name: string
    slug: string
  }
}

export interface TeamUpdatedEvent extends BaseDomainEvent {
  type: DomainEventType.TEAM_UPDATED
  team: {
    id: string
    name: string
    changes: string[]
  }
}

// Member Events

export interface MemberJoinedEvent extends BaseDomainEvent {
  type: DomainEventType.MEMBER_JOINED
  member: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface MemberLeftEvent extends BaseDomainEvent {
  type: DomainEventType.MEMBER_LEFT
  member: {
    id: string
    email: string
    name: string
  }
}

// Guide Events

export interface GuideGeneratedEvent extends BaseDomainEvent {
  type: DomainEventType.GUIDE_GENERATED
  guide: {
    id: string
    title: string
    targetRole: string
    questCount: number
    estimatedDays: number
  }
}

export interface GuidePublishedEvent extends BaseDomainEvent {
  type: DomainEventType.GUIDE_PUBLISHED
  guide: {
    id: string
    title: string
    version: number
  }
}

// Quest Events

export interface QuestAssignedEvent extends BaseDomainEvent {
  type: DomainEventType.QUEST_ASSIGNED
  quest: {
    id: string
    title: string
    estimatedHours: number
  }
  assignee: {
    id: string
    email: string
    name: string
  }
}

export interface QuestCompletedEvent extends BaseDomainEvent {
  type: DomainEventType.QUEST_COMPLETED
  quest: {
    id: string
    title: string
  }
  member: {
    id: string
    email: string
    name: string
  }
  timeSpentMinutes: number
  feedbackRating?: number
}

export interface QuestBlockedEvent extends BaseDomainEvent {
  type: DomainEventType.QUEST_BLOCKED
  quest: {
    id: string
    title: string
  }
  member: {
    id: string
    email: string
  }
  blockers: string
}

// Repository Events

export interface RepoAddedEvent extends BaseDomainEvent {
  type: DomainEventType.REPO_ADDED
  repo: {
    id: string
    githubUrl: string
    role: string
  }
}

export interface RepoAnalyzedEvent extends BaseDomainEvent {
  type: DomainEventType.REPO_ANALYZED
  repo: {
    id: string
    githubUrl: string
  }
  analysis: {
    mainLanguage: string | null
    keyFolders: string[]
    hasPackageJson: boolean
  }
}

// Union type of all events
export type DomainEvent =
  | TeamCreatedEvent
  | TeamUpdatedEvent
  | MemberJoinedEvent
  | MemberLeftEvent
  | GuideGeneratedEvent
  | GuidePublishedEvent
  | QuestAssignedEvent
  | QuestCompletedEvent
  | QuestBlockedEvent
  | RepoAddedEvent
  | RepoAnalyzedEvent

// Event Handler type
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void

// Event Bus
class EventBus {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map()

  /**
   * Register an event handler
   */
  on<T extends DomainEvent>(eventType: DomainEventType, handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType) || []
    this.handlers.set(eventType, [...existingHandlers, handler as EventHandler])
  }

  /**
   * Unregister an event handler
   */
  off<T extends DomainEvent>(eventType: DomainEventType, handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType) || []
    this.handlers.set(
      eventType,
      existingHandlers.filter((h) => h !== handler)
    )
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || []

    // Execute handlers in parallel
    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
          // Don't throw - we want other handlers to still execute
        }
      })
    )
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Get registered handler count for an event type
   */
  getHandlerCount(eventType: DomainEventType): number {
    return this.handlers.get(eventType)?.length || 0
  }
}

// Global event bus instance
export const eventBus = new EventBus()

/**
 * Helper function to create events with common fields
 */
export function createEvent<T extends DomainEvent>(
  type: T['type'],
  data: Omit<T, 'type' | 'timestamp'>,
  correlationId?: string
): T {
  return {
    ...data,
    type,
    timestamp: new Date(),
    correlationId,
  } as T
}
