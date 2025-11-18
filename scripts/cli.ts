#!/usr/bin/env tsx

/**
 * Developer Onboarding Guide Builder CLI
 *
 * Command-line tool for managing the onboarding system
 */

import { PrismaClient } from '@prisma/client'
import { program } from 'commander'

const prisma = new PrismaClient()

// Stats command
program
  .command('stats')
  .description('Show database statistics')
  .action(async () => {
    try {
      const [teams, members, guides, quests, templates, progress] = await Promise.all([
        prisma.teamSpace.count(),
        prisma.teamMember.count(),
        prisma.onboardingGuide.count(),
        prisma.quest.count(),
        prisma.questTemplate.count(),
        prisma.questProgress.count(),
      ])

      console.log('\n📊 Database Statistics\n')
      console.log(`Teams:           ${teams}`)
      console.log(`Members:         ${members}`)
      console.log(`Guides:          ${guides}`)
      console.log(`Quests:          ${quests}`)
      console.log(`Templates:       ${templates}`)
      console.log(`Progress Items:  ${progress}\n`)
    } catch (error) {
      console.error('Error fetching stats:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

// List teams command
program
  .command('teams:list')
  .description('List all teams')
  .action(async () => {
    try {
      const teams = await prisma.teamSpace.findMany({
        include: {
          _count: {
            select: {
              repos: true,
              guides: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      console.log('\n📋 Teams\n')
      teams.forEach((team) => {
        console.log(`${team.name} (${team.slug})`)
        console.log(`  ID: ${team.id}`)
        console.log(
          `  ${team._count.repos} repos, ${team._count.guides} guides, ${team._count.members} members`
        )
        console.log()
      })
    } catch (error) {
      console.error('Error listing teams:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

// Progress report command
program
  .command('progress:report')
  .description('Show onboarding progress summary')
  .option('-t, --team <teamId>', 'Filter by team ID')
  .action(async (options) => {
    try {
      const where = options.team ? { quest: { guide: { teamId: options.team } } } : {}

      const progress = await prisma.questProgress.findMany({
        where,
        include: {
          member: {
            select: {
              name: true,
              email: true,
            },
          },
          quest: {
            select: {
              title: true,
              guide: {
                select: {
                  title: true,
                  team: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      const statusCounts = {
        NOT_STARTED: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        BLOCKED: 0,
        SKIPPED: 0,
      }

      progress.forEach((p) => {
        statusCounts[p.status]++
      })

      console.log('\n📈 Onboarding Progress Report\n')
      console.log(`Total Progress Items: ${progress.length}`)
      console.log(`Not Started:   ${statusCounts.NOT_STARTED}`)
      console.log(`In Progress:   ${statusCounts.IN_PROGRESS}`)
      console.log(`Completed:     ${statusCounts.COMPLETED}`)
      console.log(`Blocked:       ${statusCounts.BLOCKED}`)
      console.log(`Skipped:       ${statusCounts.SKIPPED}`)

      const completionRate =
        progress.length > 0
          ? ((statusCounts.COMPLETED / progress.length) * 100).toFixed(1)
          : 0

      console.log(`\nCompletion Rate: ${completionRate}%\n`)
    } catch (error) {
      console.error('Error generating report:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

// Create team command
program
  .command('teams:create')
  .description('Create a new team')
  .requiredOption('-n, --name <name>', 'Team name')
  .option('-d, --description <description>', 'Team description')
  .action(async (options) => {
    try {
      const slug = options.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      const team = await prisma.teamSpace.create({
        data: {
          name: options.name,
          description: options.description,
          slug,
        },
      })

      console.log('\n✅ Team created successfully\n')
      console.log(`ID:   ${team.id}`)
      console.log(`Name: ${team.name}`)
      console.log(`Slug: ${team.slug}\n`)
    } catch (error) {
      console.error('Error creating team:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

// Create member command
program
  .command('members:create')
  .description('Add a member to a team')
  .requiredOption('-t, --team <teamId>', 'Team ID')
  .requiredOption('-e, --email <email>', 'Member email')
  .requiredOption('-n, --name <name>', 'Member name')
  .option('-r, --role <role>', 'Member role (OWNER, ADMIN, MEMBER, VIEWER)', 'MEMBER')
  .action(async (options) => {
    try {
      const member = await prisma.teamMember.create({
        data: {
          teamId: options.team,
          email: options.email,
          name: options.name,
          role: options.role,
        },
      })

      console.log('\n✅ Member added successfully\n')
      console.log(`ID:    ${member.id}`)
      console.log(`Name:  ${member.name}`)
      console.log(`Email: ${member.email}`)
      console.log(`Role:  ${member.role}\n`)
    } catch (error) {
      console.error('Error adding member:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

// Clean stale data command
program
  .command('clean:stale')
  .description('Clean up stale or old data')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .action(async (options) => {
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      // Find archived guides older than 6 months
      const staleGuides = await prisma.onboardingGuide.findMany({
        where: {
          status: 'ARCHIVED',
          archivedAt: {
            lt: sixMonthsAgo,
          },
        },
      })

      console.log(`\n🗑️  Found ${staleGuides.length} stale archived guides\n`)

      if (staleGuides.length > 0 && !options.dryRun) {
        for (const guide of staleGuides) {
          await prisma.onboardingGuide.delete({
            where: { id: guide.id },
          })
          console.log(`Deleted: ${guide.title}`)
        }
        console.log('\n✅ Cleanup completed\n')
      } else if (options.dryRun) {
        staleGuides.forEach((guide) => {
          console.log(`Would delete: ${guide.title}`)
        })
        console.log('\n(Dry run - no changes made)\n')
      }
    } catch (error) {
      console.error('Error cleaning stale data:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

// Completion analytics command
program
  .command('analytics:completion')
  .description('Show quest completion analytics')
  .option('-t, --team <teamId>', 'Filter by team ID')
  .action(async (options) => {
    try {
      const where = options.team ? { quest: { guide: { teamId: options.team } } } : {}

      const completed = await prisma.questProgress.findMany({
        where: {
          ...where,
          status: 'COMPLETED',
        },
        include: {
          quest: {
            select: {
              estimatedHours: true,
            },
          },
        },
      })

      if (completed.length === 0) {
        console.log('\nNo completed quests found\n')
        return
      }

      const totalTimeSpent = completed.reduce((sum, p) => sum + p.timeSpentMinutes, 0)
      const totalEstimated = completed.reduce((sum, p) => sum + p.quest.estimatedHours * 60, 0)
      const avgRating =
        completed
          .filter((p) => p.feedbackRating)
          .reduce((sum, p) => sum + (p.feedbackRating || 0), 0) /
          completed.filter((p) => p.feedbackRating).length || 0

      console.log('\n📊 Quest Completion Analytics\n')
      console.log(`Total Completed Quests: ${completed.length}`)
      console.log(`Total Time Spent: ${Math.round(totalTimeSpent / 60)} hours`)
      console.log(`Total Estimated: ${Math.round(totalEstimated / 60)} hours`)
      console.log(`Efficiency: ${((totalEstimated / totalTimeSpent) * 100).toFixed(1)}%`)
      console.log(`Average Rating: ${avgRating.toFixed(1)} / 5.0`)
      console.log(`Feedback Count: ${completed.filter((p) => p.feedbackRating).length}\n`)
    } catch (error) {
      console.error('Error generating analytics:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  })

program.parse()
