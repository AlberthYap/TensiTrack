'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Share2, Copy, Check, ExternalLink, Trash2, Eye, Calendar, X } from 'lucide-react'
import { generateShareToken, getShareTokens, revokeShareToken, deleteShareToken } from '@/app/actions/share'
import { ShareToken } from '@/types/share.types'
import { formatDate, formatRelativeTime } from '@/lib/date'

export function ShareDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [expiresInDays, setExpiresInDays] = useState<string>('7')
  const [maxViews, setMaxViews] = useState<string>('')
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null)

  const loadTokens = async () => {
    const { data } = await getShareTokens()
    setShareTokens(data)
  }

  const handleOpen = async () => {
    setIsOpen(true)
    await loadTokens()
  }

  const handleClose = () => {
    setIsOpen(false)
    setLastGeneratedUrl(null)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    const expires = expiresInDays ? parseInt(expiresInDays) : null
    const max = maxViews ? parseInt(maxViews) : null
    
    const result = await generateShareToken(expires, max)

    if (result.error) {
      alert('Gagal membuat link: ' + result.error)
      setLastGeneratedUrl(null)
    } else if (result.token) {
      const newUrl = `${window.location.origin}/share/${result.token}`
      setLastGeneratedUrl(newUrl)
      await loadTokens()
      setExpiresInDays('7')
      setMaxViews('')
    } else {
      setLastGeneratedUrl(null)
    }
    setIsGenerating(false)
  }

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleRevoke = async (tokenId: string) => {
    if (confirm('Yakin ingin menonaktifkan link ini?')) {
      await revokeShareToken(tokenId)
      await loadTokens()
    }
  }

  const handleDelete = async (tokenId: string) => {
    if (confirm('Yakin ingin menghapus link ini?')) {
      await deleteShareToken(tokenId)
      await loadTokens()
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={handleOpen} variant="outline">
        <Share2 className="w-4 h-4 mr-2" />
        Bagikan Data
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Bagikan Data Tekanan Darah
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate New Link */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Buat Link Baru
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires">Kadaluarsa (hari)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="7"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kosongkan untuk tidak ada batas waktu
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxViews">Maksimal Views</Label>
                <Input
                  id="maxViews"
                  type="number"
                  min="1"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Tidak terbatas"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kosongkan untuk tidak ada batas
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Membuat...' : 'Buat Link Share'}
            </Button>

            {lastGeneratedUrl && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Link berhasil dibuat! Salin dan bagikan ke dokter atau keluarga:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={lastGeneratedUrl}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(lastGeneratedUrl)
                      setCopiedToken('last')
                      setTimeout(() => setCopiedToken(null), 2000)
                    }}
                  >
                    {copiedToken === 'last' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Link Aktif ({shareTokens.length})
            </h3>

            {shareTokens.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                Belum ada link share. Buat link baru di atas.
              </p>
            ) : (
              <div className="space-y-3">
                {shareTokens.map((token) => {
                  const url = `${window.location.origin}/share/${token.token}`
                  const isExpired = token.expires_at && new Date(token.expires_at) < new Date()
                  const isMaxViews = token.max_views && token.view_count >= token.max_views

                  return (
                    <div
                      key={token.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Dibuat {formatRelativeTime(token.created_at)}
                            </span>
                            {(isExpired || isMaxViews) && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded">
                                Tidak Aktif
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <Eye className="w-3 h-3" />
                            <span>{token.view_count} views</span>
                            {token.max_views && <span>/ {token.max_views} max</span>}
                            
                            {token.expires_at && (
                              <>
                                <span className="mx-1">•</span>
                                <Calendar className="w-3 h-3" />
                                <span>Sampai {formatDate(token.expires_at)}</span>
                              </>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              value={url}
                              readOnly
                              className="text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(token.token)}
                          className="flex-1"
                        >
                          {copiedToken === token.token ? (
                            <>
                              <Check className="w-3 h-3 mr-2" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-2" />
                              Salin Link
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(token.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Catatan:</strong> Link share memungkinkan orang lain melihat semua data tekanan darah Anda 
              tanpa perlu login. Pastikan hanya membagikan link ini kepada orang yang Anda percaya.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
