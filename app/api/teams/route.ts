import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse, handleApiError } from '@/lib/api-response'

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const teams = await prisma.teamSpace.findMany({
      include: {
        repos: true,
        guides: {
          include: {
            quests: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({ teams })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)

    const team = await prisma.teamSpace.create({
      data: validatedData,
      include: {
        repos: true,
        guides: true,
      },
    })

    return successResponse({ team }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
