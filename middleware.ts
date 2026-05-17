import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ROLE_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN:  ['/super-admin'],
  SCHOOL_ADMIN: ['/admin'],
  TEACHER:      ['/teacher'],
  STUDENT:      ['/student'],
  PARENT:       ['/parent'],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const protectedPrefixes = ['/admin', '/teacher', '/student', '/parent', '/super-admin']
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session) {
    const role = session.user.role
    const allowedPrefixes = ROLE_ROUTES[role] ?? []
    const isAllowed = allowedPrefixes.some(p => pathname.startsWith(p))

    if (isProtected && !isAllowed) {
      const redirectMap: Record<string, string> = {
        SUPER_ADMIN:  '/super-admin',
        SCHOOL_ADMIN: '/admin',
        TEACHER:      '/teacher',
        STUDENT:      '/student',
        PARENT:       '/parent',
      }
      return NextResponse.redirect(new URL(redirectMap[role] ?? '/', req.url))
    }

    if ((pathname === '/login' || pathname === '/register')) {
      const redirectMap: Record<string, string> = {
        SUPER_ADMIN:  '/super-admin',
        SCHOOL_ADMIN: '/admin',
        TEACHER:      '/teacher',
        STUDENT:      '/student',
        PARENT:       '/parent',
      }
      return NextResponse.redirect(new URL(redirectMap[role] ?? '/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
    '/super-admin/:path*',
    '/login',
    '/register',
  ],
}
