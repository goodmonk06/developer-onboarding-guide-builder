# Developer Onboarding Guide Builder

Auto-generate personalized onboarding guides and quests for new team members based on your GitHub repositories and existing documentation.

## Overview

This tool helps engineering teams create comprehensive, AI-powered onboarding experiences for new developers. Simply link your repositories, and the system will:

- Analyze your codebase structure, READMEs, and key files
- Generate tailored 2-week onboarding plans
- Create hands-on "quests" (tasks) for developers to complete
- Customize content based on role (junior, senior, ops, etc.)

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4o for guide generation
- **GitHub Integration**: Octokit for repository analysis
- **Styling**: Tailwind CSS

## Features

### 1. Team Spaces
Organize repositories and guides by team or project area.

### 2. Repository Analysis
- Automatically fetches README files
- Analyzes project structure and key folders
- Extracts package.json metadata
- Identifies main languages and topics

### 3. AI-Powered Guide Generation
- Creates customized onboarding paths
- Generates role-specific content (junior, senior, ops, etc.)
- Produces actionable quests with clear objectives
- Includes time estimates for each task

### 4. Quest System
Interactive learning tasks that guide new developers through:
- Environment setup
- Codebase exploration
- First contributions
- Architecture understanding
- Team integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key
- (Optional) GitHub personal access token for private repos

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/developer-onboarding-guide-builder.git
   cd developer-onboarding-guide-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/onboarding_builder?schema=public"

   # OpenAI
   OPENAI_API_KEY="sk-..."

   # GitHub (optional - for private repos)
   GITHUB_TOKEN=""

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Example: Shift Scheduler Ecosystem

Let's walk through onboarding a new developer to a fictional "Shift Scheduler" system with multiple repositories.

### Step 1: Create a Team Space

1. Go to `/teams`
2. Click "Create Team"
3. Enter:
   - **Name**: Shift Scheduler Team
   - **Description**: Healthcare shift scheduling platform with microservices architecture

### Step 2: Add Repositories

Add the following repositories (examples):

| Repository URL | Role |
|---------------|------|
| `https://github.com/your-org/shift-scheduler-api` | backend |
| `https://github.com/your-org/shift-scheduler-web` | frontend |
| `https://github.com/your-org/shift-scheduler-mobile` | mobile |
| `https://github.com/your-org/shift-scheduler-docs` | documentation |

### Step 3: Generate Onboarding Guide

1. Click the "Onboarding Guides" tab
2. Click "Generate New Guide"
3. Select target role (e.g., "Junior Developer")
4. Click "Generate Guide"

The system will:
- Fetch and analyze all 4 repositories
- Read READMEs and key files
- Generate a comprehensive 2-week onboarding plan
- Create 5-8 hands-on quests

### Step 4: Review Generated Content

The generated guide might include:

**Week 1: Foundation & Setup**
- Day 1-2: Environment setup, running local services
- Day 3-4: Understanding the shift scheduling domain
- Day 5: Architecture overview and API exploration

**Week 2: Hands-On Development**
- Day 1-2: First bug fix in the backend API
- Day 3-4: Add a small feature to the frontend
- Day 5: Code review and team integration

**Example Quests:**

1. **Quest: "Set Up Your Development Environment"**
   - Install Docker, Node.js, PostgreSQL
   - Clone all 4 repositories
   - Run services locally
   - Verify with health check endpoints
   - *Estimated: 4 hours*
   - *Tags: setup, docker, api*

2. **Quest: "Understand the Shift Model"**
   - Read the domain documentation
   - Explore the Shift model in the API
   - Write a test that creates a shift
   - Document your understanding
   - *Estimated: 3 hours*
   - *Tags: domain, backend, testing*

3. **Quest: "Fix Your First Bug"**
   - Pick a "good first issue" from GitHub
   - Create a feature branch
   - Implement the fix with tests
   - Submit a pull request
   - *Estimated: 6 hours*
   - *Tags: bug-fix, git, testing*

## API Reference

### Teams

**GET** `/api/teams`
- List all team spaces

**POST** `/api/teams`
- Create a new team
- Body: `{ name: string, description?: string }`

**GET** `/api/teams/:id`
- Get team details with repos and guides

**PATCH** `/api/teams/:id`
- Update team information

**DELETE** `/api/teams/:id`
- Delete a team (cascades to repos and guides)

