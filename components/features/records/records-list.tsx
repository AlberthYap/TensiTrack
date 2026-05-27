'use client'

import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { formatBloodPressure, getCategoryInfo } from '@/lib/blood-pressure'
import { formatDate, formatTime } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Trash2, Activity, Clock, Heart, StickyNote } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { deleteBloodPressureRecord } from '@/app/actions/blood-pressure'
import { useRouter } from 'next/navigation'

interface RecordsListProps {
  records: BloodPressureRecord[]
}

export function RecordsList({ records }: RecordsListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Belum ada data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Mulai catat tekanan darah Anda hari ini
          </p>
          <Link href="/records/new">
            <Button>Tambah Data Pertama</Button>
          </Link>
        </CardContent>
      </Card>
    )
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

  return (
    <div className="space-y-4">
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aksi
                    </th>
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
      <div className="md:hidden space-y-4">
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
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
