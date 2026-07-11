'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: 'Berapa tekanan darah yang dianggap normal?',
    a: (
      <>
        Menurut pedoman AHA, tekanan darah orang dewasa dianggap{' '}
        <strong>normal</strong> bila sistolik &lt; 120 mmHg DAN diastolik &lt; 80
        mmHg. Kategori &ldquo;Meningkat&rdquo; untuk sistolik 120-129 dengan
        diastolik&lt;80. Hipertensi tahap 1 untuk sistolik 130-139 atau
        diastolik 80-89.
      </>
    ),
  },
  {
    q: 'Kapan saya perlu ke dokter?',
    a: (
      <>
        Segera konsultasi dokter jika pembacaan konsisten di{' '}
        <strong>≥140/90 mmHg</strong> (Hipertensi Tahap 2), atau jika muncul
        gejala: sakit kepala hebat, nyeri dada, sesak napas, gangguan
        penglihatan, atau kelemahan anggota tubuh. Aplikasi membantu memantau
        tren — bukan menggantikan diagnosis medis.
      </>
    ),
  },
  {
    q: 'Bagaimana cara mencatat tekanan darah dengan benar?',
    a: (
      <>
        Idealnya: istirahat 5 menit sebelum mengukur, posisi duduk tegak, lengan
        disangga setinggi jantung, ukuran cuff sesuai lengan, dan catat 2
        pembacaan dengan jeda 1 menit. Catat sistolik, diastolik, denyut nadi,
        dan waktu pengukuran untuk akurasi analisis.
      </>
    ),
  },
  {
    q: 'Apakah data saya aman?',
    a: (
      <>
        Ya. Data disimpan di Postgres dengan Row-Level Security: hanya Anda
        yang bisa membaca catatan Anda sendiri. Enkripsi TLS saat transit,
        security headers CSP/HSTS, dan tidak ada iklan atau pelacakan pihak
        ketiga. Anda bisa eksport atau hapus akun kapan saja.
      </>
    ),
  },
  {
    q: 'Bagaimana cara berbagi data dengan dokter?',
    a: (
      <>
        Buat link <strong>Share</strong> dari halaman Riwayat. Pilih masa
        berlaku (mis. 7 hari) dan batas views (mis. 5 kali). Tunjukkan QR
        Code ke dokter atau klik &ldquo;Salin tautan&rdquo; dan kirim via
        WhatsApp. Dokter membuka link tanpa login, langsung melihat data
        tanpa terpapar data lain.
      </>
    ),
  },
] as const

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div id="faq" className="space-y-3">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            className={cn(
              'rounded-2xl border transition-all duration-200 overflow-hidden',
              isOpen
                ? 'bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700 shadow-md'
                : 'bg-white dark:bg-gray-900 border-blue-100 dark:border-blue-900/40 hover:border-blue-200 dark:hover:border-blue-800'
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 cursor-pointer"
            >
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                {faq.q}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-blue-400 transition-transform duration-300 flex-shrink-0',
                  isOpen && 'transform rotate-180 text-blue-700 dark:text-blue-300'
                )}
              />
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-out',
                isOpen
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
