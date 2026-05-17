'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { BookOpen, CheckCircle } from 'lucide-react'
import { NIGERIAN_STATES } from '@/lib/utils'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // School info
  const [schoolName, setSchoolName] = useState('')
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [schoolType, setSchoolType] = useState('both')

  // Admin info
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < 3) { setStep((step + 1) as Step); return }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, state, lga, schoolType, adminName, adminEmail, adminPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Registration failed')
      toast.success(`School registered! Your code: ${data.schoolCode}`)
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CodeBridge Nigeria</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Register Your School</h1>
          <p className="text-gray-600 text-sm mt-1">First term completely free · Setup in 5 minutes</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > s ? 'bg-brand-600 text-white' : step === s ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-brand-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <h2 className="font-semibold text-gray-900 mb-4">School Information</h2>
                <div>
                  <label className="label">School Name *</label>
                  <input className="input" value={schoolName} onChange={e => setSchoolName(e.target.value)} required placeholder="e.g. Greenfield Academy" />
                </div>
                <div>
                  <label className="label">State *</label>
                  <select className="input" value={state} onChange={e => setState(e.target.value)} required>
                    <option value="">Select state…</option>
                    {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">LGA *</label>
                  <input className="input" value={lga} onChange={e => setLga(e.target.value)} required placeholder="Local Government Area" />
                </div>
                <div>
                  <label className="label">School Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['primary', 'secondary', 'both'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSchoolType(t)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                          schoolType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {t === 'both' ? 'Both' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-semibold text-gray-900 mb-4">Admin Account</h2>
                <div>
                  <label className="label">Your Full Name *</label>
                  <input className="input" value={adminName} onChange={e => setAdminName(e.target.value)} required placeholder="e.g. Mrs. Adaeze Okonkwo" />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input type="email" className="input" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required placeholder="principal@school.edu.ng" />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-bold text-gray-900 text-xl mb-2">Everything looks good!</h2>
                <div className="text-left bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1 mb-4">
                  <div><span className="font-medium">School:</span> {schoolName}</div>
                  <div><span className="font-medium">Location:</span> {lga}, {state}</div>
                  <div><span className="font-medium">Type:</span> {schoolType}</div>
                  <div><span className="font-medium">Admin:</span> {adminName} ({adminEmail})</div>
                </div>
                <p className="text-gray-600 text-sm">Click Register to create your school. First term is completely free!</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep((step - 1) as Step)} className="btn-secondary flex-1">
                  Back
                </button>
              )}
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
                {loading ? 'Registering…' : step < 3 ? 'Continue' : 'Register School'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Already registered?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
