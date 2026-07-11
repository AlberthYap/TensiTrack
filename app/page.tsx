import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  QrCode,
} from 'lucide-react'
import { BpCheckWidget } from '@/components/landing/bp-check-widget'
import { DashboardPreview } from '@/components/landing/dashboard-preview'
import { FaqSection } from '@/components/landing/faq-section'

export const metadata: Metadata = {
  title: 'Tensi Harian — Pencatat Tekanan Darah Pribadi',
  description:
    'Catat tekanan darah keluarga dengan mudah. Visualisasi jelas, kategorisasi otomatis, dan bagikan ke dokter via QR Code tanpa setup rumit.',
  keywords: [
    'tekanan darah',
    'tensi',
    'aplikasi kesehatan',
    'tracker hipertensi',
    'rekam medis pribadi',
  ],
  openGraph: {
    title: 'Tensi Harian — Pencatat Tekanan Darah Pribadi',
    description:
      'Aplikasi pencatat tekanan darah pribadi keluarga Indonesia dengan visualisasi jelas dan share via QR.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tensi Harian — Pencatat Tekanan Darah Pribadi',
    description:
      'Aplikasi pencatat tekanan darah pribadi keluarga Indonesia dengan visualisasi jelas dan share via QR.',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation Top Bar */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-lg">
              Tensi Harian
            </span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-colors"
          >
            Masuk
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium mb-6 border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pencatat tekanan darah untuk keluarga Indonesia
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              Pantau tekanan darah,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                tanpa repot.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Catat hasil tensi dalam hitungan detik. Visualisasi otomatis,
              kategorisasi sesuai standar AHA, dan bagikan ke dokter via QR Code
              tanpa login atau setup bertemu.
            </p>

            {/* Trust highlights row */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <TrustPill icon={<Lock className="w-3.5 h-3.5" />} text="Data 100% milik Anda" />
              <TrustPill icon={<Stethoscope className="w-3.5 h-3.5" />} text="Standar AHA" />
              <TrustPill icon={<QrCode className="w-3.5 h-3.5" />} text="Share via QR" />
            </div>

            {/* Mobile CTA */}
            <div className="mt-8 lg:hidden flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md shadow-blue-700/20 transition-all hover:shadow-lg hover:shadow-blue-700/30 hover:-translate-y-0.5"
              >
                Mulai Gunakan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* BP Check Widget */}
          <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <BpCheckWidget />
          </div>
        </div>
      </section>

      {/* Trust Story */}
      <section className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-950/40 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Privasi itu bukan fitur, itu hak
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Data tekanan darah adalah rekam medis pribadi. Kami memperlakukannya
                seperti itu — selalu.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <TrustCard
                icon={<ShieldCheck className="w-6 h-6" />}
                title="Milik Anda sepenuhnya"
                description="Tidak di-share ke iklan, algoritma, atau pihak ketiga. Anda pemilik data."
              />
              <TrustCard
                icon={<Download className="w-6 h-6" />}
                title="Eksport kapan saja"
                description="Unduh riwayat tekanan darah dalam format Excel atau PDF untuk dibawa ke dokter."
              />
              <TrustCard
                icon={<Trash2 className="w-6 h-6" />}
                title="Hapus kapan saja"
                description="Akun dan seluruh data hilang bersih. Tidak ada retensi yang disembunyikan."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 mb-4">
                <Sparkles className="w-3 h-3" />
                Visualisasi otomatis
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Lihat tren, bukan hanya angka
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Contoh riwayat 7 hari dari pengguna nyata. Hover untuk lihat nilai,
                dengan kategori otomatis.
              </p>
            </div>

            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-16 sm:py-20 bg-blue-50/30 dark:bg-gray-900/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <PillarCard
                icon={<Heart className="w-6 h-6" />}
                title="Pencatatan mudah"
                description="Satu ketuk, dua angka. Selesai. Form input yang dirancang untuk usia 60+ tetap intuitif."
              />
              <PillarCard
                icon={<Sparkles className="w-6 h-6" />}
                title="Analitik cerdas"
                description="Tren mingguan, distribusi kategori, dan pola otomatis. Tidak perlu Excel manual lagi."
              />
              <PillarCard
                icon={<ShieldCheck className="w-6 h-6" />}
                title="Privasi penuh"
                description="Tidak ada iklan, tidak ada pelacakan. Hanya Anda — dan orang yang Anda izinkan lewat QR share."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Pertanyaan yang sering ditanyakan
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Jawaban singkat untuk hal-hal yang paling sering ditanyakan calon
                pengguna.
              </p>
            </div>
            <FaqSection />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Mulai pantau tekanan darah Anda
            </h2>
            <p className="mt-3 text-blue-50 max-w-xl mx-auto">
              Gratis untuk penggunaan pribadi. Platform ini dirancang untuk keluarga
              yang peduli dengan hipertensi.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                Mulai Gunakan
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#faq"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-800/30 hover:bg-blue-800/50 border border-white/30 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Pelajari Cara Kerja
              </a>
            </div>

            <p className="mt-8 text-xs text-blue-50 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Data Anda dilindungi dengan enkripsi Supabase, RLS row-level,
              dan security headers CSP/HSTS.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-gray-950 border-t border-blue-100 dark:border-gray-800 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <p>© Tensi Harian — Aplikasi pencatat tekanan darah.</p>
            <p>Made with care untuk keluarga Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
      <span className="text-blue-600 dark:text-blue-400">{icon}</span>
      {text}
    </div>
  )
}

function TrustCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-md">
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function PillarCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group text-center md:text-left">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4 shadow-md group-hover:scale-105 transition-transform duration-300">
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  )
}
