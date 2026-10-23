import { redirect } from 'next/navigation'

export default function PatientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Forward query parameters if any (e.g. ?doctor=...)
  // Since searchParams is a Promise in Next.js 15+, handle it appropriately or redirect to /login
  redirect('/login')
}
