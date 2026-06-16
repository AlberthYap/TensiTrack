import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BloodPressureRecord } from '@/types/blood-pressure.types'
import {
  CATEGORY_LABELS,
  formatBloodPressure,
} from '@/lib/blood-pressure'
import { formatExportDate, formatExportTime } from '@/lib/export'

/**
 * Generate dan download file PDF dari daftar pencatatan.
 */
export function exportRecordsToPdf(
  records: BloodPressureRecord[],
  filename: string = 'riwayat-tekanan-darah.pdf',
  options: { title?: string; subtitle?: string } = {}
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  // Header gradient rectangle
  doc.setFillColor(59, 130, 246) // primary blue
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setFillColor(139, 92, 246) // purple
  doc.rect(pageWidth / 2, 0, pageWidth / 2, 28, 'F')

  // Brand text
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Tensi Harian', 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Riwayat Tekanan Darah', 14, 20)
  const now = new Date()
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  doc.text(`Digenerate: ${dateStr}`, pageWidth - 14, 20, {
    align: 'right',
  })

  // Title
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(options.title || 'Riwayat Pencatatan', 14, 40)

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(options.subtitle, 14, 46)
  }

  // Build table
  const tableData = records.map((r, i) => [
    String(i + 1),
    formatExportDate(r.measured_at),
    formatExportTime(r.measured_at),
    formatBloodPressure(r.systolic, r.diastolic),
    r.pulse?.toString() ?? '-',
    CATEGORY_LABELS[r.category] ?? r.category,
    r.notes ?? '-',
  ])

  autoTable(doc, {
    startY: options.subtitle ? 52 : 48,
    head: [
      ['No', 'Tanggal', 'Waktu', 'TD (mmHg)', 'Nadi (bpm)', 'Kategori', 'Catatan'],
    ],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 28 },
      6: { halign: 'left', cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Halaman ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      )
      doc.text(
        'Tensi Harian - Aplikasi Pencatat Tekanan Darah',
        14,
        pageHeight - 8
      )
    },
    margin: { top: 10, left: 14, right: 14, bottom: 14 },
  })

  doc.save(filename)
}
