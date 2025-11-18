import { Octokit } from '@octokit/rest'

export interface RepoSummary {
  githubUrl: string
  owner: string
  repo: string
  description: string | null
  readme: string | null
  mainLanguage: string | null
  topics: string[]
  keyFolders: string[]
  packageJson?: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
}

export class RepoAnalyzer {
  private octokit: Octokit

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN,
    })
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${url}`)
    }
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    }
  }

  /**
   * Fetch README content
   */
  private async fetchReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo,
      })

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
      return null
    } catch (error) {
      console.warn(`Could not fetch README for ${owner}/${repo}:`, error)
      return null
    }
  }

  /**
   * Fetch package.json if it exists
   */
  private async fetchPackageJson(owner: string, repo: string): Promise<any> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json',
      })

      if ('content' in data && data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        return JSON.parse(content)
      }
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Get key folders from repository
   */
  private async getKeyFolders(owner: string, repo: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: '',
      })

      if (Array.isArray(data)) {
        return data
          .filter(item => item.type === 'dir')
          .map(item => item.name)
          .filter(name => !name.startsWith('.') && name !== 'node_modules')
          .slice(0, 10) // Limit to top 10 folders
      }
      return []
    } catch (error) {
      console.warn(`Could not fetch folders for ${owner}/${repo}:`, error)
      return []
    }
  }

  /**
   * Analyze a repository and return a summary
   */
  async analyzeRepo(githubUrl: string): Promise<RepoSummary> {
    const { owner, repo } = this.parseGitHubUrl(githubUrl)

    try {
      // Fetch repo details
      const { data: repoData } = await this.octokit.repos.get({
        owner,
        repo,
      })

      // Fetch README, package.json, and key folders in parallel
      const [readme, packageJson, keyFolders] = await Promise.all([
        this.fetchReadme(owner, repo),
        this.fetchPackageJson(owner, repo),
        this.getKeyFolders(owner, repo),
      ])

      return {
        githubUrl,
        owner,
        repo,
        description: repoData.description,
        readme,
        mainLanguage: repoData.language,
        topics: repoData.topics || [],
        keyFolders,
        packageJson: packageJson ? {
          dependencies: packageJson.dependencies,
          devDependencies: packageJson.devDependencies,
          scripts: packageJson.scripts,
        } : undefined,
      }
    } catch (error) {
      throw new Error(`Failed to analyze repository ${owner}/${repo}: ${error}`)
    }
  }

  /**
   * Analyze multiple repositories
   */
  async analyzeRepos(githubUrls: string[]): Promise<RepoSummary[]> {
    const results = await Promise.allSettled(
      githubUrls.map(url => this.analyzeRepo(url))
    )

    return results
      .filter((result): result is PromiseFulfilledResult<RepoSummary> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }
}
