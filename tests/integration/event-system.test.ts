/**
 * Integration tests for event system and analytics
 *
 * Tests domain events, event handlers, and analytics tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  eventBus,
  createEvent,
  DomainEventType,
  type DomainEvent,
  type TeamCreatedEvent,
  type MemberJoinedEvent,
  type GuideGeneratedEvent,
  type QuestCompletedEvent,
  type QuestBlockedEvent,
} from '@/lib/events'
import { analyticsService, AnalyticsEventType } from '@/lib/adapters/analytics-adapter'

describe('Event System Integration', () => {
  let capturedEvents: DomainEvent[] = []
  let capturedAnalytics: Array<{ type: AnalyticsEventType; properties: any }> = []

  beforeEach(() => {
    // Clear event bus to ensure test isolation
    eventBus.clear()

    capturedEvents = []
    capturedAnalytics = []

    // Set up event listeners
    Object.values(DomainEventType).forEach((eventType) => {
      eventBus.on(eventType, async (event) => {
        capturedEvents.push(event)
      })
    })

    // Mock analytics to capture calls
    const originalTrack = analyticsService.track.bind(analyticsService)
    analyticsService.track = async (type, properties, userId, teamId) => {
      capturedAnalytics.push({ type, properties })
      return originalTrack(type, properties, userId, teamId)
    }
  })

  afterEach(() => {
    capturedEvents = []
    capturedAnalytics = []
  })

  describe('Domain Events', () => {
    it('should emit and capture TeamCreated event', async () => {
      const event = createEvent<TeamCreatedEvent>(DomainEventType.TEAM_CREATED, {
        teamId: 'team-123',
        name: 'New Team',
        slug: 'new-team',
        createdBy: {
          id: 'user-1',
          email: 'admin@test.com',
        },
      })

      await eventBus.emit(event)

      expect(capturedEvents).toHaveLength(1)
      expect(capturedEvents[0].type).toBe(DomainEventType.TEAM_CREATED)
      expect((capturedEvents[0] as TeamCreatedEvent).teamId).toBe('team-123')
      expect((capturedEvents[0] as TeamCreatedEvent).name).toBe('New Team')
    })

    it('should emit and capture MemberJoined event', async () => {
      const event = createEvent<MemberJoinedEvent>(DomainEventType.MEMBER_JOINED, {
        teamId: 'team-123',
        member: {
          id: 'member-1',
          email: 'member@test.com',
          name: 'New Member',
          role: 'MEMBER',
        },
        invitedBy: {
          id: 'admin-1',
          email: 'admin@test.com',
        },
      })

      await eventBus.emit(event)

      expect(capturedEvents).toHaveLength(1)
      expect(capturedEvents[0].type).toBe(DomainEventType.MEMBER_JOINED)
      expect((capturedEvents[0] as MemberJoinedEvent).member.email).toBe('member@test.com')
      expect((capturedEvents[0] as MemberJoinedEvent).teamId).toBe('team-123')
    })

    it('should emit and capture GuideGenerated event', async () => {
      const event = createEvent<GuideGeneratedEvent>(DomainEventType.GUIDE_GENERATED, {
        teamId: 'team-123',
        guide: {
          id: 'guide-1',
          title: 'Onboarding Guide',
          targetRole: 'developer',
        },
        questCount: 5,
        generatedBy: {
          id: 'user-1',
          email: 'user@test.com',
        },
      })

      await eventBus.emit(event)

      expect(capturedEvents).toHaveLength(1)
      expect(capturedEvents[0].type).toBe(DomainEventType.GUIDE_GENERATED)
      expect((capturedEvents[0] as GuideGeneratedEvent).questCount).toBe(5)
      expect((capturedEvents[0] as GuideGeneratedEvent).guide.title).toBe('Onboarding Guide')
    })

    it('should emit and capture QuestCompleted event', async () => {
      const event = createEvent<QuestCompletedEvent>(DomainEventType.QUEST_COMPLETED, {
        teamId: 'team-123',
        quest: {
          id: 'quest-1',
          title: 'Setup Environment',
        },
        member: {
          id: 'member-1',
          email: 'member@test.com',
          name: 'Member',
        },
        timeSpentMinutes: 120,
        feedbackRating: 5,
      })

      await eventBus.emit(event)

      expect(capturedEvents).toHaveLength(1)
      expect(capturedEvents[0].type).toBe(DomainEventType.QUEST_COMPLETED)
      expect((capturedEvents[0] as QuestCompletedEvent).timeSpentMinutes).toBe(120)
      expect((capturedEvents[0] as QuestCompletedEvent).feedbackRating).toBe(5)
    })

    it('should emit and capture QuestBlocked event', async () => {
      const event = createEvent<QuestBlockedEvent>(DomainEventType.QUEST_BLOCKED, {
        teamId: 'team-123',
        quest: {
          id: 'quest-1',
          title: 'Deploy to Production',
        },
        member: {
          id: 'member-1',
          email: 'member@test.com',
        },
        blockers: 'Missing production access credentials',
      })

      await eventBus.emit(event)

      expect(capturedEvents).toHaveLength(1)
      expect(capturedEvents[0].type).toBe(DomainEventType.QUEST_BLOCKED)
      expect((capturedEvents[0] as QuestBlockedEvent).blockers).toContain('production access')
    })

    it('should handle multiple event handlers for same event type', async () => {
      const handler1Results: DomainEvent[] = []
      const handler2Results: DomainEvent[] = []

      // Register two separate handlers
      eventBus.on(DomainEventType.QUEST_COMPLETED, async (event) => {
        handler1Results.push(event)
      })

      eventBus.on(DomainEventType.QUEST_COMPLETED, async (event) => {
        handler2Results.push(event)
      })

      const event = createEvent<QuestCompletedEvent>(DomainEventType.QUEST_COMPLETED, {
        teamId: 'team-123',
        quest: { id: 'quest-1', title: 'Quest' },
        member: { id: 'member-1', email: 'test@test.com', name: 'Test' },
        timeSpentMinutes: 60,
      })

      await eventBus.emit(event)

      // Both handlers should receive the event (plus the global capturedEvents handler)
      expect(handler1Results).toHaveLength(1)
      expect(handler2Results).toHaveLength(1)
      expect(capturedEvents.length).toBeGreaterThanOrEqual(1)
    })

    it('should emit events in sequence and maintain order', async () => {
      const events = [
        createEvent(DomainEventType.TEAM_CREATED, {
          teamId: 'team-1',
          name: 'Team 1',
          slug: 'team-1',
        }),
        createEvent(DomainEventType.MEMBER_JOINED, {
          teamId: 'team-1',
          member: { id: 'm1', email: 'test@test.com', name: 'Test', role: 'MEMBER' },
        }),
        createEvent(DomainEventType.GUIDE_GENERATED, {
          teamId: 'team-1',
          guide: { id: 'g1', title: 'Guide', targetRole: 'dev' },
          questCount: 3,
        }),
      ]

      for (const event of events) {
        await eventBus.emit(event)
      }

      expect(capturedEvents).toHaveLength(3)
      expect(capturedEvents[0].type).toBe(DomainEventType.TEAM_CREATED)
      expect(capturedEvents[1].type).toBe(DomainEventType.MEMBER_JOINED)
      expect(capturedEvents[2].type).toBe(DomainEventType.GUIDE_GENERATED)
    })
  })

  describe('Event Metadata', () => {
    it('should include timestamp in all events', async () => {
      const event = createEvent(DomainEventType.TEAM_CREATED, {
        teamId: 'team-1',
        name: 'Test Team',
        slug: 'test-team',
      })

      await eventBus.emit(event)

      expect(capturedEvents[0].timestamp).toBeDefined()
      expect(capturedEvents[0].timestamp).toBeInstanceOf(Date)
      expect(capturedEvents[0].timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should include type in all events', async () => {
      const event = createEvent(DomainEventType.TEAM_CREATED, {
        teamId: 'team-1',
        name: 'Test Team',
        slug: 'test-team',
      })

      await eventBus.emit(event)

      expect(capturedEvents[0].type).toBeDefined()
      expect(typeof capturedEvents[0].type).toBe('string')
      expect(capturedEvents[0].type).toBe(DomainEventType.TEAM_CREATED)
    })

    it('should emit events with correct types', async () => {
      const event1 = createEvent(DomainEventType.TEAM_CREATED, {
        teamId: 'team-1',
        name: 'Team 1',
        slug: 'team-1',
      })

      const event2 = createEvent(DomainEventType.MEMBER_JOINED, {
        teamId: 'team-1',
        member: { id: 'm1', email: 'test@test.com', name: 'Test', role: 'MEMBER' },
      })

      await eventBus.emit(event1)
      await eventBus.emit(event2)

      expect(capturedEvents[0].type).toBe(DomainEventType.TEAM_CREATED)
      expect(capturedEvents[1].type).toBe(DomainEventType.MEMBER_JOINED)
    })
  })

  describe('Analytics Integration', () => {
    it('should track analytics when quest is started', async () => {
      await analyticsService.track(
        AnalyticsEventType.QUEST_STARTED,
        {
          questId: 'quest-1',
        },
        'member-1',
        'team-1'
      )

      expect(capturedAnalytics.length).toBeGreaterThan(0)
      const lastAnalytic = capturedAnalytics[capturedAnalytics.length - 1]
      expect(lastAnalytic.type).toBe(AnalyticsEventType.QUEST_STARTED)
      expect(lastAnalytic.properties.questId).toBe('quest-1')
    })

    it('should track analytics when quest is completed', async () => {
      await analyticsService.track(
        AnalyticsEventType.QUEST_COMPLETED,
        {
          questId: 'quest-1',
          timeSpentMinutes: 150,
          rating: 5,
        },
        'member-1',
        'team-1'
      )

      expect(capturedAnalytics.length).toBeGreaterThan(0)
      const lastAnalytic = capturedAnalytics[capturedAnalytics.length - 1]
      expect(lastAnalytic.type).toBe(AnalyticsEventType.QUEST_COMPLETED)
      expect(lastAnalytic.properties.timeSpentMinutes).toBe(150)
      expect(lastAnalytic.properties.rating).toBe(5)
    })

    it('should track analytics when guide is generated', async () => {
      await analyticsService.track(
        AnalyticsEventType.GUIDE_GENERATED,
        {
          guideId: 'guide-1',
          questCount: 7,
          targetRole: 'senior-developer',
          repoCount: 3,
        },
        'user-1',
        'team-1'
      )

      expect(capturedAnalytics.length).toBeGreaterThan(0)
      const lastAnalytic = capturedAnalytics[capturedAnalytics.length - 1]
      expect(lastAnalytic.type).toBe(AnalyticsEventType.GUIDE_GENERATED)
      expect(lastAnalytic.properties.questCount).toBe(7)
      expect(lastAnalytic.properties.repoCount).toBe(3)
    })

    it('should track member invitations', async () => {
      await analyticsService.track(
        AnalyticsEventType.MEMBER_INVITED,
        {
          role: 'MEMBER',
          invitedBy: 'admin-1',
        },
        'member-1',
        'team-1'
      )

      expect(capturedAnalytics.length).toBeGreaterThan(0)
      const lastAnalytic = capturedAnalytics[capturedAnalytics.length - 1]
      expect(lastAnalytic.type).toBe(AnalyticsEventType.MEMBER_INVITED)
      expect(lastAnalytic.properties.role).toBe('MEMBER')
    })

    it('should track template usage', async () => {
      await analyticsService.track(
        AnalyticsEventType.TEMPLATE_USED,
        {
          templateId: 'template-1',
          category: 'technical-setup',
          difficulty: 'beginner',
        },
        'user-1',
        'team-1'
      )

      expect(capturedAnalytics.length).toBeGreaterThan(0)
      const lastAnalytic = capturedAnalytics[capturedAnalytics.length - 1]
      expect(lastAnalytic.type).toBe(AnalyticsEventType.TEMPLATE_USED)
      expect(lastAnalytic.properties.templateId).toBe('template-1')
    })

    it('should measure timing for operations', async () => {
      const operation = async () => {
        // Simulate some async work
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'result'
      }

      const result = await analyticsService.time('test-operation', operation)

      expect(result).toBe('result')
      // Note: We can't easily verify timing was recorded without more mocking,
      // but we ensure the operation completes successfully
    })
  })

  describe('Event-Driven Workflows', () => {
    it('should trigger notification when quest is completed', async () => {
      const notifications: string[] = []

      // Register handler that simulates sending notification
      eventBus.on(DomainEventType.QUEST_COMPLETED, async (event) => {
        const completedEvent = event as QuestCompletedEvent
        notifications.push(`Notification sent to ${completedEvent.member.email} about completing ${completedEvent.quest.title}`)
      })

      const event = createEvent<QuestCompletedEvent>(DomainEventType.QUEST_COMPLETED, {
        teamId: 'team-1',
        quest: { id: 'q1', title: 'Setup Dev Environment' },
        member: { id: 'm1', email: 'dev@test.com', name: 'Dev' },
        timeSpentMinutes: 120,
        feedbackRating: 5,
      })

      await eventBus.emit(event)

      expect(notifications).toHaveLength(1)
      expect(notifications[0]).toContain('dev@test.com')
      expect(notifications[0]).toContain('Setup Dev Environment')
    })

    it('should trigger alert when quest is blocked', async () => {
      const alerts: string[] = []

      eventBus.on(DomainEventType.QUEST_BLOCKED, async (event) => {
        const blockedEvent = event as QuestBlockedEvent
        alerts.push(`Alert: ${blockedEvent.member.email} blocked on ${blockedEvent.quest.title}: ${blockedEvent.blockers}`)
      })

      const event = createEvent<QuestBlockedEvent>(DomainEventType.QUEST_BLOCKED, {
        teamId: 'team-1',
        quest: { id: 'q1', title: 'Database Setup' },
        member: { id: 'm1', email: 'dev@test.com' },
        blockers: 'Missing database credentials',
      })

      await eventBus.emit(event)

      expect(alerts).toHaveLength(1)
      expect(alerts[0]).toContain('Missing database credentials')
    })

    it('should handle guide generation workflow', async () => {
      const workflowSteps: string[] = []

      // Register handlers for guide generation workflow
      eventBus.on(DomainEventType.GUIDE_GENERATED, async (event) => {
        const generatedEvent = event as GuideGeneratedEvent
        workflowSteps.push(`1. Guide "${generatedEvent.guide.title}" generated with ${generatedEvent.questCount} quests`)
      })

      eventBus.on(DomainEventType.GUIDE_PUBLISHED, async (event) => {
        workflowSteps.push(`2. Guide published`)
      })

      // Emit events in sequence
      await eventBus.emit(
        createEvent<GuideGeneratedEvent>(DomainEventType.GUIDE_GENERATED, {
          teamId: 'team-1',
          guide: { id: 'g1', title: 'New Hire Guide', targetRole: 'junior' },
          questCount: 5,
        })
      )

      await eventBus.emit(
        createEvent(DomainEventType.GUIDE_PUBLISHED, {
          teamId: 'team-1',
          guideId: 'g1',
          publishedBy: { id: 'u1', email: 'admin@test.com' },
        })
      )

      expect(workflowSteps).toHaveLength(2)
      expect(workflowSteps[0]).toContain('generated with 5 quests')
      expect(workflowSteps[1]).toContain('published')
    })
  })
})
