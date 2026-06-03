import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? '')
const FROM = 'CodeBridge Nigeria <noreply@codebridgenigeria.com>'

export async function sendTeacherWelcome({
  to,
  name,
  schoolName,
  password,
}: {
  to: string
  name: string
  schoolName: string
  password: string
}) {
  if (!process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to CodeBridge — ${schoolName}`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
  <div style="background:#7c3aed;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:24px">CodeBridge Nigeria</h1>
    <p style="color:#c4b5fd;margin:8px 0 0">AI-Powered Coding Education</p>
  </div>

  <h2 style="font-size:20px">Welcome, ${name}! 👋</h2>
  <p>You've been added as a teacher at <strong>${schoolName}</strong> on CodeBridge Nigeria.</p>

  <div style="background:#f5f3ff;border-radius:8px;padding:16px;margin:20px 0">
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Your login credentials:</p>
    <p style="margin:4px 0"><strong>Email:</strong> ${to}</p>
    <p style="margin:4px 0"><strong>Temporary Password:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px">${password}</code></p>
  </div>

  <p>Sign in at <a href="${process.env.NEXTAUTH_URL}/login" style="color:#7c3aed">${process.env.NEXTAUTH_URL}/login</a> and change your password after your first login.</p>

  <p style="font-size:13px;color:#6b7280;margin-top:32px">You can upload lesson materials, generate AI quizzes, and track every student's progress from your dashboard.</p>
</div>`,
  })
}

export async function sendParentWeeklyReport({
  to,
  parentName,
  childName,
  stats,
}: {
  to: string
  parentName: string
  childName: string
  stats: {
    totalXp: number
    streakDays: number
    quizzesTaken: number
    avgScore: number
    lessonsCompleted: number
    badges: string[]
  }
}) {
  if (!process.env.RESEND_API_KEY) return

  const badgeList = stats.badges.length > 0
    ? stats.badges.map(b => `<span style="display:inline-block;background:#f5f3ff;color:#7c3aed;border-radius:9999px;padding:2px 10px;font-size:12px;margin:2px">${b}</span>`).join(' ')
    : '<span style="color:#9ca3af">No badges yet this week</span>'

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${childName}'s weekly progress on CodeBridge 📊`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
  <div style="background:#16a34a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">Weekly Progress Report</h1>
    <p style="color:#bbf7d0;margin:8px 0 0">CodeBridge Nigeria</p>
  </div>

  <p>Hi ${parentName},</p>
  <p>Here's <strong>${childName}</strong>'s coding progress this week:</p>

  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr style="background:#f9fafb">
      <td style="padding:12px;border-radius:8px 0 0 8px;font-size:13px;color:#6b7280">Total XP</td>
      <td style="padding:12px;border-radius:0 8px 8px 0;font-weight:700;color:#7c3aed">${stats.totalXp} XP</td>
    </tr>
    <tr>
      <td style="padding:12px;font-size:13px;color:#6b7280">Day streak</td>
      <td style="padding:12px;font-weight:700;color:#f59e0b">${stats.streakDays} 🔥</td>
    </tr>
    <tr style="background:#f9fafb">
      <td style="padding:12px;font-size:13px;color:#6b7280">Quizzes taken</td>
      <td style="padding:12px;font-weight:700">${stats.quizzesTaken}</td>
    </tr>
    <tr>
      <td style="padding:12px;font-size:13px;color:#6b7280">Average quiz score</td>
      <td style="padding:12px;font-weight:700">${stats.avgScore}%</td>
    </tr>
    <tr style="background:#f9fafb">
      <td style="padding:12px;font-size:13px;color:#6b7280">Lessons completed</td>
      <td style="padding:12px;font-weight:700">${stats.lessonsCompleted}</td>
    </tr>
  </table>

  <p style="font-size:13px;color:#6b7280">Badges earned:</p>
  <div style="margin-bottom:20px">${badgeList}</div>

  <a href="${process.env.NEXTAUTH_URL}/login" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
    View Full Dashboard →
  </a>

  <p style="font-size:12px;color:#9ca3af;margin-top:32px">This is an automated weekly summary from CodeBridge Nigeria.</p>
</div>`,
  })
}
