# API Documentation

Complete API reference for the Developer Onboarding Guide Builder.

## Base URL

Development: `http://localhost:3000`

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Optional additional error information
  }
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed (Zod) |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource (e.g., unique constraint) |
| 500 | INTERNAL_ERROR | Unexpected server error |

---

## Teams

### List All Teams

**GET** `/api/teams`

Returns all teams with repository and guide counts.

**Response:**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "clx123...",
        "name": "Backend Team",
        "slug": "backend-team",
        "description": "Our backend engineering team",
        "createdAt": "2024-01-15T10:00:00Z",
        "_count": {
          "repos": 5,
          "guides": 3,
          "members": 12
        }
      }
    ]
  }
}
```

### Get Team by ID

**GET** `/api/teams/:id`

Returns detailed team information including repositories and guides.

**Response:**
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "clx123...",
      "name": "Backend Team",
      "slug": "backend-team",
      "description": "Our backend engineering team",
      "repos": [
        {
          "id": "clx456...",
          "githubUrl": "https://github.com/org/api-server",
          "role": "api"
        }
      ],
      "guides": [
        {
          "id": "clx789...",
          "title": "Junior Developer Onboarding",
          "targetRole": "junior",
          "status": "PUBLISHED"
        }
      ],
      "members": [
        {
          "id": "clxabc...",
          "email": "john@example.com",
          "name": "John Doe",
          "role": "MEMBER",
          "status": "ACTIVE"
        }
      ]
    }
  }
}
```

### Create Team

**POST** `/api/teams`

Create a new team.

**Request Body:**
```json
{
  "name": "Frontend Team",
  "description": "Our frontend engineering team" // Optional
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "clx123...",
      "name": "Frontend Team",
      "slug": "frontend-team",
      "description": "Our frontend engineering team",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

## Team Members

### List Team Members

**GET** `/api/teams/:teamId/members`

Get all members of a team.

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "clx123...",
        "email": "alice@example.com",
        "name": "Alice Johnson",
        "role": "ADMIN",
        "status": "ACTIVE",
        "title": "Senior Engineer",
        "avatarUrl": "https://avatars.githubusercontent.com/u/12345",
        "githubUsername": "alice-codes",
        "createdAt": "2024-01-10T08:00:00Z"
      }
    ]
  }
}
```

### Add Team Member

**POST** `/api/teams/:teamId/members`

Add a new member to the team.

**Request Body:**
```json
{
  "email": "bob@example.com",
  "name": "Bob Smith",
  "role": "MEMBER", // OWNER, ADMIN, MEMBER, VIEWER
  "title": "Junior Developer", // Optional
  "avatarUrl": "https://...", // Optional
  "githubUsername": "bobsmith" // Optional
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "clx456...",
      "teamId": "clx123...",
      "email": "bob@example.com",
      "name": "Bob Smith",
      "role": "MEMBER",
      "status": "ACTIVE",
      "title": "Junior Developer",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

### Get Member

**GET** `/api/members/:id`

Get member details with quest progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "clx123...",
      "email": "bob@example.com",
      "name": "Bob Smith",
      "role": "MEMBER",
      "status": "ACTIVE",
      "questProgress": [
        {
          "id": "clx789...",
          "questId": "clxabc...",
          "status": "COMPLETED",
          "timeSpentMinutes": 240,
          "feedbackRating": 5,
          "completedAt": "2024-01-14T16:30:00Z",
          "quest": {
            "id": "clxabc...",
            "title": "Setup Development Environment",
            "estimatedHours": 4
          }
        }
      ]
    }
  }
}
```

### Update Member

**PATCH** `/api/members/:id`

Update member information.

**Request Body:**
```json
{
  "name": "Robert Smith", // Optional
  "title": "Mid-Level Developer", // Optional
  "role": "ADMIN", // Optional
  "status": "INACTIVE", // Optional
  "avatarUrl": "https://...", // Optional
  "githubUsername": "bob-smith-dev" // Optional
}
```

### Delete Member

**DELETE** `/api/members/:id`

