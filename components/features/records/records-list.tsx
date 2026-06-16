'use client'

import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { formatBloodPressure, getCategoryInfo } from '@/lib/blood-pressure'
import { formatDate, formatTime } from '@/lib/date'
import {
  buildExportFilename,
  EXCEL_COLUMN_WIDTHS,
  EXPORT_SHEET_NAME,
} from '@/lib/export'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { deleteBloodPressureRecord } from '@/app/actions/blood-pressure'
import * as XLSX from 'xlsx'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [exporting, setExporting] = useState(false)

  // Local state untuk input tanggal (komitmen via tombol Terapkan)
  const [startDateInput, setStartDateInput] = useState(startDate)
  const [endDateInput, setEndDateInput] = useState(endDate)

  // Bangun URL dengan parameter yang diperbarui dan navigasi (server-side)
  const navigate = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === undefined) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })
      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      startTransition(() => {
        router.push(url)
      })
    },
    [pathname, router, searchParams]
  )

  const goToPage = (nextPage: number) => {
    navigate({ page: nextPage })
  }

  const setPageSizeAndNavigate = (nextSize: number) => {
    navigate({ pageSize: nextSize, page: 1 })
  }

  const applyDateFilter = () => {
    navigate({ startDate: startDateInput || null, endDate: endDateInput || null, page: 1 })
  }

  const handleResetFilter = () => {
    setStartDateInput('')
    setEndDateInput('')
    navigate({ startDate: null, endDate: null, page: 1 })
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteBloodPressureRecord(id)
      if (result.error) {
        alert('Gagal menghapus data: ' + result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus data')
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(null)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      // Tentukan endpoint export berdasarkan mode
      const exportUrl = readOnly
        ? `/api/share/${basePath.split('/').filter(Boolean).pop()}/export`
        : '/api/records/export'

      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`${exportUrl}?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        alert('Gagal mengambil data untuk diekspor')
        return
      }

      const result = await response.json()
      const rows = result.data || []

      if (rows.length === 0) {
        alert('Tidak ada data untuk diekspor')
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(rows)
      worksheet['!cols'] = EXCEL_COLUMN_WIDTHS

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME)

      const fileName = buildExportFilename(startDate, endDate)

      XLSX.writeFile(workbook, fileName)
    } catch (err) {
      alert('Terjadi kesalahan saat mengekspor data')
    } finally {
      setExporting(false)
    }
  }

  // Empty state awal (belum ada data sama sekali)
  if (total === 0 && !startDate && !endDate) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Belum ada data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {readOnly ? 'Tidak ada data untuk ditampilkan' : 'Mulai catat tekanan darah Anda hari ini'}
          </p>
          {!readOnly && (
            <Link href="/records/new">
              <Button>Tambah Data Pertama</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  const isFilterActive = Boolean(startDate || endDate)
  const startIndex = total > 0 ? (page - 1) * pageSize + 1 : 0
  const endIndex = Math.min(page * pageSize, total)

  return (
    <div className="space-y-4">
      {/* Filter & Export Bar */}
      {!readOnly && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Filter className="w-4 h-4" />
                <span>Filter & Ekspor</span>
                {isPending && (
                  <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin text-gray-400" />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:items-end">
                <div className="space-y-1.5 lg:col-span-1">
                  <Label htmlFor="startDate" className="text-xs text-gray-600 dark:text-gray-400">
                    Dari Tanggal
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDateInput}
                    max={endDateInput || undefined}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="h-9 w-full"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                  <Label htmlFor="endDate" className="text-xs text-gray-600 dark:text-gray-400">
                    Sampai Tanggal
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDateInput}
                    min={startDateInput || undefined}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="h-9 w-full"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                  <Label htmlFor="pageSize" className="text-xs text-gray-600 dark:text-gray-400">
                    Tampilkan
                  </Label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => setPageSizeAndNavigate(Number(e.target.value))}
                    disabled={isPending}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} per halaman
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 lg:col-span-1 flex-wrap">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={applyDateFilter}
                    disabled={isPending}
                    className="h-9"
                  >
                    Terapkan
                  </Button>
                  {isFilterActive && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilter}
                      disabled={isPending}
                      className="h-9"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={exporting || total === 0}
                    className="h-9"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Excel
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{total === 0 ? 0 : `${startIndex}-${endIndex}`}</span> dari <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span> data
                {isFilterActive && total > 0 && (
                  <span className="ml-1">
                    (filter: {startDate ? formatDate(startDate, 'dd MMM yyyy') : '...'}
                    {' - '}
                    {endDate ? formatDate(endDate, 'dd MMM yyyy') : '...'})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baris kontrol pagination untuk mode read-only (share) */}
      {readOnly && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Menampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSizeAndNavigate(Number(e.target.value))}
                  disabled={isPending}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span>per halaman</span>
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span> pencatatan
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state ketika filter menghasilkan 0 data */}
      {total === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tidak ada data pada rentang tanggal ini
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Coba ubah filter tanggal atau reset untuk melihat semua data
            </p>
            {!readOnly && (
              <Button variant="outline" onClick={handleResetFilter}>
                <X className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tanggal & Waktu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tekanan Darah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Denyut Nadi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Catatan
                        </th>
                        {!readOnly && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Aksi
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {records.map((record) => {
                        const categoryInfo = getCategoryInfo(record.category)
                        return (
                          <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(record.measured_at)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTime(record.measured_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatBloodPressure(record.systolic, record.diastolic)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                mmHg
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.pulse ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {record.pulse}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    bpm
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`${categoryInfo.bgColor} ${categoryInfo.color} border-0`}>
                                {categoryInfo.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {record.notes ? (
                                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                  {record.notes}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </td>
                            {!readOnly && (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <Link href={`/records/${record.id}/edit`}>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                  {showDeleteConfirm === record.id ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(record.id)}
                                        disabled={deletingId === record.id}
                                      >
                                        {deletingId === record.id ? 'Menghapus...' : 'Yakin'}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeleteConfirm(null)}
                                        disabled={deletingId === record.id}
                                      >
                                        Batal
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowDeleteConfirm(record.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {records.map((record) => {
              const categoryInfo = getCategoryInfo(record.category)
              return (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(record.measured_at)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(record.measured_at)}
                        </div>
                      </div>
                      <Badge className={`${categoryInfo.bgColor} ${categoryInfo.color} border-0`}>
                        {categoryInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Tekanan Darah
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatBloodPressure(record.systolic, record.diastolic)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">mmHg</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Denyut Nadi
                        </div>
                        {record.pulse ? (
                          <>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {record.pulse}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">bpm</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500">-</div>
                        )}
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <StickyNote className="w-3 h-3" />
                          Catatan
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {record.notes}
                        </div>
                      </div>
                    )}

                    {!readOnly && (
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Link href={`/records/${record.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        {showDeleteConfirm === record.id ? (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              disabled={deletingId === record.id}
                              className="flex-1"
                            >
                              {deletingId === record.id ? 'Menghapus...' : 'Yakin Hapus'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(null)}
                              disabled={deletingId === record.id}
                            >
                              Batal
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(record.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Halaman <span className="font-medium text-gray-900 dark:text-white">{page}</span> dari <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-1 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={page === 1 || isPending}
                  className="h-8 w-8 p-0"
                  aria-label="Halaman pertama"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || isPending}
                  className="h-8 w-8 p-0"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers(page, totalPages).map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-400 text-sm select-none"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(p)}
                      disabled={isPending}
                      className="h-8 min-w-8 px-2.5"
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages || isPending}
                  className="h-8 w-8 p-0"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={page === totalPages || isPending}
                  className="h-8 w-8 p-0"
                  aria-label="Halaman terakhir"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  const maxVisible = 5

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)

  if (left > 2) pages.push('ellipsis')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('ellipsis')

  pages.push(total)
  return pages
}
