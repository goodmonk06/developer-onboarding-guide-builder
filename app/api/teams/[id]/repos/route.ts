import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRepoSchema = z.object({
  githubUrl: z.string().url(),
  role: z.string().min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repos = await prisma.repoLink.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ repos })
  } catch (error) {
    console.error('Error fetching repos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = createRepoSchema.parse(body)

    const repo = await prisma.repoLink.create({
      data: {
        ...validatedData,
        teamId: id,
      },
    })

    return NextResponse.json({ repo }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating repo:', error)
    return NextResponse.json(
      { error: 'Failed to create repo' },
      { status: 500 }
    )
  }
}