Remove a member from the team.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "message": "Member deleted successfully"
  }
}
```

---

## Quest Progress

### Get Quest Progress

**GET** `/api/quests/:questId/progress`

Get progress for all members on a specific quest.

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": [
      {
        "id": "clx123...",
        "questId": "clxabc...",
        "memberId": "clxdef...",
        "status": "COMPLETED",
        "timeSpentMinutes": 180,
        "feedbackRating": 4,
        "feedbackText": "Great quest, very helpful!",
        "notes": "Had to install Docker first",
        "startedAt": "2024-01-13T09:00:00Z",
        "completedAt": "2024-01-13T12:00:00Z",
        "member": {
          "id": "clxdef...",
          "email": "alice@example.com",
          "name": "Alice Johnson",
          "title": "Senior Engineer"
        },
        "quest": {
          "id": "clxabc...",
          "title": "Setup Development Environment",
          "estimatedHours": 3
        }
      }
    ]
  }
}
```

### Update Quest Progress

**POST** `/api/quests/:questId/progress`

Update or create progress for a quest.

**Request Body:**
```json
{
  "memberId": "clx123...",
  "status": "COMPLETED", // NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED
  "timeSpentMinutes": 180, // Optional
  "notes": "Completed successfully", // Optional
  "feedbackRating": 5, // Optional, 1-5
  "feedbackText": "Very helpful guide", // Optional
  "blockers": "Waiting for database access", // Optional, use with BLOCKED status
  "metadataJson": "{\"custom\": \"data\"}" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": "clx456...",
      "questId": "clxabc...",
      "memberId": "clx123...",
      "status": "COMPLETED",
      "timeSpentMinutes": 180,
      "feedbackRating": 5,
      "feedbackText": "Very helpful guide",
      "completedAt": "2024-01-15T14:30:00Z",
      "member": {
        "id": "clx123...",
        "email": "bob@example.com",
        "name": "Bob Smith"
      },
      "quest": {
        "id": "clxabc...",
        "title": "Setup Development Environment"
      }
    }
  }
}
```

---

## Quest Templates

### List Templates

**GET** `/api/templates`

List quest templates with optional filtering.

**Query Parameters:**
- `teamId` (optional): Filter by team ID (includes public + team-specific)
- `category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "clx123...",
        "title": "Git Basics Workshop",
        "descriptionMarkdown": "## Learn Git\n\n1. Clone repository...",
        "estimatedHours": 3,
        "category": "technical-setup",
        "difficulty": "beginner",
        "tags": ["git", "version-control"],
        "isPublic": true,
        "usageCount": 47,
        "teamId": null,
        "metadataJson": "{\"prerequisites\":[]}"
      }
    ]
  }
}
```

**Categories:**
- `technical-setup` - Environment and tool setup
- `technical-deep-dive` - Advanced technical concepts
- `domain-knowledge` - Business domain understanding
- `team-process` - Team workflows and processes
- `soft-skills` - Communication and collaboration

**Difficulty Levels:**
- `beginner` - For new developers
- `intermediate` - For experienced developers
- `advanced` - For senior/expert developers

### Create Template

**POST** `/api/templates`

Create a new quest template.

