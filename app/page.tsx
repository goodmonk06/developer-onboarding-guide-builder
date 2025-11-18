import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Developer Onboarding Guide Builder
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Auto-generate personalized onboarding guides and quests for new team members
            based on your repositories and documentation.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-3xl mb-2">📁</div>
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">1. Add Repos</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Link your GitHub repositories to a team space
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">2. Generate</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI analyzes your repos and creates tailored guides
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">3. Onboard</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  New developers follow quests to get up to speed
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/teams"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg shadow-lg"
          >
            Get Started with Teams
          </Link>
        </div>
      </div>
    </div>
  );
}
