# Developer Onboarding Guide Builder

Auto-generate personalized onboarding guides and quests for new team members based on your GitHub repositories and existing documentation.

## Overview

This tool helps engineering teams create comprehensive, AI-powered onboarding experiences for new developers. The system analyzes your GitHub repositories and generates:

- Tailored 2-week onboarding plans customized by role (junior, senior, ops, etc.)
- Hands-on "quests" - structured learning tasks with clear objectives
- Repository insights extracted from READMEs, code structure, and dependencies
- Role-specific content that adapts to the new developer's experience level

**Status**: Phase 3 - Production-ready with progress tracking, templates, analytics, and comprehensive tooling

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **AI**: OpenAI GPT-4o for intelligent guide generation
- **GitHub Integration**: Octokit REST API for repository analysis
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest with comprehensive test coverage
- **DevOps**: Docker Compose for local development

## Domain Model

The system uses a rich domain model with 10 core entities:

```
TeamSpace
├── id, name, slug, description
├── members[] ──────> TeamMember
│                     ├── email, name, role, status
│                     ├── title, avatarUrl, githubUsername
│                     └── progress[] ──> QuestProgress
├── repos[] ────────> RepoLink (githubUrl, role)
├── guides[] ───────> OnboardingGuide
│                     ├── id, title, targetRole, status
│                     ├── markdownBody, estimatedDays
│                     ├── publishedAt, archivedAt
│                     ├── quests[] ───> Quest
│                     │                 ├── title, description
│                     │                 ├── estimatedHours, orderIndex
│                     │                 ├── prerequisiteIds
│                     │                 ├── tags[]
│                     │                 ├── templateId (optional)
│                     │                 └── progress[] ──> QuestProgress
│                     └── versions[] ─> GuideVersion
├── templates[] ────> QuestTemplate
│                     ├── title, category, difficulty
│                     ├── isPublic, usageCount
│                     └── metadataJson
└── notifications[] ─> Notification
                      ├── type, priority, channels[]
                      └── message, isRead, readAt
```

**Key Relationships:**
- **Team Members**: Track individuals with roles (OWNER, ADMIN, MEMBER, VIEWER) and status (ACTIVE, INVITED, INACTIVE)
- **Quest Progress**: Members track completion status, time spent, feedback ratings, and blockers
- **Templates**: Reusable quest templates (public or team-specific) with usage tracking
- **Versioning**: Guide versions support iterative improvements and rollback
- **Notifications**: Multi-channel notifications (in-app, email, Slack) with priority levels

## Phase 3 Features

### Team Member Management
- Add team members with customizable roles and permissions
- Track member status (active, invited, inactive)
- Associate members with GitHub profiles
- Per-member quest progress tracking

### Quest Progress Tracking
- **Status tracking**: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED
- **Time tracking**: Log actual time spent vs. estimated hours
- **Feedback system**: 5-star ratings and text feedback on completed quests
- **Blocker management**: Document blockers when quests are stuck
- **Notes**: Add contextual notes for each quest attempt

### Quest Templates
- **Public templates**: Shared across all teams for common onboarding tasks
- **Private templates**: Team-specific templates for internal processes
- **Usage tracking**: Monitor which templates are most popular
- **Categories**: technical-setup, technical-deep-dive, domain-knowledge, team-process, soft-skills
- **Difficulty levels**: beginner, intermediate, advanced
- **Metadata support**: Extensible JSON metadata for custom properties

### Domain Events & Analytics
- **Event system**: Typed domain events for cross-cutting concerns
  - Team events: created, updated, deleted
  - Member events: joined, left, role_changed
  - Guide events: generated, published, archived
  - Quest events: assigned, started, completed, blocked
  - Template events: created, used
- **Analytics tracking**: Quest completion rates, time efficiency, feedback analysis
- **Event handlers**: Pluggable handlers for notifications, integrations, auditing

### Notification System
- **Multi-channel support**: In-app, email, Slack (extensible)
- **Priority levels**: low, medium, high, urgent
- **Read tracking**: Track when notifications are viewed
- **Notification types**: quest_assigned, quest_completed, member_joined, etc.

### CLI Management Tools
Comprehensive CLI for database operations:
- `npm run cli stats` - Show database statistics
- `npm run cli teams:list` - List all teams
- `npm run cli teams:create -- -n "Team Name"` - Create new team
- `npm run cli members:create -- -t TEAM_ID -e email@example.com -n "Name"` - Add member
- `npm run cli progress:report` - Onboarding progress summary
- `npm run cli analytics:completion` - Quest completion analytics
- `npm run cli clean:stale` - Clean archived guides older than 6 months

### Extensibility & Adapters
- **Notification adapters**: Email, Slack, webhook integrations
- **Analytics adapters**: Track events, metrics, timing
- **Structured logging**: Contextual logging with correlation IDs
- **Utility functions**: Slug generation, time formatting, retry logic

## Getting Started