**Request Body:**
```json
{
  "title": "Docker Deployment Guide",
  "descriptionMarkdown": "## Deploy with Docker\n\n1. Build image...",
  "estimatedHours": 4,
  "category": "technical-setup",
  "difficulty": "intermediate",
  "tags": ["docker", "deployment"],
  "isPublic": true, // If false, teamId required
  "teamId": "clx123...", // Optional, for private templates
  "metadataJson": "{\"targetDockerVersion\":\">=20.0\"}" // Optional
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "clx789...",
      "title": "Docker Deployment Guide",
      "estimatedHours": 4,
      "category": "technical-setup",
      "difficulty": "intermediate",
      "isPublic": true,
      "usageCount": 0,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

## Repositories

### Add Repository

**POST** `/api/teams/:teamId/repos`

Add a GitHub repository to a team.

**Request Body:**
```json
{
  "githubUrl": "https://github.com/facebook/react",
  "role": "frontend" // api, frontend, backend, docs, etc.
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "repo": {
      "id": "clx123...",
      "teamId": "clxabc...",
      "githubUrl": "https://github.com/facebook/react",
      "role": "frontend",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

## Guides

### Generate Guide

**POST** `/api/teams/:teamId/guides/generate`

Generate an onboarding guide using AI.

**Request Body:**
```json
{
  "targetRole": "junior" // junior, senior, ops, fullstack, etc.
}
```

**Response:** 201 Created (takes 30-60 seconds)
```json
{
  "success": true,
  "data": {
    "guide": {
      "id": "clx123...",
      "teamId": "clxabc...",
      "title": "Junior Developer Onboarding",
      "targetRole": "junior",
      "markdownBody": "# Week 1: Foundation...",
      "estimatedDays": 14,
      "status": "DRAFT",
      "quests": [
        {
          "id": "clx456...",
          "title": "Setup Development Environment",
          "descriptionMarkdown": "## Setup\n\n1. Install Node.js...",
          "estimatedHours": 4,
          "orderIndex": 0,
          "tags": ["setup", "environment"]
        }
      ]
    }
  }
}
```

---

## Events & Analytics

### Domain Events

The system emits typed domain events that can be subscribed to for integrations:

**Event Types:**
- `team.created`, `team.updated`, `team.deleted`
- `member.joined`, `member.left`, `member.role_changed`
- `guide.generated`, `guide.published`, `guide.archived`
- `quest.assigned`, `quest.started`, `quest.completed`, `quest.blocked`
- `repo.added`, `repo.analyzed`, `repo.removed`
- `template.created`, `template.used`

**Event Structure:**
```typescript
{
  type: 'quest.completed',
  timestamp: Date,
  teamId: string,
  quest: { id: string, title: string },
  member: { id: string, email: string, name: string },
  timeSpentMinutes: number,
  feedbackRating?: number
}
```

### Analytics Tracking

Analytics events are automatically tracked:
- `quest_started` - When a member starts a quest
- `quest_completed` - When a quest is marked complete
- `guide_generated` - When AI generates a guide
- `member_invited` - When a member joins
- `template_used` - When a template is used

---

## Rate Limiting

Currently no rate limiting is implemented. Recommended limits for production:

- **General API**: 100 requests/minute per IP
- **Guide Generation**: 5 requests/hour per team (expensive AI operation)
- **GitHub API**: Respects GitHub's rate limits (60/hour without token, 5000/hour with token)

---

## Authentication

**Current Status**: No authentication required (development phase)

**Planned**: OAuth 2.0 / JWT tokens with role-based access control

---

## Webhook Integrations (Future)

**POST** `/api/webhooks/:provider`

Receive webhooks from external services:
- `/api/webhooks/github` - GitHub repository events
- `/api/webhooks/slack` - Slack interaction events

---

## CLI Equivalent Commands

Many operations can also be performed via CLI:

| API Endpoint | CLI Command |
|--------------|-------------|
| POST /api/teams | `npm run cli teams:create -- -n "Team"` |
| POST /api/teams/:id/members | `npm run cli members:create -- -t TEAM_ID -e email -n "Name"` |
| GET /api/teams | `npm run cli teams:list` |
| Analytics | `npm run cli analytics:completion` |
| Progress Report | `npm run cli progress:report` |

---

## Examples

### Complete Onboarding Flow

```bash
# 1. Create a team
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering Team"}'

# 2. Add a repository
curl -X POST http://localhost:3000/api/teams/TEAM_ID/repos \
  -H "Content-Type: application/json" \
  -d '{"githubUrl":"https://github.com/org/repo","role":"backend"}'

# 3. Generate guide
curl -X POST http://localhost:3000/api/teams/TEAM_ID/guides/generate \
  -H "Content-Type: application/json" \
  -d '{"targetRole":"junior"}'

# 4. Add team member
curl -X POST http://localhost:3000/api/teams/TEAM_ID/members \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","name":"New Dev","role":"MEMBER"}'

# 5. Track quest progress
curl -X POST http://localhost:3000/api/quests/QUEST_ID/progress \
  -H "Content-Type: application/json" \
  -d '{"memberId":"MEMBER_ID","status":"COMPLETED","timeSpentMinutes":240,"feedbackRating":5}'
```

---

For more details, see the [main README](../README.md) or explore the codebase in `app/api/`.
