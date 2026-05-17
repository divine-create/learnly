import Link from 'next/link'
import { BookOpen, Brain, Trophy, Users, Zap, Shield, Globe, ArrowRight, CheckCircle, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">CodeBridge</span>
            <span className="text-xs bg-nigeria-green text-white px-2 py-0.5 rounded-full font-medium">Nigeria</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#roles" className="hover:text-brand-600 transition-colors">For Schools</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-brand-600 font-medium">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm">Register School</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap size={14} />
            <span>Built for Nigerian K-12 Schools · NERDC Curriculum Aligned</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            AI-Powered Coding<br />
            <span className="text-brand-600">Education for Every</span><br />
            Nigerian School
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Give your students an AI tutor that learns directly from your teachers' materials.
            Upload lessons, generate quizzes, track progress — all in one platform built for Nigeria.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-8 py-3 flex items-center gap-2 justify-center">
              Register Your School Free
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3">
              Sign In to Dashboard
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">First term free · No credit card required · Setup in 10 minutes</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-gray-200">
            {[
              { value: '65M+', label: 'Nigerian students aged 6–18' },
              { value: '₦400M', label: 'EdTech market size (2025)' },
              { value: '27%', label: 'AI market CAGR in Nigeria' },
              { value: '0', label: 'K-12 AI coding platforms at scale' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-brand-600">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything your school needs</h2>
            <p className="text-xl text-gray-600">From lesson upload to AI tutoring to progress reports — in one platform.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen size={28} />,
                color: 'bg-blue-100 text-blue-600',
                title: 'Teacher Material Upload',
                desc: 'Upload PDFs, Word docs, PowerPoints. The AI reads your materials and teaches from them — not from the general internet.',
                tag: 'RAG-powered',
              },
              {
                icon: <Brain size={28} />,
                color: 'bg-brand-100 text-brand-600',
                title: 'Cody — Your AI Tutor',
                desc: 'Cody teaches with the Socratic method. Uses local analogies (danfo bus, jollof rice) and adapts to each student\'s grade level.',
                tag: 'Powered by Claude',
              },
              {
                icon: <Trophy size={28} />,
                color: 'bg-yellow-100 text-yellow-600',
                title: 'Auto Quiz Generator',
                desc: 'Click once to generate a 10-question quiz from any lesson. Teacher reviews and approves. Students earn XP and badges.',
                tag: 'Gamified',
              },
              {
                icon: <Users size={28} />,
                color: 'bg-green-100 text-green-600',
                title: 'All Roles, One Platform',
                desc: 'School admin, teachers, students, and parents each have their own dashboard with the right tools for their role.',
                tag: 'Multi-tenant',
              },
              {
                icon: <Globe size={28} />,
                color: 'bg-orange-100 text-orange-600',
                title: 'Offline-First PWA',
                desc: 'Lessons are cached for offline use. When the NEPA light goes, students keep learning. No data wasted on bad connections.',
                tag: 'Works offline',
              },
              {
                icon: <Shield size={28} />,
                color: 'bg-red-100 text-red-600',
                title: 'Student Data Privacy',
                desc: 'No student PII is shared with AI providers. All data anonymised before API calls. NDPR compliant from day one.',
                tag: 'NDPR Compliant',
              },
            ].map(f => (
              <div key={f.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.tag}</span>
                </div>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for everyone in the school</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                emoji: '🏫', title: 'School Admin', color: 'border-brand-200 bg-brand-50',
                items: ['Register school & invite users', 'View all classes & teachers', 'Manage subscription & billing', 'Download progress reports'],
              },
              {
                emoji: '👩‍🏫', title: 'Teacher', color: 'border-blue-200 bg-blue-50',
                items: ['Upload lesson materials', 'AI generates quizzes automatically', 'Track each student\'s progress', 'Manage classes & enrolments'],
              },
              {
                emoji: '🧒', title: 'Student', color: 'border-yellow-200 bg-yellow-50',
                items: ['Chat with Cody AI tutor', 'Take gamified quizzes', 'Earn XP, badges, streaks', 'View class leaderboard'],
              },
              {
                emoji: '👨‍👩‍👧', title: 'Parent', color: 'border-green-200 bg-green-50',
                items: ['View child\'s progress', 'See quiz scores & badges', 'Weekly email reports', 'Monitor time on platform'],
              },
            ].map(r => (
              <div key={r.title} className={`border-2 ${r.color} rounded-xl p-6`}>
                <div className="text-4xl mb-3">{r.emoji}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-4">{r.title}</h3>
                <ul className="space-y-2">
                  {r.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle size={14} className="text-brand-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, fair pricing in Naira</h2>
            <p className="text-xl text-gray-600">Billed per term · 15% discount for annual payment</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter', price: '₦150,000', period: '/term',
                color: 'border-gray-200', highlight: false,
                features: ['Up to 100 students', '5 teachers', 'AI tutor (text)', 'Quiz generator', 'Basic analytics'],
              },
              {
                name: 'Growth', price: '₦300,000', period: '/term',
                color: 'border-brand-400 ring-2 ring-brand-200', highlight: true,
                features: ['Up to 300 students', '15 teachers', 'Voice AI', 'Parent dashboard', 'Advanced analytics', 'Weekly parent emails'],
              },
              {
                name: 'Institution', price: '₦600,000', period: '/term',
                color: 'border-gray-200', highlight: false,
                features: ['Unlimited students & teachers', 'Custom branding', 'Priority support', 'CSV exports', 'Multi-campus support', 'Dedicated account manager'],
              },
            ].map(p => (
              <div key={p.name} className={`border-2 ${p.color} rounded-xl p-8 relative`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold text-gray-900 text-xl mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                  <span className="text-gray-500">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Star size={14} className="text-brand-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={p.highlight ? 'btn-primary w-full block text-center' : 'btn-secondary w-full block text-center'}
                >
                  Get Started Free
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to bridge the coding gap?</h2>
          <p className="text-brand-200 text-xl mb-8">Join the first AI-powered K-12 coding platform built for Nigerian schools. First term is completely free.</p>
          <Link href="/register" className="bg-white text-brand-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Register Your School Today
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CB</span>
              </div>
              <span className="font-bold text-white">CodeBridge Nigeria</span>
            </div>
            <p className="text-sm">AI-powered coding education for Nigerian K-12 schools.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link href="/register" className="hover:text-white">Register School</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">NDPR Compliance</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:hello@codebridgenigeria.com" className="hover:text-white">hello@codebridgenigeria.com</a></li>
              <li><a href="#" className="hover:text-white">WhatsApp Support</a></li>
              <li><a href="#" className="hover:text-white">Documentation</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          © 2025 CodeBridge Nigeria. Built with ❤️ for Nigerian students.
        </div>
      </footer>
    </div>
  )
}
