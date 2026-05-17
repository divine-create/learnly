import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSchoolCode(name: string): string {
  const prefix = name.slice(0, 4).toUpperCase().replace(/\s/g, '')
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

export function generateClassCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function truncate(str: string, len = 100): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function xpToLevel(xp: number): { level: number; title: string } {
  if (xp < 100) return { level: 1, title: 'Code Newbie' }
  if (xp < 300) return { level: 2, title: 'Bug Smasher' }
  if (xp < 600) return { level: 3, title: 'Loop Master' }
  if (xp < 1000) return { level: 4, title: 'Function Wizard' }
  if (xp < 1500) return { level: 5, title: 'Algorithm Ninja' }
  return { level: 6, title: 'Code Champion' }
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    'Primary 1': 'bg-pink-100 text-pink-700',
    'Primary 2': 'bg-purple-100 text-purple-700',
    'Primary 3': 'bg-blue-100 text-blue-700',
    'Primary 4': 'bg-green-100 text-green-700',
    'Primary 5': 'bg-yellow-100 text-yellow-700',
    'Primary 6': 'bg-orange-100 text-orange-700',
    'JSS 1': 'bg-red-100 text-red-700',
    'JSS 2': 'bg-indigo-100 text-indigo-700',
    'JSS 3': 'bg-teal-100 text-teal-700',
    'SS 1': 'bg-cyan-100 text-cyan-700',
    'SS 2': 'bg-lime-100 text-lime-700',
    'SS 3': 'bg-amber-100 text-amber-700',
  }
  return map[grade] ?? 'bg-gray-100 text-gray-700'
}

export const GRADE_LEVELS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS 1', 'SS 2', 'SS 3',
]

export const SUBJECTS = [
  'Introduction to Coding', 'Scratch Programming', 'Python',
  'Web Development', 'Mathematics', 'Computer Science',
  'Robotics', 'Digital Literacy', 'ICT',
]

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]
