import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">CUET Platform</h1>
          <div className="flex gap-4">
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Enter Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white">
            Master CUET UG with Confidence
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Access 1000+ authentic past papers, AI-powered analysis, and adaptive mock tests
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              Go to Dashboard
            </Link>
            <Link href="#features" className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white dark:bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose CUET Platform?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Authentic Papers',
                description: '1000+ questions from official NTA papers (2022-2025)',
                icon: '📄'
              },
              {
                title: 'AI-Powered Analytics',
                description: 'Get detailed performance analysis and personalized recommendations',
                icon: '📊'
              },
              {
                title: 'Full-Length Tests',
                description: '20 complete mock exams matching latest CUET pattern',
                icon: '⏱️'
              },
              {
                title: 'Adaptive Learning',
                description: 'Questions adapt to your level and weak areas',
                icon: '🎯'
              },
              {
                title: 'Expert Explanations',
                description: 'Detailed solutions for every question',
                icon: '💡'
              },
              {
                title: 'Gamification',
                description: 'Earn XP, streaks, and compete on leaderboards',
                icon: '🏆'
              }
            ].map((feature, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-4xl mx-auto text-center space-y-4 px-4">
          <h2 className="text-3xl font-bold">Ready to ace CUET?</h2>
          <p className="text-lg opacity-90">Join thousands of students preparing with confidence</p>
          <Link href="/dashboard" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-slate-100 font-semibold">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 CUET Platform. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
