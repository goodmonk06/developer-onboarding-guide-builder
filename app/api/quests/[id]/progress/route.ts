import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse, handleApiError } from '@/lib/api-response'
import {
  eventBus,
  createEvent,
  DomainEventType,
  QuestCompletedEvent,
  QuestBlockedEvent,
} from '@/lib/events'
import { logger } from '@/lib/logger'
import { analyticsService, AnalyticsEventType } from '@/lib/adapters/analytics-adapter'

const updateProgressSchema = z.object({
  memberId: z.string().cuid(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED']),
  timeSpentMinutes: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().optional(),
  blockers: z.string().optional(),
  metadataJson: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params

    logger.info('Fetching quest progress', { questId })

    const progressRecords = await prisma.questProgress.findMany({
      where: { questId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            title: true,
          },
        },
        quest: {
          select: {
            id: true,
            title: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return successResponse({ progress: progressRecords })
  } catch (error) {
    logger.error('Failed to fetch quest progress', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params
    const body = await request.json()
    const validatedData = updateProgressSchema.parse(body)

    logger.info('Updating quest progress', { questId, memberId: validatedData.memberId })

    // Fetch quest and member for validation and events
    const [quest, member] = await Promise.all([
      prisma.quest.findUnique({
        where: { id: questId },
        include: {
          guide: {
            select: {
              teamId: true,
            },
          },
        },
      }),
      prisma.teamMember.findUnique({
        where: { id: validatedData.memberId },
      }),
    ])

    if (!quest) {
      return successResponse({ error: 'Quest not found' }, 404)
    }

    if (!member) {
      return successResponse({ error: 'Member not found' }, 404)
    }

    // Update or create progress
    const now = new Date()
    const progress = await prisma.questProgress.upsert({
      where: {
        questId_memberId: {
          questId,
          memberId: validatedData.memberId,
        },
      },
      create: {
        questId,
        memberId: validatedData.memberId,
        status: validatedData.status,
        timeSpentMinutes: validatedData.timeSpentMinutes || 0,
        notes: validatedData.notes,
        feedbackRating: validatedData.feedbackRating,
        feedbackText: validatedData.feedbackText,
        blockers: validatedData.blockers,
        metadataJson: validatedData.metadataJson,
        startedAt:
          validatedData.status === 'IN_PROGRESS' || validatedData.status === 'COMPLETED'
            ? now
            : undefined,
        completedAt: validatedData.status === 'COMPLETED' ? now : undefined,
      },
      update: {
        status: validatedData.status,
        timeSpentMinutes: validatedData.timeSpentMinutes,
        notes: validatedData.notes,
        feedbackRating: validatedData.feedbackRating,
        feedbackText: validatedData.feedbackText,
        blockers: validatedData.blockers,
        metadataJson: validatedData.metadataJson,
        startedAt:
          validatedData.status === 'IN_PROGRESS' && !progress?.startedAt ? now : undefined,
        completedAt: validatedData.status === 'COMPLETED' ? now : undefined,
      },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        quest: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Emit appropriate events based on status
    const teamId = quest.guide?.teamId

    if (validatedData.status === 'COMPLETED') {
      const event = createEvent<QuestCompletedEvent>(
        DomainEventType.QUEST_COMPLETED,
        {
          teamId,
          quest: {
            id: quest.id,
            title: quest.title,
          },
          member: {
            id: member.id,
            email: member.email,
            name: member.name,
          },
          timeSpentMinutes: validatedData.timeSpentMinutes || 0,
          feedbackRating: validatedData.feedbackRating,
        }
      )
      await eventBus.emit(event)

      // Track analytics
      await analyticsService.track(
        AnalyticsEventType.QUEST_COMPLETED,
        {
          questId: quest.id,
          timeSpentMinutes: validatedData.timeSpentMinutes,
          rating: validatedData.feedbackRating,
        },
        member.id,
        teamId
      )
    } else if (validatedData.status === 'BLOCKED' && validatedData.blockers) {
      const event = createEvent<QuestBlockedEvent>(
        DomainEventType.QUEST_BLOCKED,
        {
          teamId,
          quest: {
            id: quest.id,
            title: quest.title,
          },
          member: {
            id: member.id,
            email: member.email,
          },
          blockers: validatedData.blockers,
        }
      )
      await eventBus.emit(event)
    } else if (validatedData.status === 'IN_PROGRESS') {
      await analyticsService.track(
        AnalyticsEventType.QUEST_STARTED,
        {
          questId: quest.id,
        },
        member.id,
        teamId
      )
    }

    logger.info('Quest progress updated successfully', {
      questId,
      memberId: validatedData.memberId,
      status: validatedData.status,
    })

    return successResponse({ progress })
  } catch (error) {
    logger.error('Failed to update quest progress', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}
