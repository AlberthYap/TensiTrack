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
        Idealnya: gunakan tensimeter digital otomatis dengan manset di{' '}
        <strong>lengan atas</strong> (gold standard PERHI/AHA — paling akurat).
Alat pergelangan tangan hanya dipakai jika alatnya sudah tervalidasi klinis;
alat jari tidak direkomendasikan, 2–3 cm di atas lipatan
        siku, di kulit langsung (bukan di atas baju tebal), dengan ukuran
        manset sesuai lingkar lengan Anda.{' '}
        <strong>Posisi:</strong> duduk dengan punggung bersandar, kaki rata
        menapak di lantai (tidak disilangkan), lengan disangga di meja setinggi
        jantung, dan tidak bicara selama pengukuran.{' '}
        <strong>Persiapan:</strong> istirahat 5 menit &amp; hindari kafein,
        rokok, atau olahraga berat 30 menit sebelumnya.{' '}
        <strong>Pengukuran:</strong> catat 2 pembacaan dengan jeda 1–2 menit, di waktu yang sama setiap hari (pagi sebelum makan/obat dan malam sebelum tidur).
        Untuk pertama kali, ukur di kedua lengan — jika beda &gt;10 mmHg,
        gunakan lengan dengan nilai lebih tinggi untuk rutinitas.
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
