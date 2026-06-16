'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download, Loader2 } from 'lucide-react'
import { CsvImportResult, parseCsvImport } from '@/lib/csv-import'
import { addBloodPressureRecord } from '@/app/actions/blood-pressure'
import { CATEGORY_LABELS, calculateCategory } from '@/lib/blood-pressure'
import { CategoryBadge } from '@/components/ui/category-badge'

interface CsvImportDialogProps {
  trigger?: React.ReactNode
}

export function CsvImportDialog({ trigger }: CsvImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [parseResult, setParseResult] = useState<CsvImportResult | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFilename(file.name)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseCsvImport(text)
      setParseResult(result)
    }
    reader.readAsText(file)
  }

  function handleClose() {
    setIsOpen(false)
    setParseResult(null)
    setFilename('')
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleImport() {
    if (!parseResult || parseResult.validRows.length === 0) return
    setIsImporting(true)
    let success = 0
    let failed = 0

    for (const row of parseResult.validRows) {
      try {
        const formData = new FormData()
        formData.append('systolic', String(row.systolic))
        formData.append('diastolic', String(row.diastolic))
        if (row.pulse !== null) formData.append('pulse', String(row.pulse))
        formData.append('measured_at', row.measured_at)
        if (row.notes) formData.append('notes', row.notes)
        const result = await addBloodPressureRecord(formData)
        if (result.error) {
          failed++
        } else {
          success++
        }
      } catch {
        failed++
      }
    }

    setImportResult({ success, failed })
    setIsImporting(false)
  }

  function downloadTemplate() {
    const csv =
      'sistolik,diastolik,nadi,tanggal,catatan\n' +
      '120,80,72,2024-01-15,Pagi setelah sarapan\n' +
      '130,85,75,2024-01-15,Malam sebelum tidur\n' +
      '118,78,68,2024-01-16,\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) {
    return (
      <>
        {trigger ?? (
          <Button onClick={() => setIsOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
        )}
      </>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
              Import Data dari CSV
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Step 1: Upload */}
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Format CSV
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Header wajib: <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs">sistolik,diastolik,tanggal</code>.
                  Opsional: <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs">nadi,catatan</code>.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Template
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white file:cursor-pointer file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>

          {/* Step 2: Preview */}
          {parseResult && (
            <div className="space-y-3">
              {filename && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  File: <span className="font-medium">{filename}</span>
                </p>
              )}

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Baris
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseResult.totalRows}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Valid
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {parseResult.validRows.length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Error
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {parseResult.errors.length}
                  </p>
                </div>
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {parseResult.errors.length} baris error (akan dilewati):
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 list-disc pl-5">
                    {parseResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err.message}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li className="italic">
                        ...dan {parseResult.errors.length - 5} error lainnya
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview valid rows */}
              {parseResult.validRows.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-800">
                    Preview ({Math.min(5, parseResult.validRows.length)} dari {parseResult.validRows.length} baris)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Sistolik</th>
                          <th className="px-3 py-2 text-left">Diastolik</th>
                          <th className="px-3 py-2 text-left">Nadi</th>
                          <th className="px-3 py-2 text-left">Tanggal</th>
                          <th className="px-3 py-2 text-left">Kategori</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.validRows.slice(0, 5).map((row, i) => {
                          const cat = calculateCategory(row.systolic, row.diastolic)
                          return (
                            <tr
                              key={i}
                              className="border-t border-gray-100 dark:border-gray-800"
                            >
                              <td className="px-3 py-1.5 font-mono">{row.systolic}</td>
                              <td className="px-3 py-1.5 font-mono">{row.diastolic}</td>
                              <td className="px-3 py-1.5 font-mono">{row.pulse ?? '-'}</td>
                              <td className="px-3 py-1.5">
                                {new Date(row.measured_at).toLocaleString('id-ID', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>
                              <td className="px-3 py-1.5">
                                <CategoryBadge category={cat} size="sm" />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Import selesai
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {importResult.success} berhasil, {importResult.failed} gagal
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? 'Selesai' : 'Batal'}
            </Button>
            {parseResult && parseResult.validRows.length > 0 && !importResult && (
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {parseResult.validRows.length} Baris
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
