import { redirect } from 'next/navigation'

// Redirect to parent dashboard
export default function ParentProgressPage() {
  redirect('/parent')
}
