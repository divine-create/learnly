import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      schoolId: string | null
      schoolName: string | null
      avatarUrl: string | null
    } & DefaultSession['user']
  }
}
