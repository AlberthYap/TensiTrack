import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/auth'
import { Activity, Heart, Shield, Sparkles } from 'lucide-react'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-br from-pink-300/10 to-orange-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-grid opacity-[0.02] dark:opacity-[0.04] pointer-events-none" aria-hidden="true" />

      {/* Two-column layout: branding left, form right */}
      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Branding (hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative">
          <div className="max-w-md">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-hero shadow-glow mb-6 animate-scale-in">
              <Activity className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-gradient mb-4 animate-fade-in-up">
              Tensi Harian
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Pantau tekanan darah Anda dengan mudah, aman, dan modern.
            </p>

            <div className="space-y-4 stagger-children">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/60 dark:border-gray-700/50">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-cool shadow-md flex-shrink-0">
                  <Heart className="w-4 h-4 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pencatatan Mudah</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Catat tekanan darah dalam hitungan detik</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/60 dark:border-gray-700/50">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-success shadow-md flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Analitik Cerdas</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Visualisasi tren dan pola tekanan darah</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/60 dark:border-gray-700/50">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-purple shadow-md flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Aman & Privat</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Data Anda dilindungi dengan enkripsi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form (always shown) */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-hero p-2.5 rounded-xl shadow-glow">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">
                  Tensi Harian
                </span>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
