import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data
  console.log('Cleaning existing data...')
  await prisma.quest.deleteMany()
  await prisma.onboardingGuide.deleteMany()
  await prisma.repoLink.deleteMany()
  await prisma.teamSpace.deleteMany()

  // Create Shift Scheduler Team
  console.log('Creating Shift Scheduler Team...')
  const shiftTeam = await prisma.teamSpace.create({
    data: {
      name: 'Shift Scheduler Team',
      description: 'Healthcare shift scheduling platform with microservices architecture',
      repos: {
        create: [
          {
            githubUrl: 'https://github.com/vercel/next.js',
            role: 'frontend',
          },
          {
            githubUrl: 'https://github.com/prisma/prisma',
            role: 'backend',
          },
          {
            githubUrl: 'https://github.com/openai/openai-node',
            role: 'api',
          },
        ],
      },
    },
  })

  // Create a sample onboarding guide for Junior Developer
  console.log('Creating sample onboarding guide...')
  const guide = await prisma.onboardingGuide.create({
    data: {
      teamId: shiftTeam.id,
      title: 'Junior Developer Onboarding - Shift Scheduler Team',
      targetRole: 'junior',
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
      quests: {
        create: [
          {
            title: 'Set Up Your Development Environment',
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
          },
          {
            title: 'Understand the Shift Model',
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
          {
            title: 'Fix Your First Bug',
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
          {
            title: 'Add a Small Feature to the UI',
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
          {
            title: 'Learn the Deployment Process',
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
        ],
      },
    },
    include: {
      quests: true,
    },
  })

  console.log(`✅ Created guide: ${guide.title}`)
  console.log(`   with ${guide.quests.length} quests`)

  // Create E-commerce Team (second example)
  console.log('\nCreating E-commerce Platform Team...')
  const ecomTeam = await prisma.teamSpace.create({
    data: {
      name: 'E-commerce Platform Team',
      description: 'Modern e-commerce platform with inventory and order management',
      repos: {
        create: [
          {
            githubUrl: 'https://github.com/facebook/react',
            role: 'frontend',
          },
          {
            githubUrl: 'https://github.com/nestjs/nest',
            role: 'backend',
          },
        ],
      },
    },
  })

  console.log(`✅ Created team: ${ecomTeam.name}`)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Seed completed successfully!')
  console.log('='.repeat(50))
  console.log('\nCreated:')
  console.log(`  - ${await prisma.teamSpace.count()} teams`)
  console.log(`  - ${await prisma.repoLink.count()} repositories`)
  console.log(`  - ${await prisma.onboardingGuide.count()} guides`)
  console.log(`  - ${await prisma.quest.count()} quests`)
  console.log('\nYou can now:')
  console.log('  1. Start the app: npm run dev')
  console.log('  2. Visit: http://localhost:3000')
  console.log('  3. Go to /teams to see the seeded data')
  console.log('  4. Explore the Shift Scheduler Team onboarding guide')
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
