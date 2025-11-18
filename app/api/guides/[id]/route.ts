import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guide = await prisma.onboardingGuide.findUnique({
      where: { id },
      include: {
        quests: true,
        team: true,
      },
    })

    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ guide })
  } catch (error) {
    console.error('Error fetching guide:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guide' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.onboardingGuide.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guide:', error)
    return NextResponse.json(
      { error: 'Failed to delete guide' },
      { status: 500 }
    )
  }
}
