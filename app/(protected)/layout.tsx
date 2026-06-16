import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/auth'
import { Sidebar } from '@/components/features/layout/sidebar'
import { Header } from '@/components/features/layout/header'
import { LoadingBar } from '@/components/features/layout/loading-bar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background blobs */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-400/10 to-orange-400/10 rounded-full blur-3xl" />
      </div>

      {/* Global loading bar - shows on route change */}
      <Suspense fallback={null}>
        <LoadingBar />
      </Suspense>

      <Header user={user} />
      <div className="flex relative">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
