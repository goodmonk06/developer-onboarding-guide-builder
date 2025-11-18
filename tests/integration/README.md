# Integration Tests

This directory contains integration tests that verify end-to-end functionality across multiple system components.

## Requirements

These tests require a running PostgreSQL database. The tests interact with:
- Prisma ORM and database operations
- Event system and domain events
- Analytics tracking
- Quest progress and template management

## Running Integration Tests

### With Docker

Start the development database:

```bash
npm run docker:dev
```

Then run the tests:

```bash
npm test tests/integration/
```

### Manual Database Setup

If you have PostgreSQL running locally:

1. Ensure the database URL is configured in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/onboarding_dev"
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

4. Run tests:
   ```bash
   npm test tests/integration/
   ```

## Test Coverage

### Onboarding Flow Tests (`onboarding-flow.test.ts`)
Tests the complete onboarding workflow:
- Team creation → Member addition → Guide generation → Quest creation → Progress tracking
- Multiple members progressing through the same guide
- Blocked quest handling with blocker tracking
- Progress completion rates and statistics

### Template System Tests (`template-system.test.ts`)
Tests quest template functionality:
- Creating and using public templates
- Team-specific private templates
- Template usage tracking across multiple teams
- Filtering by category and difficulty
- Template versioning via metadata

### API Endpoints Tests (`api-endpoints.test.ts`)
Tests all Phase 3 API routes:
- Team member management (create, list, update, delete)
- Quest progress tracking (create, update, upsert)
- Quest template management (create, list, filter)
- Notification system (create, read, list)

### Event System Tests (`event-system.test.ts`)
Tests domain events and analytics:
- Event emission and capture
- Multiple event handlers
- Event metadata (timestamp, type)
- Analytics tracking integration
- Event-driven workflows (notifications, alerts)

## Test Isolation

Each test suite includes proper setup and teardown:
- `beforeEach()`: Sets up test data and event listeners
- `afterEach()`: Cleans up created database records
- Event bus is cleared between tests to prevent interference

## Skipping Database Tests

If you want to run tests without a database connection, run only unit tests:

```bash
npm test -- --exclude tests/integration/**
```

Or run specific test files:

```bash
npm test lib/guide-generator.test.ts
npm test lib/api-response.test.ts
```
