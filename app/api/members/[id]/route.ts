import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse, handleApiError } from '@/lib/api-response'
import { eventBus, createEvent, DomainEventType, MemberLeftEvent } from '@/lib/events'
import { logger } from '@/lib/logger'

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  title: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().datetime().optional(),
  metadataJson: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    logger.info('Fetching team member', { memberId: id })

    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        questProgress: {
          include: {
            quest: {
              select: {
                id: true,
                title: true,
                estimatedHours: true,
                tagsJson: true,
                guide: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    })

    if (!member) {
      return successResponse({ error: 'Member not found' }, 404)
    }

    return successResponse({ member })
  } catch (error) {
    logger.error('Failed to fetch team member', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)

    logger.info('Updating team member', { memberId: id })

    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    logger.info('Team member updated successfully', { memberId: id })

    return successResponse({ member })
  } catch (error) {
    logger.error('Failed to update team member', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    logger.info('Deleting team member', { memberId: id })

    // Fetch member before deletion to emit event
    const member = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!member) {
      return successResponse({ error: 'Member not found' }, 404)
    }

    await prisma.teamMember.delete({
      where: { id },
    })

    // Emit member left event
    const event = createEvent<MemberLeftEvent>(
      DomainEventType.MEMBER_LEFT,
      {
        teamId: member.teamId,
        member: {
          id: member.id,
          email: member.email,
          name: member.name,
        },
      }
    )
    await eventBus.emit(event)

    logger.info('Team member deleted successfully', { memberId: id })

    return successResponse({ success: true })
  } catch (error) {
    logger.error('Failed to delete team member', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}
