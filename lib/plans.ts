export type Plan = 'starter' | 'growth' | 'institution'

export const PLAN_LIMITS: Record<Plan, { students: number; teachers: number }> = {
  starter:     { students: 100,      teachers: 5  },
  growth:      { students: 300,      teachers: 15 },
  institution: { students: Infinity, teachers: Infinity },
}

export const PLAN_PRICES_KOBO: Record<Plan, number> = {
  starter:     15_000_000, // ₦150,000 in kobo
  growth:      30_000_000, // ₦300,000
  institution: 60_000_000, // ₦600,000
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan as Plan)] ?? PLAN_LIMITS.starter
}

export function isPlanActive(planExpiry: Date | null): boolean {
  if (!planExpiry) return true // no expiry set = active (dev/seed)
  return new Date() < planExpiry
}
