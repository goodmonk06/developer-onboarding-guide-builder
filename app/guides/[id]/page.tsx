'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Guide {
  id: string
  title: string
  targetRole: string
  markdownBody: string
  team: {
    id: string
    name: string
  }
  quests: Quest[]
}

interface Quest {
  id: string
  title: string
  descriptionMarkdown: string
  estimatedHours: number
  tagsJson: string
}

export default function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)

  useEffect(() => {
    fetchGuide()
  }, [id])

  const fetchGuide = async () => {
    try {
      const response = await fetch(`/api/guides/${id}`)
      const data = await response.json()
      setGuide(data.guide)
    } catch (error) {
      console.error('Error fetching guide:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Guide not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={`/teams/${guide.team.id}`}
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Back to {guide.team.name}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {guide.title}
              </h1>
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
                {guide.targetRole}
              </span>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none mt-6">
            <ReactMarkdown>{guide.markdownBody}</ReactMarkdown>
          </div>
        </div>

        {/* Quests Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Onboarding Quests ({guide.quests.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete these hands-on tasks to get up to speed with the codebase
          </p>

          <div className="space-y-4">
            {guide.quests.map((quest, index) => {
              const tags = JSON.parse(quest.tagsJson) as string[]
              const isExpanded = expandedQuest === quest.id

              return (
                <div
                  key={quest.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </span>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {quest.title}
                          </h3>
                        </div>
                        <div className="flex gap-2 flex-wrap ml-11">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="text-gray-600 dark:text-gray-400 text-sm">
                            ⏱️ ~{quest.estimatedHours}h
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t dark:border-gray-700">
                      <div className="prose dark:prose-invert max-w-none mt-4">
                        <ReactMarkdown>{quest.descriptionMarkdown}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