### Requirements

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (for local PostgreSQL)
- **OpenAI API Key** (required for guide generation)
- **GitHub Token** (optional, for private repositories)

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/developer-onboarding-guide-builder.git
   cd developer-onboarding-guide-builder
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onboarding_builder?schema=public"
   OPENAI_API_KEY="sk-your-openai-api-key-here"  # Required!
   GITHUB_TOKEN=""  # Optional
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Start PostgreSQL with Docker**
   ```bash
   npm run docker:dev
   ```

4. **Set up database and seed data**
   ```bash
   npm run db:push    # Create database schema
   npm run db:seed    # Load example data
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**

   Visit [http://localhost:3000](http://localhost:3000)

### Verify Setup

Run the test suite to verify everything works:

```bash
npm test
```

Unit tests and event system tests should pass (36+ passing tests). Integration tests require a running PostgreSQL database.

## Example Flow - Complete Vertical Slice

This section demonstrates the complete working flow from creating a team to viewing generated onboarding guides.

### 1. View Seeded Data

After running `npm run db:seed`, the database contains example teams:

- **Shift Scheduler Team** - Healthcare shift scheduling platform (with complete onboarding guide)
- **E-commerce Platform Team** - Modern e-commerce platform

Navigate to http://localhost:3000/teams to see all teams.

### 2. Create a New Team

**UI Flow:**
1. Go to `/teams`
2. Click "Create Team"
3. Enter team name and description
4. Submit

**API Endpoint:**
```bash
POST /api/teams
Content-Type: application/json

{
  "name": "Your Team Name",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "clx...",
      "name": "Your Team Name",
      "description": "...",
      "repos": [],
      "guides": []
    }
  }
}
```

### 3. Add Repositories

**UI Flow:**
1. Click on your team
2. Go to "Repositories" tab
3. Click "Add Repository"
4. Enter GitHub URL (e.g., `https://github.com/facebook/react`)
5. Specify role (e.g., `frontend`, `backend`, `api`)

**API Endpoint:**
```bash
POST /api/teams/:teamId/repos
Content-Type: application/json

{
  "githubUrl": "https://github.com/facebook/react",
  "role": "frontend"
}
```

### 4. Generate Onboarding Guide

**UI Flow:**
1. Switch to "Onboarding Guides" tab
2. Click "Generate New Guide"
3. Select target role (junior, senior, ops, etc.)
4. Click "Generate Guide" (takes 30-60 seconds)

**What Happens:**
- System fetches repository data via GitHub API
- Analyzes README files, folder structure, package.json
- Sends repository context to OpenAI GPT-4o
- Generates customized 2-week onboarding plan
- Creates 5-8 hands-on quests automatically

**API Endpoint:**
```bash
POST /api/teams/:teamId/guides/generate
Content-Type: application/json

{
  "targetRole": "junior"
}
```

### 5. View Guide and Quests

**UI Flow:**
1. Click on the generated guide
2. Read the markdown onboarding plan
3. Expand individual quests to see details

**Guide Structure:**
```markdown
# Week 1: Foundation & Setup
- Days 1-2: Environment setup
- Days 3-4: Domain understanding
- Day 5: Architecture overview

# Week 2: Hands-On Development
- Days 1-2: First contributions
- Days 3-4: Feature implementation
- Day 5: Team integration
```

**Quest Details:**
- Title and description
- Estimated hours (e.g., 4 hours)
- Tags (e.g., `setup`, `testing`, `backend`)
- Step-by-step instructions

### 6. Example: Shift Scheduler Guide

The seeded database includes a complete example guide at:

`/teams/<team-id>/` → Click "Onboarding Guides" → "Junior Developer Onboarding - Shift Scheduler Team"

This guide includes 5 quests:
1. **Set Up Your Development Environment** (4 hours)
2. **Understand the Shift Model** (3 hours)
3. **Fix Your First Bug** (6 hours)
4. **Add a Small Feature to the UI** (5 hours)
5. **Learn the Deployment Process** (3 hours)

**Total onboarding time**: ~21 hours across 2 weeks

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run test suite (unit + integration) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run cli` | Run CLI management tool (see `npm run cli -- --help`) |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Create migration from schema changes |
| `npm run db:seed` | Seed database with Phase 3 example data |
| `npm run db:reset` | Reset database (migrate + seed) |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run docker:dev` | Start PostgreSQL in Docker |
| `npm run docker:dev:down` | Stop PostgreSQL container |
| `npm run docker:up` | Build and start full app with Docker Compose |

## Database Schema

See the complete schema in `prisma/schema.prisma`:

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
  markdownBody String   @db.Text
  team         TeamSpace @relation(...)
  quests       Quest[]
}

