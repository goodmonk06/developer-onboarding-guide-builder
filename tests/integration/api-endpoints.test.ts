/**
 * Integration tests for Phase 3 API endpoints
 *
 * Tests API routes for team members, quest progress, and templates
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { generateSlug } from '@/lib/utils'

const prisma = new PrismaClient()

describe('API Endpoints Integration', () => {
  let teamId: string
  let memberId: string
  let guideId: string
  let questId: string

  beforeEach(async () => {
    // Setup test team
    const team = await prisma.teamSpace.create({
      data: {
        name: 'API Test Team',
        slug: generateSlug('API Test Team'),
      },
    })
    teamId = team.id

    // Setup test guide and quest
    const guide = await prisma.onboardingGuide.create({
      data: {
        teamId: team.id,
        title: 'API Test Guide',
        targetRole: 'developer',
        markdownBody: 'Test content',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    guideId = guide.id

    const quest = await prisma.quest.create({
      data: {
        guideId: guide.id,
        title: 'Test Quest',
        descriptionMarkdown: 'Test quest description',
        estimatedHours: 2,
        orderIndex: 0,
      },
    })
    questId = quest.id
  })

  afterEach(async () => {
    // Cleanup
    if (memberId) {
      await prisma.questProgress.deleteMany({ where: { memberId } })
      await prisma.notification.deleteMany({ where: { memberId } })
      await prisma.teamMember.delete({ where: { id: memberId } }).catch(() => {})
    }
    if (guideId) {
      await prisma.quest.deleteMany({ where: { guideId } })
      await prisma.onboardingGuide.delete({ where: { id: guideId } }).catch(() => {})
    }
    if (teamId) {
      await prisma.teamMember.deleteMany({ where: { teamId } })
      await prisma.teamSpace.delete({ where: { id: teamId } }).catch(() => {})
    }
  })

  describe('Team Members API', () => {
    it('should create a new team member', async () => {
      const memberData = {
        email: 'newmember@test.com',
        name: 'New Member',
        role: 'MEMBER' as const,
        title: 'Software Engineer',
      }

      // Simulate POST /api/teams/[id]/members
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          ...memberData,
        },
      })
      memberId = member.id

      expect(member).toBeDefined()
      expect(member.email).toBe(memberData.email)
      expect(member.name).toBe(memberData.name)
      expect(member.role).toBe('MEMBER')
      expect(member.status).toBe('ACTIVE')
    })

    it('should list all members of a team', async () => {
      // Create multiple members
      const member1 = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'member1@test.com',
          name: 'Member One',
          role: 'MEMBER',
        },
      })

      const member2 = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'member2@test.com',
          name: 'Member Two',
          role: 'ADMIN',
        },
      })

      // Simulate GET /api/teams/[id]/members
      const members = await prisma.teamMember.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
      })

      expect(members).toHaveLength(2)
      expect(members.map((m) => m.email)).toContain('member1@test.com')
      expect(members.map((m) => m.email)).toContain('member2@test.com')

      // Cleanup
      await prisma.teamMember.deleteMany({ where: { teamId } })
    })

    it('should update a member profile', async () => {
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'updateme@test.com',
          name: 'Update Me',
          role: 'MEMBER',
        },
      })
      memberId = member.id

      // Simulate PATCH /api/members/[id]
      const updatedMember = await prisma.teamMember.update({
        where: { id: member.id },
        data: {
          name: 'Updated Name',
          title: 'Senior Engineer',
          githubUsername: 'updated-user',
        },
      })

      expect(updatedMember.name).toBe('Updated Name')
      expect(updatedMember.title).toBe('Senior Engineer')
      expect(updatedMember.githubUsername).toBe('updated-user')
    })

    it('should get member with progress data', async () => {
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'progress@test.com',
          name: 'Progress Member',
          role: 'MEMBER',
        },
      })
      memberId = member.id

      // Create progress
      await prisma.questProgress.create({
        data: {
          questId,
          memberId: member.id,
          status: 'COMPLETED',
          timeSpentMinutes: 120,
          completedAt: new Date(),
        },
      })

      // Simulate GET /api/members/[id] with progress included
      const memberWithProgress = await prisma.teamMember.findUnique({
        where: { id: member.id },
        include: {
          questProgress: {
            include: {
              quest: {
                select: {
                  id: true,
                  title: true,
                  estimatedHours: true,
                },
              },
            },
          },
        },
      })

      expect(memberWithProgress).toBeDefined()
      expect(memberWithProgress?.questProgress).toHaveLength(1)
      expect(memberWithProgress?.questProgress[0].status).toBe('COMPLETED')
      expect(memberWithProgress?.questProgress[0].quest.title).toBe('Test Quest')
    })

    it('should prevent duplicate member emails in same team', async () => {
      await prisma.teamMember.create({
        data: {
          teamId,
          email: 'duplicate@test.com',
          name: 'First Member',
          role: 'MEMBER',
        },
      })

      // Attempt to create duplicate
      await expect(
        prisma.teamMember.create({
          data: {
            teamId,
            email: 'duplicate@test.com',
            name: 'Second Member',
            role: 'MEMBER',
          },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.teamMember.deleteMany({ where: { email: 'duplicate@test.com' } })
    })
  })

  describe('Quest Progress API', () => {
    beforeEach(async () => {
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'progress-test@test.com',
          name: 'Progress Tester',
          role: 'MEMBER',
        },
      })
      memberId = member.id
    })

    it('should create quest progress', async () => {
      // Simulate POST /api/quests/[id]/progress
      const progress = await prisma.questProgress.create({
        data: {
          questId,
          memberId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      })

      expect(progress).toBeDefined()
      expect(progress.status).toBe('IN_PROGRESS')
      expect(progress.startedAt).toBeDefined()
      expect(progress.completedAt).toBeNull()
    })

    it('should update quest progress to completed', async () => {
      // Create initial progress
      await prisma.questProgress.create({
        data: {
          questId,
          memberId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      })

      // Update to completed
      const updated = await prisma.questProgress.update({
        where: {
          questId_memberId: {
            questId,
            memberId,
          },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          timeSpentMinutes: 135,
          feedbackRating: 4,
          feedbackText: 'Great quest!',
        },
      })

      expect(updated.status).toBe('COMPLETED')
      expect(updated.completedAt).toBeDefined()
      expect(updated.timeSpentMinutes).toBe(135)
      expect(updated.feedbackRating).toBe(4)
    })

    it('should upsert quest progress', async () => {
      // First upsert (create)
      const created = await prisma.questProgress.upsert({
        where: {
          questId_memberId: {
            questId,
            memberId,
          },
        },
        create: {
          questId,
          memberId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          timeSpentMinutes: 30,
        },
        update: {
          timeSpentMinutes: 60,
        },
      })

      expect(created.timeSpentMinutes).toBe(30)

      // Second upsert (update)
      const updated = await prisma.questProgress.upsert({
        where: {
          questId_memberId: {
            questId,
            memberId,
          },
        },
        create: {
          questId,
          memberId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          timeSpentMinutes: 30,
        },
        update: {
          timeSpentMinutes: 60,
        },
      })

      expect(updated.timeSpentMinutes).toBe(60)
      expect(updated.id).toBe(created.id) // Same record
    })

    it('should list all progress for a quest', async () => {
      // Create another member
      const member2 = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'member2-progress@test.com',
          name: 'Member Two',
          role: 'MEMBER',
        },
      })

      // Create progress for both members
      await prisma.questProgress.create({
        data: {
          questId,
          memberId,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      await prisma.questProgress.create({
        data: {
          questId,
          memberId: member2.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      })

      // Simulate GET /api/quests/[id]/progress
      const progressList = await prisma.questProgress.findMany({
        where: { questId },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      expect(progressList).toHaveLength(2)
      expect(progressList.some((p) => p.status === 'COMPLETED')).toBe(true)
      expect(progressList.some((p) => p.status === 'IN_PROGRESS')).toBe(true)

      // Cleanup
      await prisma.questProgress.deleteMany({ where: { memberId: member2.id } })
      await prisma.teamMember.delete({ where: { id: member2.id } })
    })

    it('should track blocked status with blockers', async () => {
      const progress = await prisma.questProgress.create({
        data: {
          questId,
          memberId,
          status: 'BLOCKED',
          blockers: 'Missing database credentials',
          notes: 'Unable to access staging database',
          startedAt: new Date(),
        },
      })

      expect(progress.status).toBe('BLOCKED')
      expect(progress.blockers).toContain('database credentials')
      expect(progress.notes).toBeDefined()
    })
  })

  describe('Quest Templates API', () => {
    const createdTemplateIds: string[] = []

    afterEach(async () => {
      for (const templateId of createdTemplateIds) {
        await prisma.questTemplate.delete({ where: { id: templateId } }).catch(() => {})
      }
      createdTemplateIds.length = 0
    })

    it('should create a quest template', async () => {
      // Simulate POST /api/templates
      const template = await prisma.questTemplate.create({
        data: {
          title: 'API Test Template',
          descriptionMarkdown: '## Template content',
          estimatedHours: 3,
          category: 'technical-setup',
          difficulty: 'beginner',
          tags: ['test', 'api'],
          isPublic: true,
        },
      })
      createdTemplateIds.push(template.id)

      expect(template).toBeDefined()
      expect(template.title).toBe('API Test Template')
      expect(template.isPublic).toBe(true)
      expect(template.usageCount).toBe(0)
    })

    it('should list public templates', async () => {
      // Create public and private templates
      const publicTemplate = await prisma.questTemplate.create({
        data: {
          title: 'Public Template',
          descriptionMarkdown: 'Public content',
          estimatedHours: 2,
          category: 'technical-setup',
          difficulty: 'beginner',
          isPublic: true,
        },
      })
      createdTemplateIds.push(publicTemplate.id)

      const privateTemplate = await prisma.questTemplate.create({
        data: {
          teamId,
          title: 'Private Template',
          descriptionMarkdown: 'Private content',
          estimatedHours: 2,
          category: 'team-process',
          difficulty: 'beginner',
          isPublic: false,
        },
      })
      createdTemplateIds.push(privateTemplate.id)

      // Simulate GET /api/templates (public only)
      const publicTemplates = await prisma.questTemplate.findMany({
        where: { isPublic: true },
      })

      expect(publicTemplates.some((t) => t.id === publicTemplate.id)).toBe(true)
      expect(publicTemplates.some((t) => t.id === privateTemplate.id)).toBe(false)
    })

    it('should filter templates by category', async () => {
      const setupTemplate = await prisma.questTemplate.create({
        data: {
          title: 'Setup Template',
          descriptionMarkdown: 'Setup content',
          estimatedHours: 2,
          category: 'technical-setup',
          difficulty: 'beginner',
          isPublic: true,
        },
      })
      createdTemplateIds.push(setupTemplate.id)

      const skillsTemplate = await prisma.questTemplate.create({
        data: {
          title: 'Skills Template',
          descriptionMarkdown: 'Skills content',
          estimatedHours: 3,
          category: 'soft-skills',
          difficulty: 'intermediate',
          isPublic: true,
        },
      })
      createdTemplateIds.push(skillsTemplate.id)

      // Simulate GET /api/templates?category=technical-setup
      const setupTemplates = await prisma.questTemplate.findMany({
        where: {
          category: 'technical-setup',
          isPublic: true,
        },
      })

      expect(setupTemplates).toHaveLength(1)
      expect(setupTemplates[0].title).toBe('Setup Template')
    })

    it('should filter templates by difficulty', async () => {
      const beginnerTemplate = await prisma.questTemplate.create({
        data: {
          title: 'Beginner Template',
          descriptionMarkdown: 'Easy content',
          estimatedHours: 2,
          category: 'technical-setup',
          difficulty: 'beginner',
          isPublic: true,
        },
      })
      createdTemplateIds.push(beginnerTemplate.id)

      const advancedTemplate = await prisma.questTemplate.create({
        data: {
          title: 'Advanced Template',
          descriptionMarkdown: 'Complex content',
          estimatedHours: 8,
          category: 'technical-deep-dive',
          difficulty: 'advanced',
          isPublic: true,
        },
      })
      createdTemplateIds.push(advancedTemplate.id)

      // Simulate GET /api/templates?difficulty=beginner
      const beginnerTemplates = await prisma.questTemplate.findMany({
        where: {
          difficulty: 'beginner',
          isPublic: true,
        },
      })

      expect(beginnerTemplates.some((t) => t.id === beginnerTemplate.id)).toBe(true)
      expect(beginnerTemplates.some((t) => t.id === advancedTemplate.id)).toBe(false)
    })

    it('should get team-specific templates', async () => {
      const teamTemplate = await prisma.questTemplate.create({
        data: {
          teamId,
          title: 'Team-Specific Template',
          descriptionMarkdown: 'Team content',
          estimatedHours: 3,
          category: 'team-process',
          difficulty: 'intermediate',
          isPublic: false,
        },
      })
      createdTemplateIds.push(teamTemplate.id)

      // Simulate GET /api/templates?teamId=xxx
      const teamTemplates = await prisma.questTemplate.findMany({
        where: {
          OR: [{ isPublic: true }, { teamId }],
        },
      })

      expect(teamTemplates.some((t) => t.id === teamTemplate.id)).toBe(true)
    })
  })

  describe('Notifications API', () => {
    beforeEach(async () => {
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          email: 'notification-test@test.com',
          name: 'Notification Tester',
          role: 'MEMBER',
        },
      })
      memberId = member.id
    })

    it('should create notifications for member', async () => {
      const notification = await prisma.notification.create({
        data: {
          memberId,
          type: 'QUEST_ASSIGNED',
          title: 'New Quest Assigned',
          message: 'You have been assigned a new quest: Test Quest',
          priority: 'medium',
          channels: ['in_app', 'email'],
        },
      })

      expect(notification).toBeDefined()
      expect(notification.type).toBe('QUEST_ASSIGNED')
      expect(notification.isRead).toBe(false)
      expect(notification.channels).toContain('email')

      // Cleanup
      await prisma.notification.delete({ where: { id: notification.id } })
    })

    it('should mark notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          memberId,
          type: 'REMINDER',
          title: 'Quest Reminder',
          message: 'Remember to complete your quest',
          priority: 'low',
          channels: ['in_app'],
        },
      })

      expect(notification.isRead).toBe(false)

      // Mark as read
      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      expect(updated.isRead).toBe(true)
      expect(updated.readAt).toBeDefined()

      // Cleanup
      await prisma.notification.delete({ where: { id: notification.id } })
    })

    it('should list unread notifications for member', async () => {
      // Create read and unread notifications
      const unread = await prisma.notification.create({
        data: {
          memberId,
          type: 'QUEST_COMPLETED',
          title: 'Quest Completed',
          message: 'You completed a quest!',
          priority: 'high',
          channels: ['in_app'],
        },
      })

      const read = await prisma.notification.create({
        data: {
          memberId,
          type: 'REMINDER',
          title: 'Old Reminder',
          message: 'Old message',
          priority: 'low',
          channels: ['in_app'],
          isRead: true,
          readAt: new Date(),
        },
      })

      // Get unread only
      const unreadNotifications = await prisma.notification.findMany({
        where: {
          memberId,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(unreadNotifications).toHaveLength(1)
      expect(unreadNotifications[0].id).toBe(unread.id)

      // Cleanup
      await prisma.notification.deleteMany({ where: { memberId } })
    })
  })
})
