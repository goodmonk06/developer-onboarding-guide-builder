import OpenAI from 'openai'
import { RepoSummary } from './repo-analyzer'

export interface QuestData {
  title: string
  descriptionMarkdown: string
  estimatedHours: number
  tags: string[]
}

export interface GeneratedGuide {
  title: string
  targetRole: string
  markdownBody: string
  quests: QuestData[]
}

export class GuideGenerator {
  private openai: OpenAI

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Build context from repository summaries
   */
  private buildRepoContext(repos: RepoSummary[]): string {
    return repos.map((repo, idx) => {
      const sections = [
        `## Repository ${idx + 1}: ${repo.owner}/${repo.repo}`,
        repo.description ? `**Description:** ${repo.description}` : '',
        repo.mainLanguage ? `**Main Language:** ${repo.mainLanguage}` : '',
        repo.topics.length > 0 ? `**Topics:** ${repo.topics.join(', ')}` : '',
        repo.keyFolders.length > 0 ? `**Key Folders:** ${repo.keyFolders.join(', ')}` : '',
        repo.packageJson?.scripts ? `**Available Scripts:** ${Object.keys(repo.packageJson.scripts).join(', ')}` : '',
        repo.readme ? `\n**README Excerpt:**\n${repo.readme.slice(0, 2000)}...` : '',
      ].filter(Boolean)

      return sections.join('\n')
    }).join('\n\n---\n\n')
  }

  /**
   * Generate an onboarding guide with quests
   */
  async generateGuide(
    repos: RepoSummary[],
    targetRole: 'junior' | 'senior' | 'ops' | string,
    teamName: string
  ): Promise<GeneratedGuide> {
    const repoContext = this.buildRepoContext(repos)

    const prompt = `You are an expert technical writer and engineering onboarding specialist.

Generate a comprehensive 2-week onboarding guide for a new ${targetRole} developer joining the ${teamName} team.

**Team Repositories:**
${repoContext}

**Your Task:**
1. Create an onboarding guide title
2. Write a detailed 2-week onboarding plan (markdown format) that covers:
   - Week 1: Environment setup, codebase exploration, understanding architecture
   - Week 2: First contributions, deeper dives, team integration
3. Generate 5-8 specific "quests" (hands-on tasks) the new developer should complete

**Return your response in the following JSON format:**
\`\`\`json
{
  "title": "Clear, engaging title for the onboarding guide",
  "targetRole": "${targetRole}",
  "markdownBody": "Full markdown content of the 2-week onboarding plan...",
  "quests": [
    {
      "title": "Quest title",
      "descriptionMarkdown": "Detailed quest description in markdown with objectives, steps, and success criteria",
      "estimatedHours": 4,
      "tags": ["backend", "api", "testing"]
    }
  ]
}
\`\`\`

Make the guide practical, encouraging, and specific to the repositories analyzed. Include links to specific folders/files mentioned in the repo context when relevant.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating developer onboarding guides. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No content returned from OpenAI')
      }

      const parsedContent = JSON.parse(content)

      return {
        title: parsedContent.title,
        targetRole: parsedContent.targetRole || targetRole,
        markdownBody: parsedContent.markdownBody,
        quests: parsedContent.quests || [],
      }
    } catch (error) {
      console.error('Error generating guide:', error)
      throw new Error(`Failed to generate onboarding guide: ${error}`)
    }
  }

  /**
   * Generate additional quests for an existing guide
   */
  async generateAdditionalQuests(
    guideContext: string,
    count: number = 3
  ): Promise<QuestData[]> {
    const prompt = `Based on this onboarding guide context:

${guideContext}

Generate ${count} additional hands-on quests/tasks for the new developer.

**Return your response in the following JSON format:**
\`\`\`json
{
  "quests": [
    {
      "title": "Quest title",
      "descriptionMarkdown": "Detailed description with steps and success criteria",
      "estimatedHours": 4,
      "tags": ["relevant", "tags"]
    }
  ]
}
\`\`\`

Make each quest practical and achievable, with clear objectives.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating developer learning quests. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No content returned from OpenAI')
      }

      const parsedContent = JSON.parse(content)
      return parsedContent.quests || []
    } catch (error) {
      console.error('Error generating quests:', error)
      throw new Error(`Failed to generate quests: ${error}`)
    }
  }
}
