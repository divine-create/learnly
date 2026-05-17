import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
  sub?: string
}

export default function StatCard({ label, value, icon, color = 'bg-brand-100 text-brand-600', sub }: Props) {
  return (
    <div className="card flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
