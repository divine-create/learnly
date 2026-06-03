'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react'

type Plan = 'starter' | 'growth' | 'institution'

const PLANS: Array<{ id: Plan; name: string; price: string; period: string; features: string[]; highlight: boolean }> = [
  {
    id: 'starter', name: 'Starter', price: '₦150,000', period: '/term',
    highlight: false,
    features: ['Up to 100 students', '5 teachers', 'AI tutor (text)', 'Quiz generator', 'Basic analytics'],
  },
  {
    id: 'growth', name: 'Growth', price: '₦300,000', period: '/term',
    highlight: true,
    features: ['Up to 300 students', '15 teachers', 'Voice AI', 'Parent dashboard', 'Advanced analytics', 'Weekly parent emails'],
  },
  {
    id: 'institution', name: 'Institution', price: '₦600,000', period: '/term',
    highlight: false,
    features: ['Unlimited students & teachers', 'Custom branding', 'Priority support', 'CSV exports', 'Multi-campus support', 'Dedicated account manager'],
  },
]

export default function BillingPage() {
  const [loading, setLoading] = useState<Plan | null>(null)

  async function subscribe(plan: Plan) {
    setLoading(plan)
    const res = await fetch('/api/billing/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { toast.error(data.error); return }
    window.location.href = data.authorizationUrl
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={22} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        </div>
        <p className="text-gray-500">Choose a plan. Payments are processed securely via Paystack in Nigerian Naira.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`border-2 rounded-xl p-6 relative ${plan.highlight ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200'}`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </span>
            )}
            <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
              <span className="text-gray-400 text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-brand-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(plan.id)}
              disabled={loading !== null}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                plan.highlight
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              {loading === plan.id ? (
                <><Loader2 size={15} className="animate-spin" /> Redirecting to Paystack…</>
              ) : (
                `Subscribe to ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Payments secured by Paystack · Subscription lasts one academic term (4 months) · Contact hello@codebridgenigeria.com for invoices
      </p>
    </div>
  )
}
