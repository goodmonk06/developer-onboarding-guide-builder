/**
 * Integration tests for complete onboarding flow
 *
 * Tests the full vertical slice:
 * Team creation → Member addition → Guide generation → Quest assignment → Progress tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { eventBus, DomainEventType, type DomainEvent } from '@/lib/events'
import { generateSlug } from '@/lib/utils'

const prisma = new PrismaClient()

describe('Complete Onboarding Flow Integration', () => {
  let capturedEvents: DomainEvent[] = []
  let teamId: string
  let memberId: string
  let guideId: string
  let questId: string

  beforeEach(() => {
    capturedEvents = []
    // Capture all events during tests
    Object.values(DomainEventType).forEach((eventType) => {
      eventBus.on(eventType, async (event) => {
        capturedEvents.push(event)
      })
    })
  })

  afterEach(async () => {
    // Clean up test data
    if (memberId) {
      await prisma.questProgress.deleteMany({ where: { memberId } })
      await prisma.teamMember.delete({ where: { id: memberId } }).catch(() => {})
    }
    if (guideId) {
      await prisma.quest.deleteMany({ where: { guideId } })
      await prisma.onboardingGuide.delete({ where: { id: guideId } }).catch(() => {})
    }
    if (teamId) {
      await prisma.teamSpace.delete({ where: { id: teamId } }).catch(() => {})
    }
  })

  it('should complete full onboarding workflow from team creation to quest completion', async () => {
    // Step 1: Create a team
    const teamSlug = generateSlug('Integration Test Team')
    const team = await prisma.teamSpace.create({
      data: {
        name: 'Integration Test Team',
        slug: teamSlug,
        description: 'Team for integration testing',
      },
    })
    teamId = team.id

    expect(team).toBeDefined()
    expect(team.slug).toBe(teamSlug)

    // Step 2: Add a team member
    const member = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        email: 'test-member@example.com',
        name: 'Test Member',
        role: 'MEMBER',
        status: 'ACTIVE',
        title: 'Junior Developer',
      },
    })
    memberId = member.id

    expect(member).toBeDefined()
    expect(member.teamId).toBe(team.id)
    expect(member.status).toBe('ACTIVE')

    // Step 3: Create an onboarding guide
    const guide = await prisma.onboardingGuide.create({
      data: {
        teamId: team.id,
        title: 'Test Onboarding Guide',
        targetRole: 'junior-developer',
        markdownBody: '# Welcome\n\nComplete the quests to get started.',
        estimatedDays: 14,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    guideId = guide.id

    expect(guide).toBeDefined()
    expect(guide.status).toBe('PUBLISHED')
    expect(guide.publishedAt).toBeDefined()

    // Step 4: Create a quest in the guide
    const quest = await prisma.quest.create({
      data: {
        guideId: guide.id,
        title: 'Setup Development Environment',
        descriptionMarkdown: '## Setup\n\n1. Install Node.js\n2. Clone repository',
        estimatedHours: 4,
        orderIndex: 0,
        tags: ['setup', 'environment'],
      },
    })
    questId = quest.id

    expect(quest).toBeDefined()
    expect(quest.guideId).toBe(guide.id)

    // Step 5: Start the quest
    const progressStarted = await prisma.questProgress.create({
      data: {
        questId: quest.id,
        memberId: member.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    })

    expect(progressStarted.status).toBe('IN_PROGRESS')
    expect(progressStarted.startedAt).toBeDefined()

    // Step 6: Complete the quest with feedback
    const progressCompleted = await prisma.questProgress.update({
      where: {
        questId_memberId: {
          questId: quest.id,
          memberId: member.id,
        },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        timeSpentMinutes: 240,
        feedbackRating: 5,
        feedbackText: 'Great quest! Very helpful setup guide.',
      },
    })

    expect(progressCompleted.status).toBe('COMPLETED')
    expect(progressCompleted.completedAt).toBeDefined()
    expect(progressCompleted.timeSpentMinutes).toBe(240)
    expect(progressCompleted.feedbackRating).toBe(5)

    // Step 7: Verify data integrity with relationships
    const memberWithProgress = await prisma.teamMember.findUnique({
      where: { id: member.id },
      include: {
        questProgress: {
          include: {
            quest: {
              include: {
                guide: true,
              },
            },
          },
        },
      },
    })

    expect(memberWithProgress).toBeDefined()
    expect(memberWithProgress?.questProgress).toHaveLength(1)
    expect(memberWithProgress?.questProgress[0].quest.title).toBe('Setup Development Environment')
    expect(memberWithProgress?.questProgress[0].quest.guide.title).toBe('Test Onboarding Guide')

    // Step 8: Calculate completion statistics
    const totalProgress = await prisma.questProgress.count({
      where: { memberId: member.id },
    })
    const completedProgress = await prisma.questProgress.count({
      where: {
        memberId: member.id,
        status: 'COMPLETED',
      },
    })

    const completionRate = (completedProgress / totalProgress) * 100
    expect(completionRate).toBe(100)
  })

  it('should track multiple members progressing through the same guide', async () => {
    // Create team
    const team = await prisma.teamSpace.create({
      data: {
        name: 'Multi-Member Team',
        slug: generateSlug('Multi-Member Team'),
      },
    })
    teamId = team.id

    // Create guide with 2 quests
    const guide = await prisma.onboardingGuide.create({
      data: {
        teamId: team.id,
        title: 'Shared Guide',
        targetRole: 'developer',
        markdownBody: 'Shared guide content',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    guideId = guide.id

    const quest1 = await prisma.quest.create({
      data: {
        guideId: guide.id,
        title: 'Quest 1',
        descriptionMarkdown: 'First quest',
        estimatedHours: 2,
        orderIndex: 0,
      },
    })

    const quest2 = await prisma.quest.create({
      data: {
        guideId: guide.id,
        title: 'Quest 2',
        descriptionMarkdown: 'Second quest',
        estimatedHours: 3,
        orderIndex: 1,
      },
    })

    // Create two members
    const member1 = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        email: 'member1@test.com',
        name: 'Member One',
        role: 'MEMBER',
      },
    })

    const member2 = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        email: 'member2@test.com',
        name: 'Member Two',
        role: 'MEMBER',
      },
    })

    // Member 1 completes both quests
    await prisma.questProgress.create({
      data: {
        questId: quest1.id,
        memberId: member1.id,
        status: 'COMPLETED',
        timeSpentMinutes: 120,
        completedAt: new Date(),
      },
    })

    await prisma.questProgress.create({
      data: {
        questId: quest2.id,
        memberId: member1.id,
        status: 'COMPLETED',
        timeSpentMinutes: 180,
        completedAt: new Date(),
      },
    })

    // Member 2 completes first quest, in progress on second
    await prisma.questProgress.create({
      data: {
        questId: quest1.id,
        memberId: member2.id,
        status: 'COMPLETED',
        timeSpentMinutes: 150,
        completedAt: new Date(),
      },
    })

    await prisma.questProgress.create({
      data: {
        questId: quest2.id,
        memberId: member2.id,
        status: 'IN_PROGRESS',
        timeSpentMinutes: 90,
        startedAt: new Date(),
      },
    })

    // Verify individual progress
    const member1Progress = await prisma.questProgress.findMany({
      where: { memberId: member1.id, status: 'COMPLETED' },
    })
    expect(member1Progress).toHaveLength(2)

    const member2Progress = await prisma.questProgress.findMany({
      where: { memberId: member2.id },
    })
    expect(member2Progress).toHaveLength(2)
    expect(member2Progress.filter((p) => p.status === 'COMPLETED')).toHaveLength(1)
    expect(member2Progress.filter((p) => p.status === 'IN_PROGRESS')).toHaveLength(1)

    // Cleanup
    await prisma.questProgress.deleteMany({ where: { memberId: member1.id } })
    await prisma.questProgress.deleteMany({ where: { memberId: member2.id } })
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
    await prisma.quest.deleteMany({ where: { guideId: guide.id } })
  })

  it('should handle blocked quests with blocker tracking', async () => {
    // Setup
    const team = await prisma.teamSpace.create({
      data: {
        name: 'Blocked Quest Team',
        slug: generateSlug('Blocked Quest Team'),
      },
    })
    teamId = team.id

    const member = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        email: 'blocked@test.com',
        name: 'Blocked Member',
        role: 'MEMBER',
      },
    })
    memberId = member.id

    const guide = await prisma.onboardingGuide.create({
      data: {
        teamId: team.id,
        title: 'Guide with Blockers',
        targetRole: 'developer',
        markdownBody: 'Guide content',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    guideId = guide.id

    const quest = await prisma.quest.create({
      data: {
        guideId: guide.id,
        title: 'Quest with Blocker',
        descriptionMarkdown: 'Quest that will be blocked',
        estimatedHours: 4,
        orderIndex: 0,
      },
    })
    questId = quest.id

    // Start quest
    await prisma.questProgress.create({
      data: {
        questId: quest.id,
        memberId: member.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    })

    // Block the quest
    const blockedProgress = await prisma.questProgress.update({
      where: {
        questId_memberId: {
          questId: quest.id,
          memberId: member.id,
        },
      },
      data: {
        status: 'BLOCKED',
        blockers: 'Missing access to staging environment. Waiting for DevOps team to provision credentials.',
        notes: 'Attempted to deploy but received authentication error.',
      },
    })

    expect(blockedProgress.status).toBe('BLOCKED')
    expect(blockedProgress.blockers).toContain('Missing access')

    // Verify blocked quest can be queried
    const blockedQuests = await prisma.questProgress.findMany({
      where: {
        status: 'BLOCKED',
        memberId: member.id,
      },
      include: {
        quest: true,
        member: true,
      },
    })

    expect(blockedQuests).toHaveLength(1)
    expect(blockedQuests[0].quest.title).toBe('Quest with Blocker')
    expect(blockedQuests[0].member.email).toBe('blocked@test.com')

    // Unblock and complete
    const unblocked = await prisma.questProgress.update({
      where: {
        questId_memberId: {
          questId: quest.id,
          memberId: member.id,
        },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        blockers: null,
        notes: 'Blocker resolved. Successfully deployed to staging.',
      },
    })

    expect(unblocked.status).toBe('COMPLETED')
    expect(unblocked.blockers).toBeNull()
  })
})
