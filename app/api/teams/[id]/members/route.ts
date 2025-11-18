import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse, handleApiError } from '@/lib/api-response'
import { eventBus, createEvent, DomainEventType, MemberJoinedEvent } from '@/lib/events'
import { logger } from '@/lib/logger'
import { isValidEmail } from '@/lib/utils'

const createMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
  title: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().datetime().optional(),
  metadataJson: z.string().optional(),
})

const updateMemberSchema = createMemberSchema.partial()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    logger.info('Fetching team members', { teamId: id })

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        questProgress: {
          include: {
            quest: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return successResponse({ members })
  } catch (error) {
    logger.error('Failed to fetch team members', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params
    const body = await request.json()
    const validatedData = createMemberSchema.parse(body)

    logger.info('Creating team member', { teamId, email: validatedData.email })

    // Check if team exists
    const team = await prisma.teamSpace.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return successResponse({ error: 'Team not found' }, 404)
    }

    // Check for duplicate email
    const existing = await prisma.teamMember.findUnique({
      where: {
        teamId_email: {
          teamId,
          email: validatedData.email,
        },
      },
    })

    if (existing) {
      return successResponse(
        { error: 'Member with this email already exists in the team' },
        409
      )
    }

    // Create member
    const member = await prisma.teamMember.create({
      data: {
        ...validatedData,
        teamId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      },
    })

    // Emit member joined event
    const event = createEvent<MemberJoinedEvent>(
      DomainEventType.MEMBER_JOINED,
      {
        teamId,
        member: {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role,
        },
      }
    )
    await eventBus.emit(event)

    logger.info('Team member created successfully', { teamId, memberId: member.id })

    return successResponse({ member }, 201)
  } catch (error) {
    logger.error('Failed to create team member', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}
