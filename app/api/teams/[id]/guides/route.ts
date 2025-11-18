import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guides = await prisma.onboardingGuide.findMany({
      where: { teamId: id },
      include: {
        quests: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ guides })
  } catch (error) {
    console.error('Error fetching guides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guides' },
      { status: 500 }
    )
  }
}