### Repositories

**GET** `/api/teams/:teamId/repos`
- List repositories for a team

**POST** `/api/teams/:teamId/repos`
- Add a repository to a team
- Body: `{ githubUrl: string, role: string }`

**DELETE** `/api/repos/:id`
- Remove a repository

### Guides

**GET** `/api/teams/:teamId/guides`
- List onboarding guides for a team

**POST** `/api/teams/:teamId/guides/generate`
- Generate a new onboarding guide
- Body: `{ targetRole: string }`
- This triggers repository analysis and LLM generation

**GET** `/api/guides/:id`
- Get guide details with quests

**DELETE** `/api/guides/:id`
- Delete a guide

## Database Schema

```prisma
model TeamSpace {
  id          String   @id @default(cuid())
  name        String
  description String?
  repos       RepoLink[]
  guides      OnboardingGuide[]
}

model RepoLink {
  id        String   @id @default(cuid())
  teamId    String
  githubUrl String
  role      String   // api, frontend, backend, etc
  team      TeamSpace @relation(...)
}

model OnboardingGuide {
  id           String   @id @default(cuid())
  teamId       String
  title        String
  targetRole   String   // junior, senior, ops, etc
  markdownBody String
  team         TeamSpace @relation(...)
  quests       Quest[]
}

model Quest {
  id                  String   @id @default(cuid())
  guideId             String
  title               String
  descriptionMarkdown String
  estimatedHours      Int
  tagsJson            String   // Stored as JSON
  guide               OnboardingGuide @relation(...)
}
```

## Architecture

### Repository Analyzer (`lib/repo-analyzer.ts`)
- Uses Octokit to interact with GitHub API
- Fetches README, package.json, and directory structure
- Handles public and private repositories
- Returns structured `RepoSummary` objects

### Guide Generator (`lib/guide-generator.ts`)
- Integrates with OpenAI GPT-4o
- Takes repository summaries as context
- Generates onboarding plans in structured JSON
- Creates quests with objectives, steps, and time estimates

### API Routes (`app/api/...`)
- RESTful endpoints using Next.js Route Handlers
- Input validation with Zod
- Proper error handling and status codes
- Database operations via Prisma

### UI (`app/...`)
- Server and client components
- Responsive design with Tailwind CSS
- Markdown rendering for guides and quests
- Interactive forms and real-time updates

## Development

### Generate Prisma Client
```bash
npx prisma generate
```

### Database Migrations
```bash
npx prisma migrate dev --name your_migration_name
```

### Prisma Studio (Database GUI)
```bash
npx prisma studio
```

### Type Checking
```bash
npm run type-check
```

### Build for Production
```bash
npm run build
npm start
```

## Deployment

### Environment Variables
Ensure these are set in your production environment:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `GITHUB_TOKEN` - (Optional) For private repo access
- `NEXT_PUBLIC_APP_URL` - Your production URL

### Recommended Platforms
- **Vercel**: Easiest deployment for Next.js
- **Railway/Render**: Good for full-stack with PostgreSQL
- **AWS/GCP**: For enterprise deployments

### Database
- Use a managed PostgreSQL service (Supabase, Neon, Railway, etc.)
- Run migrations: `npx prisma migrate deploy`

## Customization

### Adding New Target Roles
Edit `app/teams/[id]/page.tsx` to add more role options:
```tsx
<option value="custom-role">Custom Role</option>
```

### Adjusting LLM Prompts
Modify `lib/guide-generator.ts` to customize:
- Onboarding duration (default: 2 weeks)
- Quest complexity
- Content focus areas

### Styling
- Edit `tailwind.config.ts` for theme customization
- Update color schemes in component files

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### OpenAI API Errors
- Confirm `OPENAI_API_KEY` is valid
- Check API quota and billing
- Review rate limits

### GitHub API Rate Limits
- Use `GITHUB_TOKEN` for higher limits
- Implement caching for repeated requests
- Consider repository analysis throttling

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation
- Review API error messages

## Roadmap

- [ ] Markdown export for guides
- [ ] Quest progress tracking
- [ ] Team member accounts
- [ ] Integration with Slack/Discord
- [ ] Custom quest creation UI
- [ ] Analytics dashboard
- [ ] Support for GitLab and Bitbucket
- [ ] Multi-language support

---

Built with ❤️ for developer onboarding
