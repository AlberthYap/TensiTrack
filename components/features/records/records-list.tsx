'use client'

import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { formatBloodPressure } from '@/lib/blood-pressure'
import { formatDate, formatTime } from '@/lib/date'
import {
  buildExportFilename,
  EXCEL_COLUMN_WIDTHS,
  EXPORT_SHEET_NAME,
} from '@/lib/export'
import { CategoryBadge, CategoryDot } from '@/components/ui/category-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Edit,
  Trash2,
  Activity,
  Clock,
  Heart,
  StickyNote,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileText,
  Eye,
  FileDown,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { deleteBloodPressureRecord } from '@/app/actions/blood-pressure'
import * as XLSX from 'xlsx'
import { exportRecordsToPdf } from '@/lib/pdf-export'
import { EmptyState } from '@/components/ui/empty-state'

interface RecordsListProps {
  records: BloodPressureRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  startDate: string
  endDate: string
  basePath: string
  readOnly?: boolean
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const

export function RecordsList({
  records,
  total,
  page,
  pageSize,
  totalPages,
  startDate,
  endDate,
  basePath,
  readOnly = false,
}: RecordsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showExportMenu, setShowExportMenu] = useState(false)

  const navigate = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleResetFilter = () => {
    navigate({ startDate: '', endDate: '', page: 1 })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteBloodPressureRecord(id)
      if (result.error) {
        alert('Gagal menghapus: ' + result.error)
      }
      setShowDeleteConfirm(null)
      router.refresh()
    })
  }

  const handleExportExcel = async () => {
    const { mapToExportRow, EXPORT_HEADERS } = await import('@/lib/export')
    const data = records.map((r, i) => mapToExportRow(r, i))
    const ws = XLSX.utils.json_to_sheet(data, { header: EXPORT_HEADERS })
    ws['!cols'] = EXCEL_COLUMN_WIDTHS
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, EXPORT_SHEET_NAME)
    const fileName = buildExportFilename(startDate, endDate)
    XLSX.writeFile(wb, fileName)
    setShowExportMenu(false)
  }

  const handleExportPdf = () => {
    const fileName = buildExportFilename(startDate, endDate).replace('.xlsx', '.pdf')
    const subtitle =
      startDate || endDate
        ? `Periode: ${startDate || '...'} s/d ${endDate || '...'}`
        : undefined
    exportRecordsToPdf(records, fileName, {
      title: 'Riwayat Tekanan Darah',
      subtitle,
    })
    setShowExportMenu(false)
  }

  const isFilterActive = startDate || endDate

  if (total === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Activity}
            gradient="cool"
            title={isFilterActive ? 'Tidak Ada Hasil' : 'Belum Ada Pencatatan'}
            description={
              isFilterActive
                ? 'Coba ubah filter tanggal untuk melihat data lainnya.'
                : 'Mulai catat tekanan darah pertama Anda untuk melihat riwayat di sini.'
            }
            action={
              !isFilterActive && !readOnly ? (
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/records/new">Catat Sekarang</Link>
                </Button>
              ) : isFilterActive ? (
                <Button onClick={handleResetFilter} variant="outline">
                  Reset Filter
                </Button>
              ) : null
            }
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      {!readOnly && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5 lg:col-span-1">
                <Label htmlFor="startDate" className="text-xs">
                  Dari Tanggal
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => navigate({ startDate: e.target.value, page: 1 })}
                />
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <Label htmlFor="endDate" className="text-xs">
                  Sampai Tanggal
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => navigate({ endDate: e.target.value, page: 1 })}
                />
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <Label htmlFor="pageSize" className="text-xs">
                  Per Halaman
                </Label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => navigate({ pageSize: e.target.value, page: 1 })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2 lg:col-span-1 flex-wrap">
                {isFilterActive && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilter}
                    size="sm"
                    className="flex-1"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                )}
                <div className="relative flex-1 min-w-[120px]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-full"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export
                  </Button>
                  {showExportMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20 overflow-hidden animate-scale-in">
                        <button
                          onClick={handleExportExcel}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium">Excel (.xlsx)</p>
                            <p className="text-xs text-gray-500">Microsoft Excel</p>
                          </div>
                        </button>
                        <button
                          onClick={handleExportPdf}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 transition-colors"
                        >
                          <FileDown className="w-4 h-4 text-red-600" />
                          <div>
                            <p className="font-medium">PDF (.pdf)</p>
                            <p className="text-xs text-gray-500">Cetak / kirim</p>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-only export */}
      {readOnly && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={pageSize}
                onChange={(e) => navigate({ pageSize: e.target.value, page: 1 })}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} / hal
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {records.length}
          </span>{' '}
          dari <span className="font-semibold">{total}</span> pencatatan
          {isFilterActive && (
            <span className="ml-2 text-xs text-gray-400">
              (filter aktif)
            </span>
          )}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Tekanan Darah
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Nadi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Catatan
                    </th>
                    {!readOnly && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(record.measured_at)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTime(record.measured_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/records/${record.id}`}
                          className="font-bold text-lg text-gradient hover:opacity-80 transition-opacity"
                        >
                          {formatBloodPressure(record.systolic, record.diastolic)}
                        </Link>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          mmHg
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {record.pulse ? (
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <Heart className="w-3.5 h-3.5" />
                            <span className="font-medium">{record.pulse}</span>
                            <span className="text-xs">bpm</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CategoryBadge category={record.category} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[200px]">
                        {record.notes ? (
                          <div className="flex items-start gap-1">
                            <StickyNote className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span className="line-clamp-2">{record.notes}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8"
                            >
                              <Link href={`/records/${record.id}`} title="Lihat detail">
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8"
                            >
                              <Link
                                href={`/records/${record.id}/edit`}
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            {showDeleteConfirm === record.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(record.id)}
                                  disabled={isPending}
                                  className="h-8"
                                >
                                  {isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Hapus'
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="h-8"
                                >
                                  Batal
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowDeleteConfirm(record.id)}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {records.map((record) => (
          <Card key={record.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    href={`/records/${record.id}`}
                    className="text-2xl font-bold text-gradient"
                  >
                    {formatBloodPressure(record.systolic, record.diastolic)}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(record.measured_at)} • {formatTime(record.measured_at)}
                  </p>
                </div>
                <CategoryBadge category={record.category} size="sm" />
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-3">
                {record.pulse && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-purple-500" />
                    {record.pulse} bpm
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CategoryDot category={record.category} />
                  Tekanan darah
                </span>
              </div>

              {record.notes && (
                <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-3 line-clamp-2">
                  &ldquo;{record.notes}&rdquo;
                </p>
              )}

              {!readOnly && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/records/${record.id}`}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/records/${record.id}/edit`}>
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  {showDeleteConfirm === record.id ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      disabled={isPending}
                    >
                      Konfirmasi
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(record.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center sm:justify-end gap-1 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ page: 1 })}
            disabled={page === 1}
            className="h-9 w-9"
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ page: page - 1 })}
            disabled={page === 1}
            className="h-9 w-9"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {getPageNumbers(page, totalPages).map((p, idx) =>
            p === 'ellipsis' ? (
              <span
                key={`e-${idx}`}
                className="px-2 text-gray-400 text-sm select-none"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate({ page: p })}
                className={`h-9 min-w-9 ${
                  p === page
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : ''
                }`}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ page: page + 1 })}
            disabled={page === totalPages}
            className="h-9 w-9"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ page: totalPages })}
            disabled={page === totalPages}
            className="h-9 w-9"
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)

  return pages
}
