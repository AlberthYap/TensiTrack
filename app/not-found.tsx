import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-aurora flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative max-w-lg w-full text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 mb-6">
          <Search className="w-10 h-10 text-white" />
        </div>

        <p className="text-7xl md:text-8xl font-bold text-gradient mb-2">
          404
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          Periksa kembali URL Anda atau kembali ke beranda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
