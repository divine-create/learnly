'use client'
import { useState, useEffect, useRef } from 'react'
import { Award, Download, Star } from 'lucide-react'

type Certificate = {
  id: string
  lessonTitle: string
  className: string
  score: number
  completedAt: string
  type: 'quiz' | 'lesson'
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Certificate | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/certificates').then(r => r.json()).then(d => {
      setCertificates(d)
      setLoading(false)
    })
  }, [])

  function downloadCertificate(cert: Certificate) {
    setSelected(cert)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading certificates…</div>

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Award size={24} className="text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-500 text-sm">Certificates earned for completing lessons and quizzes</p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="card text-center py-16">
          <Award size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-600 mb-2">No certificates yet</h3>
          <p className="text-gray-400 text-sm">Complete lessons and score 70%+ on quizzes to earn certificates</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="card border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award size={32} className="text-yellow-600" />
                </div>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(cert.score / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Certificate of Completion</p>
                <h3 className="font-bold text-gray-900 mb-1">{cert.lessonTitle}</h3>
                <p className="text-sm text-gray-600 mb-2">{cert.className}</p>
                <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full mb-3">
                  Score: {cert.score}%
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {new Date(cert.completedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <button
                  onClick={() => downloadCertificate(cert)}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print-only certificate */}
      {selected && (
        <div ref={printRef} className="hidden print:flex print:fixed print:inset-0 print:bg-white print:items-center print:justify-center">
          <div className="border-8 border-double border-yellow-400 p-16 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-xl text-gray-500 uppercase tracking-widest mb-2">Certificate of Achievement</p>
            <p className="text-gray-600 mb-6">This certifies that</p>
            <p className="text-3xl font-bold text-gray-900 mb-6">— Student —</p>
            <p className="text-gray-600 mb-2">has successfully completed</p>
            <h2 className="text-2xl font-bold text-brand-600 mb-2">{selected.lessonTitle}</h2>
            <p className="text-gray-500 mb-6">{selected.className}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-8 py-3 inline-block mb-6">
              <span className="text-2xl font-bold text-yellow-700">Score: {selected.score}%</span>
            </div>
            <p className="text-sm text-gray-400">
              {new Date(selected.completedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-400">CodeBridge Nigeria · Empowering the Next Generation of Coders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
