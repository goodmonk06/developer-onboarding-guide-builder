import { PrismaClient } from '@prisma/client'
import { generateSlug } from '../lib/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Phase 3 database seed...')

  // Clean existing data
  console.log('Cleaning existing data...')
  await prisma.notification.deleteMany()
  await prisma.questProgress.deleteMany()
  await prisma.quest.deleteMany()
  await prisma.questTemplate.deleteMany()
  await prisma.guideVersion.deleteMany()
  await prisma.onboardingGuide.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.repoLink.deleteMany()
  await prisma.teamSpace.deleteMany()

  // Create Quest Templates (Public Templates)
  console.log('Creating quest templates...')
  const setupTemplate = await prisma.questTemplate.create({
    data: {
      title: 'Environment Setup',
      descriptionMarkdown: `## Objective
Set up your complete development environment

## Steps
1. Install required tools (Node.js, Docker, Git)
2. Clone all team repositories
3. Configure environment variables
4. Run local services
5. Verify everything works

## Success Criteria
- [ ] All tools installed
- [ ] Services running locally
- [ ] Tests passing`,
      estimatedHours: 4,
      tagsJson: JSON.stringify(['setup', 'environment', 'onboarding']),
      difficulty: 'beginner',
      category: 'setup',
      isPublic: true,
      usageCount: 15,
    },
  })

  const testingTemplate = await prisma.questTemplate.create({
    data: {
      title: 'Write Your First Test',
      descriptionMarkdown: `## Objective
Learn testing practices and write your first test

## Steps
1. Review testing documentation
2. Understand test structure
3. Write a simple unit test
4. Run test suite locally
5. Submit for code review

## Success Criteria
- [ ] Test written and passing
- [ ] Follows team conventions
- [ ] Code reviewed and approved`,
      estimatedHours: 3,
      tagsJson: JSON.stringify(['testing', 'quality', 'tdd']),
      difficulty: 'beginner',
      category: 'testing',
      isPublic: true,
      usageCount: 22,
    },
  })

  const deploymentTemplate = await prisma.questTemplate.create({
    data: {
      title: 'Deploy to Staging',
      descriptionMarkdown: `## Objective
Learn the deployment process and deploy your first change

## Steps
1. Review CI/CD pipeline documentation
2. Create a small change
3. Push to feature branch
4. Monitor CI pipeline
5. Deploy to staging
6. Verify deployment

## Success Criteria
- [ ] Change deployed successfully
- [ ] No errors in staging
- [ ] Can access and verify change`,
      estimatedHours: 2,
      tagsJson: JSON.stringify(['deployment', 'devops', 'ci-cd']),
      difficulty: 'intermediate',
      category: 'deployment',
      isPublic: true,
      usageCount: 18,
    },
  })

  // Create Shift Scheduler Team
  console.log('Creating Shift Scheduler Team...')
  const shiftTeam = await prisma.teamSpace.create({
    data: {
      name: 'Shift Scheduler Team',
      slug: generateSlug('Shift Scheduler Team'),
      description: 'Healthcare shift scheduling platform with microservices architecture',
      repos: {
        create: [
          {
            githubUrl: 'https://github.com/vercel/next.js',
            role: 'frontend',
            isActive: true,
          },
          {
            githubUrl: 'https://github.com/prisma/prisma',
            role: 'backend',
            isActive: true,
          },
          {
            githubUrl: 'https://github.com/openai/openai-node',
            role: 'api',
            isActive: true,
          },
        ],
      },
    },
  })

  // Create Team Members
  console.log('Creating team members...')
  const alice = await prisma.teamMember.create({
    data: {
      teamId: shiftTeam.id,
      email: 'alice@example.com',
      name: 'Alice Johnson',
      role: 'OWNER',
      status: 'ACTIVE',
      title: 'Engineering Manager',
      startDate: new Date('2022-01-15'),
    },
  })

  const bob = await prisma.teamMember.create({
    data: {
      teamId: shiftTeam.id,
      email: 'bob@example.com',
      name: 'Bob Smith',
      role: 'ADMIN',
      status: 'ACTIVE',
      title: 'Senior Software Engineer',
      startDate: new Date('2022-06-01'),
    },
  })

  const carol = await prisma.teamMember.create({
    data: {
      teamId: shiftTeam.id,
      email: 'carol@example.com',
      name: 'Carol Martinez',
      role: 'MEMBER',
      status: 'ACTIVE',
      title: 'Software Engineer',
      startDate: new Date('2024-01-10'),
    },
  })

  const david = await prisma.teamMember.create({
    data: {
      teamId: shiftTeam.id,
      email: 'david@example.com',
      name: 'David Lee',
      role: 'MEMBER',
      status: 'ACTIVE',
      title: 'Junior Software Engineer',
      startDate: new Date('2024-11-01'),
    },
  })

  // Create Onboarding Guide with PUBLISHED status
  console.log('Creating onboarding guide...')
  const guide = await prisma.onboardingGuide.create({
    data: {
      teamId: shiftTeam.id,
      title: 'Junior Developer Onboarding - Shift Scheduler Team',
      targetRole: 'junior',
      status: 'PUBLISHED',
      publishedAt: new Date('2024-10-01'),
      estimatedDays: 14,
      markdownBody: `# Welcome to the Shift Scheduler Team!

This guide will help you get up to speed with our healthcare shift scheduling platform over the next 2 weeks.

## Week 1: Foundation & Setup

### Days 1-2: Environment Setup
- Install required tools (Node.js 18+, Docker, PostgreSQL)
- Clone all team repositories
- Set up local development environment
- Run the application locally
- Verify all services are working

### Days 3-4: Understanding the Domain
- Read the shift scheduling domain documentation
- Understand key concepts: Shifts, Schedules, Healthcare Workers, Facilities
- Review the database schema
- Explore the API endpoints

### Day 5: Architecture Overview
- Understand the microservices architecture
- Learn about the frontend (Next.js)
- Learn about the backend services (Node.js + Prisma)
- Review the deployment pipeline

## Week 2: Hands-On Development

### Days 1-2: First Bug Fix
- Pick a "good first issue" from GitHub
- Set up your feature branch
- Write tests for your fix
- Submit your first pull request
- Go through code review process

### Days 3-4: Small Feature Implementation
- Implement a small feature in the frontend
- Add corresponding API changes
- Write comprehensive tests
- Update documentation

### Day 5: Team Integration & Review
- Present your work to the team
- Participate in sprint planning
- Set up your ongoing development workflow
- Plan next steps with your mentor

## Resources

- [Team Wiki](https://example.com/wiki)
- [API Documentation](https://example.com/api-docs)
- [Code Style Guide](https://example.com/style-guide)
- [Deployment Guide](https://example.com/deployment)

## Questions?

Don't hesitate to reach out to your mentor or the team on Slack!
`,
    },
  })

  // Create Quests
  console.log('Creating quests...')
  const quest1 = await prisma.quest.create({
    data: {
      guideId: guide.id,
      templateId: setupTemplate.id,
      title: 'Set Up Your Development Environment',
      order: 1,
      difficulty: 'beginner',
      descriptionMarkdown: `## Objective
Get your local development environment fully configured and running.

## Steps

1. **Install Prerequisites**
   - Node.js 18+ and npm
   - Docker Desktop
   - PostgreSQL 15+
   - Git
   - Your favorite code editor (VS Code recommended)

2. **Clone Repositories**
   \`\`\`bash
   git clone https://github.com/your-org/shift-scheduler-frontend
   git clone https://github.com/your-org/shift-scheduler-backend
   git clone https://github.com/your-org/shift-scheduler-docs
   \`\`\`

3. **Environment Configuration**
   - Copy \`.env.example\` to \`.env\` in each repository
   - Fill in the required environment variables
   - Ask your mentor for API keys and credentials

4. **Start Services**
   \`\`\`bash
   docker compose up -d  # Start PostgreSQL
   npm install           # Install dependencies
   npm run db:migrate    # Run migrations
   npm run db:seed       # Seed test data
   npm run dev           # Start dev server
   \`\`\`

5. **Verify Setup**
   - Visit http://localhost:3000
   - Log in with demo credentials (user@example.com / demo123)
   - Create a test shift
   - Verify the shift appears in the database

## Success Criteria

- [ ] All repositories cloned
- [ ] Development server running
- [ ] Can log in to the application
- [ ] Can create and view a shift
- [ ] Database connection working
- [ ] All tests passing (\`npm test\`)

## Resources

- [Development Environment Setup Guide](https://example.com/setup)
- [Troubleshooting Common Issues](https://example.com/troubleshooting)
`,
      estimatedHours: 4,
      tagsJson: JSON.stringify(['setup', 'environment', 'docker', 'onboarding']),
      resourcesJson: JSON.stringify([
        { title: 'Node.js Installation', url: 'https://nodejs.org' },
        { title: 'Docker Desktop', url: 'https://docker.com' },
      ]),
    },
  })

  const quest2 = await prisma.quest.create({
    data: {
      guideId: guide.id,
      title: 'Understand the Shift Model',
      order: 2,
      difficulty: 'beginner',
      prerequisitesJson: JSON.stringify([quest1.id]),
      descriptionMarkdown: `## Objective
Gain a deep understanding of the core Shift domain model and how it works in our system.

## Steps

1. **Read Documentation**
   - Review the Shift Model documentation in the wiki
   - Understand the relationship between Shifts, Workers, and Facilities
   - Learn about shift status lifecycle

2. **Explore the Code**
   - Open \`prisma/schema.prisma\` and study the Shift model
   - Find the Shift service in \`lib/services/shift-service.ts\`
   - Review the Shift API endpoints in \`app/api/shifts/\`

3. **Database Exploration**
   - Open Prisma Studio: \`npm run db:studio\`
   - Examine existing shift records
   - Understand the relationships between tables

4. **Write a Test**
   Create a test file \`lib/services/shift-service.test.ts\`:
   \`\`\`typescript
   import { describe, it, expect } from 'vitest'
   import { createShift } from './shift-service'

   describe('Shift Service', () => {
     it('should create a valid shift', async () => {
       const shift = await createShift({
         workerId: 'worker-1',
         facilityId: 'facility-1',
         startTime: new Date('2024-12-01T08:00:00'),
         endTime: new Date('2024-12-01T16:00:00'),
       })

       expect(shift).toBeDefined()
       expect(shift.status).toBe('scheduled')
     })
   })
   \`\`\`

5. **Document Your Understanding**
   Write a brief summary (1-2 paragraphs) explaining:
   - What a Shift represents
   - Key attributes and their purpose
   - Common operations (create, update, cancel)

## Success Criteria

- [ ] Can explain the Shift model to a team member
- [ ] Understand shift status lifecycle
- [ ] Written test passes
- [ ] Created documentation summary
- [ ] Explored shifts in Prisma Studio

## Resources

- [Domain Model Documentation](https://example.com/domain-model)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference)
`,
      estimatedHours: 3,
      tagsJson: JSON.stringify(['domain', 'backend', 'database', 'learning']),
    },
  })

  const quest3 = await prisma.quest.create({
    data: {
      guideId: guide.id,
      templateId: testingTemplate.id,
      title: 'Fix Your First Bug',
      order: 3,
      difficulty: 'intermediate',
      prerequisitesJson: JSON.stringify([quest1.id, quest2.id]),
      descriptionMarkdown: `## Objective
Find, fix, and submit a pull request for a real bug in the codebase.

## Steps

1. **Find a Bug**
   - Browse GitHub issues labeled "good first issue"
   - Pick one that interests you
   - Comment on the issue to claim it
   - Ask questions if anything is unclear

2. **Create a Feature Branch**
   \`\`\`bash
   git checkout -b fix/issue-123-shift-validation
   \`\`\`

3. **Reproduce the Bug**
   - Follow the steps in the issue to reproduce
   - Verify you can see the problem locally
   - Add a failing test that demonstrates the bug

4. **Implement the Fix**
   - Write the minimal code needed to fix the issue
   - Ensure your test now passes
   - Run the full test suite: \`npm test\`
   - Verify the fix manually in the UI

5. **Code Quality**
   - Run linter: \`npm run lint\`
   - Run type checker: \`npm run type-check\`
   - Write clear commit messages
   - Update any relevant documentation

6. **Submit Pull Request**
   - Push your branch: \`git push origin fix/issue-123-shift-validation\`
   - Create PR on GitHub
   - Fill out the PR template completely
   - Link to the original issue
   - Request review from your mentor

7. **Code Review**
   - Respond to feedback promptly
   - Make requested changes
   - Ask questions if you don't understand suggestions
   - Get approval and merge!

## Success Criteria

- [ ] Bug reproduced locally
- [ ] Failing test written
- [ ] Fix implemented
- [ ] All tests passing
- [ ] Lint and type-check passing
- [ ] PR submitted
- [ ] Code review completed
- [ ] PR merged

## Tips

- Start small - don't try to fix the hardest issue
- Ask for help if you're stuck for more than 30 minutes
- Write tests first (Test-Driven Development)
- Keep your PR focused on just the fix

## Resources

- [Contributing Guidelines](https://example.com/contributing)
- [Git Workflow](https://example.com/git-workflow)
- [Code Review Guide](https://example.com/code-review)
`,
      estimatedHours: 6,
      tagsJson: JSON.stringify(['bug-fix', 'git', 'testing', 'code-review']),
    },
  })

  const quest4 = await prisma.quest.create({
    data: {
      guideId: guide.id,
      title: 'Add a Small Feature to the UI',
      order: 4,
      difficulty: 'intermediate',
      descriptionMarkdown: `## Objective
Implement a small but complete feature in the frontend application.

## Feature: Shift Duration Display

Add a feature to display the shift duration (in hours) on shift cards.

## Steps

1. **Plan the Implementation**
   - Identify where shift cards are rendered
   - Determine where to calculate duration
   - Decide on the UI placement

2. **Create Utility Function**
   Create \`lib/utils/shift-utils.ts\`:
   \`\`\`typescript
   export function calculateShiftDuration(
     startTime: Date,
     endTime: Date
   ): number {
     const ms = endTime.getTime() - startTime.getTime()
     return ms / (1000 * 60 * 60) // Convert to hours
   }
   \`\`\`

3. **Write Tests**
   Create \`lib/utils/shift-utils.test.ts\`:
   \`\`\`typescript
   import { describe, it, expect } from 'vitest'
   import { calculateShiftDuration } from './shift-utils'

   describe('calculateShiftDuration', () => {
     it('calculates 8-hour shift correctly', () => {
       const start = new Date('2024-12-01T08:00:00')
       const end = new Date('2024-12-01T16:00:00')
       expect(calculateShiftDuration(start, end)).toBe(8)
     })
   })
   \`\`\`

4. **Update UI Component**
   Add duration display to the shift card component

5. **Manual Testing**
   - View shifts in the UI
   - Verify duration displays correctly
   - Test with various shift lengths
   - Check edge cases (overnight shifts)

6. **Submit for Review**
   - Create PR with clear description
   - Include screenshots
   - Link to design discussion (if any)

## Success Criteria

- [ ] Utility function created and tested
- [ ] UI component updated
- [ ] Tests passing
- [ ] Manual testing completed
- [ ] PR submitted and reviewed
- [ ] Feature merged to main

## Resources

- [UI Component Library](https://example.com/components)
- [Testing Frontend Code](https://example.com/frontend-testing)
`,
      estimatedHours: 5,
      tagsJson: JSON.stringify(['frontend', 'feature', 'ui', 'testing']),
    },
  })

  const quest5 = await prisma.quest.create({
    data: {
      guideId: guide.id,
      templateId: deploymentTemplate.id,
      title: 'Learn the Deployment Process',
      order: 5,
      difficulty: 'intermediate',
      descriptionMarkdown: `## Objective
Understand how code gets from your machine to production.

## Steps

1. **Review CI/CD Pipeline**
   - Examine \`.github/workflows/\` directory
   - Understand what happens on each push
   - Learn about the different environments (dev, staging, prod)

2. **Deploy to Staging**
   - Create a small, safe change (e.g., update README)
   - Push to a feature branch
   - Watch the CI pipeline run
   - Verify deployment to staging environment

3. **Monitoring and Rollback**
   - Access monitoring dashboard
   - View application logs
   - Learn about rollback procedures
   - Understand health check endpoints

4. **Document Your Learning**
   Create a personal reference document covering:
   - How to deploy to each environment
   - How to check if deployment succeeded
   - How to view logs
   - Who to contact if something goes wrong

## Success Criteria

- [ ] Understand CI/CD pipeline
- [ ] Successfully deployed to staging
- [ ] Can access monitoring tools
- [ ] Know rollback procedure
- [ ] Created reference documentation

## Resources

- [Deployment Guide](https://example.com/deployment)
- [Monitoring Dashboard](https://example.com/monitoring)
- [Incident Response Guide](https://example.com/incidents)
`,
      estimatedHours: 3,
      tagsJson: JSON.stringify(['devops', 'deployment', 'ci-cd', 'monitoring']),
    },
  })

  // Create Quest Progress for David (new joiner)
  console.log('Creating quest progress...')
  await prisma.questProgress.create({
    data: {
      questId: quest1.id,
      memberId: david.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-11-01T09:00:00'),
      completedAt: new Date('2024-11-01T15:30:00'),
      timeSpentMinutes: 390,
      feedbackRating: 5,
      feedbackText: 'Great quest! Clear instructions and helpful resources.',
      notes: 'Had some issues with Docker but mentor helped quickly.',
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest2.id,
      memberId: david.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-11-02T09:00:00'),
      completedAt: new Date('2024-11-02T12:00:00'),
      timeSpentMinutes: 180,
      feedbackRating: 4,
      feedbackText: 'Good documentation, test example was helpful.',
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest3.id,
      memberId: david.id,
      status: 'IN_PROGRESS',
      startedAt: new Date('2024-11-04T10:00:00'),
      timeSpentMinutes: 240,
      notes: 'Working on fixing a validation bug in the shift creation form.',
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest4.id,
      memberId: david.id,
      status: 'NOT_STARTED',
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest5.id,
      memberId: david.id,
      status: 'NOT_STARTED',
    },
  })

  // Create Progress for Carol (who's further along)
  await prisma.questProgress.create({
    data: {
      questId: quest1.id,
      memberId: carol.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-01-10T09:00:00'),
      completedAt: new Date('2024-01-10T14:00:00'),
      timeSpentMinutes: 300,
      feedbackRating: 5,
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest2.id,
      memberId: carol.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-01-11T09:00:00'),
      completedAt: new Date('2024-01-11T11:30:00'),
      timeSpentMinutes: 150,
      feedbackRating: 4,
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest3.id,
      memberId: carol.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-01-12T09:00:00'),
      completedAt: new Date('2024-01-15T16:00:00'),
      timeSpentMinutes: 480,
      feedbackRating: 5,
      feedbackText: 'Learned a lot from this! Code review was very educational.',
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest4.id,
      memberId: carol.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-01-16T09:00:00'),
      completedAt: new Date('2024-01-18T15:00:00'),
      timeSpentMinutes: 420,
      feedbackRating: 4,
    },
  })

  await prisma.questProgress.create({
    data: {
      questId: quest5.id,
      memberId: carol.id,
      status: 'COMPLETED',
      startedAt: new Date('2024-01-19T10:00:00'),
      completedAt: new Date('2024-01-19T14:00:00'),
      timeSpentMinutes: 240,
      feedbackRating: 5,
    },
  })

  // Create Notifications
  console.log('Creating notifications...')
  await prisma.notification.create({
    data: {
      teamId: shiftTeam.id,
      recipientId: david.id,
      senderId: alice.id,
      type: 'MEMBER_JOINED',
      priority: 'MEDIUM',
      title: 'Welcome to the Team!',
      message: 'Welcome to the Shift Scheduler Team, David! We\'re excited to have you here. Your onboarding guide is ready.',
      linkUrl: `/guides/${guide.id}`,
      isRead: true,
      readAt: new Date('2024-11-01T09:05:00'),
    },
  })

  await prisma.notification.create({
    data: {
      teamId: shiftTeam.id,
      recipientId: david.id,
      senderId: bob.id,
      type: 'QUEST_COMPLETED',
      priority: 'LOW',
      title: 'Quest Completed: Set Up Your Development Environment',
      message: 'Congratulations! You\'ve completed your first quest. Time to move on to understanding the shift model.',
      linkUrl: `/quests/${quest2.id}`,
      isRead: true,
      readAt: new Date('2024-11-01T15:35:00'),
    },
  })

  await prisma.notification.create({
    data: {
      teamId: shiftTeam.id,
      recipientId: david.id,
      type: 'QUEST_ASSIGNED',
      priority: 'MEDIUM',
      title: 'New Quest Available: Fix Your First Bug',
      message: 'You\'ve been assigned a new quest. Ready to fix your first bug?',
      linkUrl: `/quests/${quest3.id}`,
      isRead: false,
    },
  })

  await prisma.notification.create({
    data: {
      teamId: shiftTeam.id,
      recipientId: alice.id,
      type: 'SYSTEM_ALERT',
      priority: 'HIGH',
      title: 'New Team Member Onboarding Started',
      message: 'David Lee has started their onboarding journey. Consider checking in after their first week.',
      linkUrl: `/members/${david.id}`,
      isRead: true,
      readAt: new Date('2024-11-01T10:00:00'),
    },
  })

  // Create E-commerce Team
  console.log('\nCreating E-commerce Platform Team...')
  const ecomTeam = await prisma.teamSpace.create({
    data: {
      name: 'E-commerce Platform Team',
      slug: generateSlug('E-commerce Platform Team'),
      description: 'Modern e-commerce platform with inventory and order management',
      repos: {
        create: [
          {
            githubUrl: 'https://github.com/facebook/react',
            role: 'frontend',
            isActive: true,
          },
          {
            githubUrl: 'https://github.com/nestjs/nest',
            role: 'backend',
            isActive: true,
          },
        ],
      },
    },
  })

  // Add a member to E-commerce team
  const emma = await prisma.teamMember.create({
    data: {
      teamId: ecomTeam.id,
      email: 'emma@example.com',
      name: 'Emma Wilson',
      role: 'OWNER',
      status: 'ACTIVE',
      title: 'Tech Lead',
      startDate: new Date('2023-03-01'),
    },
  })

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Phase 3 Seed completed successfully!')
  console.log('='.repeat(50))

  const [teams, members, guides, quests, templates, progress, notifications] = await Promise.all([
    prisma.teamSpace.count(),
    prisma.teamMember.count(),
    prisma.onboardingGuide.count(),
    prisma.quest.count(),
    prisma.questTemplate.count(),
    prisma.questProgress.count(),
    prisma.notification.count(),
  ])

  console.log('\nCreated:')
  console.log(`  - ${teams} teams`)
  console.log(`  - ${members} team members`)
  console.log(`  - ${await prisma.repoLink.count()} repositories`)
  console.log(`  - ${guides} onboarding guides`)
  console.log(`  - ${quests} quests`)
  console.log(`  - ${templates} quest templates`)
  console.log(`  - ${progress} progress records`)
  console.log(`  - ${notifications} notifications`)

  console.log('\n📚 Teams:')
  console.log('  1. Shift Scheduler Team')
  console.log('     - 4 members (Alice, Bob, Carol, David)')
  console.log('     - 1 complete onboarding guide with 5 quests')
  console.log('     - Progress tracking for 2 members')
  console.log('     - 4 notifications')
  console.log('  2. E-commerce Platform Team')
  console.log('     - 1 member (Emma)')

  console.log('\n✨ Quest Templates:')
  console.log('  - Environment Setup (beginner, 15 uses)')
  console.log('  - Write Your First Test (beginner, 22 uses)')
  console.log('  - Deploy to Staging (intermediate, 18 uses)')

  console.log('\n👤 Demo Accounts:')
  console.log('  - alice@example.com (Owner, Engineering Manager)')
  console.log('  - bob@example.com (Admin, Senior Engineer)')
  console.log('  - carol@example.com (Member, completed all quests)')
  console.log('  - david@example.com (Member, actively onboarding)')
  console.log('  - emma@example.com (Owner of E-commerce team)')

  console.log('\n🎯 Try These Features:')
  console.log('  1. View teams: /teams')
  console.log('  2. View David\'s progress: /members/{david-id}')
  console.log('  3. View the onboarding guide: /guides/{guide-id}')
  console.log('  4. Explore quest templates: /templates')
  console.log('  5. Run CLI: npm run cli stats')
  console.log('  6. Run CLI: npm run cli progress:report')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
