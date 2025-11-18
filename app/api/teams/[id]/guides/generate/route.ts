import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RepoAnalyzer } from '@/lib/repo-analyzer'
import { GuideGenerator } from '@/lib/guide-generator'
import { z } from 'zod'

const generateGuideSchema = z.object({
  targetRole: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { targetRole } = generateGuideSchema.parse(body)

    // Fetch team and repos
    const team = await prisma.teamSpace.findUnique({
      where: { id },
      include: { repos: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    if (team.repos.length === 0) {
      return NextResponse.json(
        { error: 'No repositories linked to this team' },
        { status: 400 }
      )
    }

    // Analyze repositories
    const analyzer = new RepoAnalyzer()
    const repoSummaries = await analyzer.analyzeRepos(
      team.repos.map(r => r.githubUrl)
    )

    if (repoSummaries.length === 0) {
      return NextResponse.json(
        { error: 'Failed to analyze repositories' },
        { status: 500 }
      )
    }

    // Generate guide with LLM
    const generator = new GuideGenerator()
    const generatedGuide = await generator.generateGuide(
      repoSummaries,
      targetRole,
      team.name
    )

    // Save to database
    const guide = await prisma.onboardingGuide.create({
      data: {
        teamId: id,
        title: generatedGuide.title,
        targetRole: generatedGuide.targetRole,
        markdownBody: generatedGuide.markdownBody,
        quests: {
          create: generatedGuide.quests.map(quest => ({
            title: quest.title,
            descriptionMarkdown: quest.descriptionMarkdown,
            estimatedHours: quest.estimatedHours,
            tagsJson: JSON.stringify(quest.tags),
          })),
        },
      },
      include: {
        quests: true,
      },
    })

    return NextResponse.json({ guide }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating guide:', error)
    return NextResponse.json(
      { error: 'Failed to generate guide', details: String(error) },
      { status: 500 }
    )
  }
}
