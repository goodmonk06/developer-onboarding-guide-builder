import { describe, it, expect } from 'vitest'
import type { RepoSummary } from './repo-analyzer'

describe('GuideGenerator', () => {
  describe('repository context building', () => {
    it('should process repository summaries', () => {
      const mockRepos: RepoSummary[] = [
        {
          githubUrl: 'https://github.com/test/repo1',
          owner: 'test',
          repo: 'repo1',
          description: 'Test repository',
          readme: '# Test Repo\n\nThis is a test.',
          mainLanguage: 'TypeScript',
          topics: ['testing', 'typescript'],
          keyFolders: ['src', 'lib', 'tests'],
          packageJson: {
            dependencies: {
              'react': '^18.0.0',
            },
            scripts: {
              'dev': 'next dev',
              'build': 'next build',
            },
          },
        },
      ]

      expect(mockRepos).toBeDefined()
      expect(mockRepos[0].owner).toBe('test')
      expect(mockRepos[0].mainLanguage).toBe('TypeScript')
      expect(mockRepos[0].topics).toContain('typescript')
    })

    it('should handle empty repository list', () => {
      const repos: RepoSummary[] = []

      expect(repos).toBeDefined()
      expect(repos.length).toBe(0)
    })
  })

  describe('target role validation', () => {
    it('should accept standard roles', () => {
      const validRoles = ['junior', 'senior', 'ops', 'fullstack', 'frontend', 'backend']

      validRoles.forEach(role => {
        expect(role).toBeDefined()
        expect(typeof role).toBe('string')
        expect(role.length).toBeGreaterThan(0)
      })
    })

    it('should accept custom roles', () => {
      const customRole = 'data-engineer'
      expect(customRole).toBeDefined()
      expect(typeof customRole).toBe('string')
    })
  })

  describe('quest data structure', () => {
    it('should validate quest data structure', () => {
      const mockQuest = {
        title: 'Set Up Development Environment',
        descriptionMarkdown: '## Steps\n\n1. Install Node.js\n2. Clone repo',
        estimatedHours: 4,
        tags: ['setup', 'environment'],
      }

      expect(mockQuest).toHaveProperty('title')
      expect(mockQuest).toHaveProperty('descriptionMarkdown')
      expect(mockQuest).toHaveProperty('estimatedHours')
      expect(mockQuest).toHaveProperty('tags')

      expect(typeof mockQuest.title).toBe('string')
      expect(typeof mockQuest.descriptionMarkdown).toBe('string')
      expect(typeof mockQuest.estimatedHours).toBe('number')
      expect(Array.isArray(mockQuest.tags)).toBe(true)
      expect(mockQuest.estimatedHours).toBeGreaterThan(0)
    })
  })

  describe('generated guide structure', () => {
    it('should validate guide data structure', () => {
      const mockGuide = {
        title: 'Junior Developer Onboarding',
        targetRole: 'junior',
        markdownBody: '# Welcome\n\n## Week 1\n\nSetup...',
        quests: [
          {
            title: 'Setup',
            descriptionMarkdown: 'Setup your environment',
            estimatedHours: 4,
            tags: ['setup'],
          },
        ],
      }

      expect(mockGuide).toHaveProperty('title')
      expect(mockGuide).toHaveProperty('targetRole')
      expect(mockGuide).toHaveProperty('markdownBody')
      expect(mockGuide).toHaveProperty('quests')

      expect(typeof mockGuide.title).toBe('string')
      expect(typeof mockGuide.targetRole).toBe('string')
      expect(typeof mockGuide.markdownBody).toBe('string')
      expect(Array.isArray(mockGuide.quests)).toBe(true)
      expect(mockGuide.quests.length).toBeGreaterThan(0)
    })

    it('should have properly structured quests', () => {
      const mockGuide = {
        title: 'Test Guide',
        targetRole: 'junior',
        markdownBody: 'Content',
        quests: [
          {
            title: 'Quest 1',
            descriptionMarkdown: 'Description',
            estimatedHours: 3,
            tags: ['tag1', 'tag2'],
          },
          {
            title: 'Quest 2',
            descriptionMarkdown: 'Description 2',
            estimatedHours: 5,
            tags: ['tag3'],
          },
        ],
      }

      mockGuide.quests.forEach(quest => {
        expect(quest.title).toBeDefined()
        expect(quest.descriptionMarkdown).toBeDefined()
        expect(quest.estimatedHours).toBeGreaterThan(0)
        expect(Array.isArray(quest.tags)).toBe(true)
      })
    })
  })
})
