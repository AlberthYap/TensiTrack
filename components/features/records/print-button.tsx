'use client'

export function PrintButton() {
  return (
    <div className="no-print mb-4">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        onClick={() => window.print()}
      >
        🖨️ Cetak Halaman Ini
      </button>
    </div>
  )
}
