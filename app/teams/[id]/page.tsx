'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface Team {
  id: string
  name: string
  description: string | null
  repos: Repo[]
  guides: Guide[]
}

interface Repo {
  id: string
  githubUrl: string
  role: string
}

interface Guide {
  id: string
  title: string
  targetRole: string
  quests: any[]
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState<'repos' | 'guides'>('repos')
  const [loading, setLoading] = useState(true)

  // Repo form state
  const [showRepoForm, setShowRepoForm] = useState(false)
  const [newRepo, setNewRepo] = useState({ githubUrl: '', role: '' })

  // Guide generation state
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [targetRole, setTargetRole] = useState('junior')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [id])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${id}`)
      const data = await response.json()
      setTeam(data.team)
    } catch (error) {
      console.error('Error fetching team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/teams/${id}/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepo),
      })

      if (response.ok) {
        setNewRepo({ githubUrl: '', role: '' })
        setShowRepoForm(false)
        fetchTeam()
      }
    } catch (error) {
      console.error('Error adding repo:', error)
    }
  }

  const handleDeleteRepo = async (repoId: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) return

    try {
      const response = await fetch(`/api/repos/${repoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTeam()
      }
    } catch (error) {
      console.error('Error deleting repo:', error)
    }
  }

  const handleGenerateGuide = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)

    try {
      const response = await fetch(`/api/teams/${id}/guides/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      })

      if (response.ok) {
        setShowGenerateForm(false)
        setActiveTab('guides')
        fetchTeam()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating guide:', error)
      alert('Failed to generate guide')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Team not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/teams" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
          ← Back to Teams
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {team.name}
          </h1>
          {team.description && (
            <p className="text-gray-600 dark:text-gray-400">{team.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('repos')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'repos'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Repositories ({team.repos.length})
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'guides'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Onboarding Guides ({team.guides.length})
          </button>
        </div>

        {/* Repos Tab */}
        {activeTab === 'repos' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Linked Repositories
              </h2>
              <button
                onClick={() => setShowRepoForm(!showRepoForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {showRepoForm ? 'Cancel' : '+ Add Repository'}
              </button>
            </div>

            {showRepoForm && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <form onSubmit={handleAddRepo}>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      GitHub URL *
                    </label>
                    <input
                      type="url"
                      value={newRepo.githubUrl}
                      onChange={(e) => setNewRepo({ ...newRepo, githubUrl: e.target.value })}
                      placeholder="https://github.com/owner/repo"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      Role/Type *
                    </label>
                    <input
                      type="text"
                      value={newRepo.role}
                      onChange={(e) => setNewRepo({ ...newRepo, role: e.target.value })}
                      placeholder="e.g., api, frontend, backend, docs"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Add Repository
                  </button>
                </form>
              </div>
            )}

            {team.repos.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No repositories linked yet
                </p>
                <button
                  onClick={() => setShowRepoForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Add Your First Repository
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {team.repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex justify-between items-center"
                  >
                    <div>
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {repo.githubUrl}
                      </a>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Role: {repo.role}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRepo(repo.id)}
                      className="text-red-600 hover:text-red-700 px-3 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Onboarding Guides
              </h2>
              <button
                onClick={() => setShowGenerateForm(!showGenerateForm)}
                disabled={team.repos.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showGenerateForm ? 'Cancel' : '✨ Generate New Guide'}
              </button>
            </div>

            {team.repos.length === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 dark:text-yellow-200">
                  Add repositories first to generate onboarding guides
                </p>
              </div>
            )}

            {showGenerateForm && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <form onSubmit={handleGenerateGuide}>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      Target Role *
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="junior">Junior Developer</option>
                      <option value="senior">Senior Developer</option>
                      <option value="ops">DevOps/SRE</option>
                      <option value="fullstack">Full Stack Developer</option>
                      <option value="frontend">Frontend Developer</option>
                      <option value="backend">Backend Developer</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={generating}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generating... (this may take a minute)' : 'Generate Guide'}
                  </button>
                </form>
              </div>
            )}

            {team.guides.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No onboarding guides yet
                </p>
                {team.repos.length > 0 && (
                  <button
                    onClick={() => setShowGenerateForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Generate Your First Guide
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {team.guides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/guides/${guide.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {guide.title}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                        {guide.targetRole}
                      </span>
                      <span>{guide.quests.length} quests</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
