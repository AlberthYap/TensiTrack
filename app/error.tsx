"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log ke console; production: kirim ke Sentry/etc.
    console.error("Global error boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-aurora flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative max-w-lg w-full text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-950/50 mb-6">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>

        <p className="text-7xl md:text-8xl font-bold text-gradient-warm mb-2">
          Oops!
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
          Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah
          mencatat masalah ini.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-6 font-mono">
            Kode: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
