import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse, handleApiError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const createTemplateSchema = z.object({
  teamId: z.string().cuid().optional(),
  title: z.string().min(1, 'Title is required'),
  descriptionMarkdown: z.string().min(1, 'Description is required'),
  estimatedHours: z.number().int().min(1),
  tagsJson: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().min(1, 'Category is required'),
  isPublic: z.boolean().optional(),
  metadataJson: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const isPublic = searchParams.get('isPublic')

    logger.info('Fetching quest templates', { teamId, category, difficulty })

    const where: any = {}

    if (teamId) {
      where.OR = [{ teamId }, { isPublic: true }]
    } else if (isPublic === 'true') {
      where.isPublic = true
    }

    if (category) {
      where.category = category
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    const templates = await prisma.questTemplate.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            quests: true,
          },
        },
      },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    })

    return successResponse({ templates })
  } catch (error) {
    logger.error('Failed to fetch quest templates', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    logger.info('Creating quest template', {
      teamId: validatedData.teamId,
      title: validatedData.title,
    })

    // If teamId is provided, verify team exists
    if (validatedData.teamId) {
      const team = await prisma.teamSpace.findUnique({
        where: { id: validatedData.teamId },
      })

      if (!team) {
        return successResponse({ error: 'Team not found' }, 404)
      }
    }

    const template = await prisma.questTemplate.create({
      data: validatedData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    logger.info('Quest template created successfully', { templateId: template.id })

    return successResponse({ template }, 201)
  } catch (error) {
    logger.error('Failed to create quest template', error instanceof Error ? error : undefined)
    return handleApiError(error)
  }
}