model Quest {
  id                  String   @id @default(cuid())
  guideId             String
  title               String
  descriptionMarkdown String   @db.Text
  estimatedHours      Int
  tagsJson            String   @db.Text
  guide               OnboardingGuide @relation(...)
}
```

## Architecture

### Repository Analyzer (`lib/repo-analyzer.ts`)
- Fetches repository data from GitHub API
- Extracts README, package.json, folder structure
- Returns structured `RepoSummary` for LLM processing

### Guide Generator (`lib/guide-generator.ts`)
- Takes repository summaries as input
- Constructs detailed prompts for OpenAI
- Generates 2-week onboarding plans with quests
- Returns structured JSON with guides and quests

### API Layer (`app/api/`)
- **RESTful endpoints** with consistent error handling
- **Input validation** using Zod schemas
- **Centralized error responses** (`lib/api-response.ts`)
- **Database operations** via Prisma
- **Phase 3 endpoints**:
  - `/api/teams/[id]/members` - Team member management
  - `/api/members/[id]` - Individual member operations
  - `/api/quests/[id]/progress` - Quest progress tracking
  - `/api/templates` - Quest template CRUD operations

### Domain Events & Analytics (`lib/events.ts`, `lib/adapters/`)
- **Event Bus**: Typed domain events with async handlers
- **Notification Adapters**: Email, Slack, in-memory implementations
- **Analytics Adapters**: Track events, metrics, counters, timing
- **Structured Logging** (`lib/logger.ts`): Contextual logging with levels

### CLI Tools (`scripts/cli.ts`)
- **Commander-based** CLI for database operations
- **Stats & Reporting**: Database statistics, progress reports
- **Data Management**: Create teams/members, clean stale data
- **Analytics**: Completion analytics, efficiency tracking

### UI Layer (`app/`)
- Server and client components
- Responsive design with Tailwind CSS
- Markdown rendering with react-markdown
- Real-time form handling and updates

## Testing

Run the test suite:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Open Vitest UI
```

**Test Coverage:**

*Unit Tests:*
- API response utilities (error handling, success responses)
- Data structure validation (guides, quests, repositories)
- Zod schema validation
- Prisma error handling

*Integration Tests:*
- Complete onboarding flow (team → member → guide → quest → progress)
- Quest template system (create, use, track)
- API endpoints (members, progress, templates, notifications)
- Event system and analytics (event emission, handlers, tracking)

See `tests/integration/README.md` for running integration tests with database.

## Deployment

### Docker Production Build

```bash
# Build and start with Docker Compose
npm run docker:up

# The app will be available at http://localhost:3000
```

### Environment Variables

Ensure these are set in production:

```env
DATABASE_URL=postgresql://user:pass@host:5432/onboarding_builder
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...  # Optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Platforms

- **Vercel**: Deploy Next.js app + Vercel Postgres
- **Railway/Render**: Full-stack with PostgreSQL
- **AWS/GCP**: Enterprise deployments with RDS/Cloud SQL

## Future Extensions

**Phase 3 Completed** ✅
- [x] **Quest Progress Tracking**: Track which quests team members have completed
- [x] **Team Member Accounts**: Role management (OWNER, ADMIN, MEMBER, VIEWER)
- [x] **Quest Templates**: Reusable quest templates across teams
- [x] **Onboarding Feedback**: Collect ratings and feedback from new developers
- [x] **Analytics Dashboard**: Track onboarding completion rates and time
- [x] **Integration Foundation**: Event system and notification adapters for Slack/email

**Future Enhancements:**
- [ ] **User Authentication**: OAuth/SSO integration for member login
- [ ] **Custom Quest Builder UI**: Visual editor for manually creating quests
- [ ] **Markdown Export**: Download guides as standalone markdown files
- [ ] **Real-time Notifications**: WebSocket support for live updates
- [ ] **Multi-Repository Support**: Analyze monorepos with multiple workspaces
- [ ] **GitLab & Bitbucket**: Support beyond GitHub
- [ ] **AI Model Selection**: Support for Claude, Gemini, or local LLMs
- [ ] **Automated Updates**: Re-generate guides when repos change significantly
- [ ] **Guide Branching**: A/B test different onboarding approaches
- [ ] **Mobile App**: React Native app for on-the-go quest tracking
- [ ] **API Documentation**: OpenAPI/Swagger specs for external integrations

## Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Troubleshooting

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Restart database
npm run docker:dev:down
npm run docker:dev

# Reset database completely
npm run db:reset
npm run db:seed
```

### OpenAI API Errors

- **Missing API Key**: Ensure `OPENAI_API_KEY` is set in `.env`
- **Rate Limits**: Wait a few seconds and try again
- **Invalid Model**: Verify you have access to GPT-4o

### GitHub API Rate Limits

- **Without Token**: 60 requests/hour
- **With Token**: 5000 requests/hour
- **Solution**: Add `GITHUB_TOKEN` to `.env`

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npm run db:generate

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## License

MIT License - see LICENSE file for details

## Support

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check this README and inline code comments
- **Prisma Studio**: Explore the database with `npm run db:studio`

---

**Built with ❤️ for better developer onboarding**

**Phase 3 Complete** ✅ - Production-ready with:
- Team member management and role-based access
- Quest progress tracking with feedback and blockers
- Reusable quest templates (public & private)
- Domain events and pluggable analytics
- Multi-channel notification system
- Comprehensive CLI management tools
- Integration tests and comprehensive documentation
