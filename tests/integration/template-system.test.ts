/**
 * Integration tests for quest template system
 *
 * Tests template creation, usage, and tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { generateSlug } from '@/lib/utils'

const prisma = new PrismaClient()

describe('Quest Template System Integration', () => {
  let teamId: string
  let guideId: string
  const createdTemplateIds: string[] = []

  afterEach(async () => {
    // Clean up
    if (guideId) {
      await prisma.quest.deleteMany({ where: { guideId } })
      await prisma.onboardingGuide.delete({ where: { id: guideId } }).catch(() => {})
    }
    if (teamId) {
      await prisma.teamSpace.delete({ where: { id: teamId } }).catch(() => {})
    }
    for (const templateId of createdTemplateIds) {
      await prisma.questTemplate.delete({ where: { id: templateId } }).catch(() => {})
    }
    createdTemplateIds.length = 0
  })

  it('should create and use public quest templates', async () => {
    // Step 1: Create a public template
    const template = await prisma.questTemplate.create({
      data: {
        title: 'Git Basics Workshop',
        descriptionMarkdown: '## Learn Git\n\n1. Clone repository\n2. Create branch\n3. Make commits\n4. Push changes',
        estimatedHours: 3,
        category: 'technical-setup',
        difficulty: 'beginner',
        tags: ['git', 'version-control', 'basics'],
        isPublic: true,
        metadataJson: JSON.stringify({
          prerequisites: ['Basic command line knowledge'],
          learningOutcomes: ['Understand Git workflow', 'Able to use common Git commands'],
        }),
      },
    })
    createdTemplateIds.push(template.id)

    expect(template).toBeDefined()
    expect(template.isPublic).toBe(true)
    expect(template.usageCount).toBe(0)

    // Step 2: Create a team and guide
    const team = await prisma.teamSpace.create({
      data: {
        name: 'Template User Team',
        slug: generateSlug('Template User Team'),
      },
    })
    teamId = team.id

    const guide = await prisma.onboardingGuide.create({
      data: {
        teamId: team.id,
        title: 'Onboarding with Template',
        targetRole: 'junior-developer',
        markdownBody: 'Guide using templates',
        status: 'DRAFT',
      },
    })
    guideId = guide.id

    // Step 3: Create quest from template
    const quest = await prisma.quest.create({
      data: {
        guideId: guide.id,
        templateId: template.id,
        title: template.title,
        descriptionMarkdown: template.descriptionMarkdown,
        estimatedHours: template.estimatedHours,
        orderIndex: 0,
        tags: template.tags,
      },
    })

    expect(quest.templateId).toBe(template.id)
    expect(quest.title).toBe(template.title)

    // Step 4: Increment template usage count
    const updatedTemplate = await prisma.questTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })

    expect(updatedTemplate.usageCount).toBe(1)

    // Step 5: Find all quests created from this template
    const questsFromTemplate = await prisma.quest.findMany({
      where: { templateId: template.id },
      include: {
        guide: {
          include: {
            team: true,
          },
        },
      },
    })

    expect(questsFromTemplate).toHaveLength(1)
    expect(questsFromTemplate[0].guide.team.name).toBe('Template User Team')
  })

  it('should create team-specific private templates', async () => {
    // Create team
    const team = await prisma.teamSpace.create({
      data: {
        name: 'Private Template Team',
        slug: generateSlug('Private Template Team'),
      },
    })
    teamId = team.id

    // Create private template for team
    const privateTemplate = await prisma.questTemplate.create({
      data: {
        teamId: team.id,
        title: 'Internal Security Review',
        descriptionMarkdown: '## Security checklist for our team\n\n- Review auth implementation\n- Check data encryption',
        estimatedHours: 2,
        category: 'team-process',
        difficulty: 'intermediate',
        tags: ['security', 'internal'],
        isPublic: false,
      },
    })
    createdTemplateIds.push(privateTemplate.id)

    expect(privateTemplate.isPublic).toBe(false)
    expect(privateTemplate.teamId).toBe(team.id)

    // Verify template is linked to team
    const teamWithTemplates = await prisma.teamSpace.findUnique({
      where: { id: team.id },
      include: {
        templates: true,
      },
    })

    expect(teamWithTemplates?.templates).toHaveLength(1)
    expect(teamWithTemplates?.templates[0].title).toBe('Internal Security Review')
  })

  it('should track template usage across multiple teams', async () => {
    // Create popular public template
    const popularTemplate = await prisma.questTemplate.create({
      data: {
        title: 'Code Review Best Practices',
        descriptionMarkdown: '## How to review code effectively',
        estimatedHours: 2,
        category: 'soft-skills',
        difficulty: 'intermediate',
        tags: ['code-review', 'collaboration'],
        isPublic: true,
      },
    })
    createdTemplateIds.push(popularTemplate.id)

    // Create two teams
    const team1 = await prisma.teamSpace.create({
      data: { name: 'Team Alpha', slug: 'team-alpha' },
    })
    const team2 = await prisma.teamSpace.create({
      data: { name: 'Team Beta', slug: 'team-beta' },
    })

    // Create guides for both teams
    const guide1 = await prisma.onboardingGuide.create({
      data: {
        teamId: team1.id,
        title: 'Alpha Onboarding',
        targetRole: 'developer',
        markdownBody: 'Content',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    const guide2 = await prisma.onboardingGuide.create({
      data: {
        teamId: team2.id,
        title: 'Beta Onboarding',
        targetRole: 'developer',
        markdownBody: 'Content',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    // Both teams use the same template
    await prisma.quest.create({
      data: {
        guideId: guide1.id,
        templateId: popularTemplate.id,
        title: popularTemplate.title,
        descriptionMarkdown: popularTemplate.descriptionMarkdown,
        estimatedHours: popularTemplate.estimatedHours,
        orderIndex: 0,
      },
    })

    await prisma.quest.create({
      data: {
        guideId: guide2.id,
        templateId: popularTemplate.id,
        title: popularTemplate.title,
        descriptionMarkdown: popularTemplate.descriptionMarkdown,
        estimatedHours: popularTemplate.estimatedHours,
        orderIndex: 0,
      },
    })

    // Update usage count
    await prisma.questTemplate.update({
      where: { id: popularTemplate.id },
      data: { usageCount: { increment: 2 } },
    })

    // Verify usage tracking
    const template = await prisma.questTemplate.findUnique({
      where: { id: popularTemplate.id },
      include: {
        _count: {
          select: { quests: true },
        },
      },
    })

    expect(template?.usageCount).toBe(2)
    expect(template?._count.quests).toBe(2)

    // Find all teams using this template
    const questsFromTemplate = await prisma.quest.findMany({
      where: { templateId: popularTemplate.id },
      include: {
        guide: {
          select: {
            team: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const teamNames = questsFromTemplate.map((q) => q.guide.team.name)
    expect(teamNames).toContain('Team Alpha')
    expect(teamNames).toContain('Team Beta')

    // Cleanup
    await prisma.quest.deleteMany({ where: { guideId: guide1.id } })
    await prisma.quest.deleteMany({ where: { guideId: guide2.id } })
    await prisma.onboardingGuide.delete({ where: { id: guide1.id } })
    await prisma.onboardingGuide.delete({ where: { id: guide2.id } })
    await prisma.teamSpace.delete({ where: { id: team1.id } })
    await prisma.teamSpace.delete({ where: { id: team2.id } })
  })

  it('should filter templates by category and difficulty', async () => {
    // Create templates with different categories and difficulties
    const template1 = await prisma.questTemplate.create({
      data: {
        title: 'Beginner Setup',
        descriptionMarkdown: 'Easy setup guide',
        estimatedHours: 2,
        category: 'technical-setup',
        difficulty: 'beginner',
        tags: ['setup'],
        isPublic: true,
      },
    })
    createdTemplateIds.push(template1.id)

    const template2 = await prisma.questTemplate.create({
      data: {
        title: 'Advanced Architecture',
        descriptionMarkdown: 'Complex architecture patterns',
        estimatedHours: 8,
        category: 'technical-deep-dive',
        difficulty: 'advanced',
        tags: ['architecture'],
        isPublic: true,
      },
    })
    createdTemplateIds.push(template2.id)

    const template3 = await prisma.questTemplate.create({
      data: {
        title: 'Communication Skills',
        descriptionMarkdown: 'Soft skills workshop',
        estimatedHours: 3,
        category: 'soft-skills',
        difficulty: 'beginner',
        tags: ['communication'],
        isPublic: true,
      },
    })
    createdTemplateIds.push(template3.id)

    // Filter by difficulty
    const beginnerTemplates = await prisma.questTemplate.findMany({
      where: {
        difficulty: 'beginner',
        isPublic: true,
      },
    })

    expect(beginnerTemplates).toHaveLength(2)
    expect(beginnerTemplates.map((t) => t.title)).toContain('Beginner Setup')
    expect(beginnerTemplates.map((t) => t.title)).toContain('Communication Skills')

    // Filter by category
    const technicalTemplates = await prisma.questTemplate.findMany({
      where: {
        category: { startsWith: 'technical' },
        isPublic: true,
      },
    })

    expect(technicalTemplates).toHaveLength(2)

    // Filter by both category and difficulty
    const beginnerTechnical = await prisma.questTemplate.findMany({
      where: {
        category: 'technical-setup',
        difficulty: 'beginner',
        isPublic: true,
      },
    })

    expect(beginnerTechnical).toHaveLength(1)
    expect(beginnerTechnical[0].title).toBe('Beginner Setup')
  })

  it('should support template versioning through metadata', async () => {
    // Create template with version metadata
    const template = await prisma.questTemplate.create({
      data: {
        title: 'Docker Setup',
        descriptionMarkdown: '## Docker Installation\n\nInstall Docker Desktop',
        estimatedHours: 2,
        category: 'technical-setup',
        difficulty: 'beginner',
        tags: ['docker', 'containers'],
        isPublic: true,
        metadataJson: JSON.stringify({
          version: '2.0',
          changelog: [
            { version: '2.0', date: '2024-01-15', changes: 'Updated for Docker Desktop 4.0' },
            { version: '1.0', date: '2023-06-01', changes: 'Initial version' },
          ],
          targetDockerVersion: '>=4.0',
        }),
      },
    })
    createdTemplateIds.push(template.id)

    // Retrieve and parse metadata
    const retrievedTemplate = await prisma.questTemplate.findUnique({
      where: { id: template.id },
    })

    expect(retrievedTemplate).toBeDefined()
    const metadata = JSON.parse(retrievedTemplate!.metadataJson || '{}')

    expect(metadata.version).toBe('2.0')
    expect(metadata.changelog).toHaveLength(2)
    expect(metadata.targetDockerVersion).toBe('>=4.0')
  })
})
