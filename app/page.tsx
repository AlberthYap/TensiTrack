import Link from 'next/link'
import { Activity } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Activity className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Hero Section */}
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Tensi Harian
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Pantau tekanan darah Anda dengan mudah dan praktis
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Masuk
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Tracking Mudah
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Catat tekanan darah Anda dalam hitungan detik
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Visualisasi Jelas
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Lihat trend dan pola tekanan darah Anda
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Aman & Privat
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Data kesehatan Anda tersimpan dengan aman
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 p-8 bg-blue-50 dark:bg-gray-800 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Kenapa Monitoring Tekanan Darah Penting?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Monitoring tekanan darah secara rutin membantu Anda mendeteksi dini masalah kesehatan,
              memantau efektivitas pengobatan, dan membuat keputusan yang lebih baik untuk kesehatan jantung Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
