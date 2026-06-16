'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Eye,
  Calendar,
  X,
  QrCode,
  Loader2,
  Power,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import {
  generateShareToken,
  getShareTokens,
  revokeShareToken,
  deleteShareToken,
} from '@/app/actions/share'
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
  const [showQrFor, setShowQrFor] = useState<string | null>(null)

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
    setShowQrFor(null)
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
      setShowQrFor(result.token)
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
              Bagikan Data Tekanan Darah
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Generate New Link */}
          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              Buat Link Baru
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires" className="text-xs">
                  Kadaluarsa (hari)
                </Label>
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
                <Label htmlFor="maxViews" className="text-xs">
                  Maksimal Views
                </Label>
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
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Buat Link Share
                </>
              )}
            </Button>

            {lastGeneratedUrl && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-green-200 dark:border-green-900 space-y-3 animate-fade-in-up">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Link berhasil dibuat!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Salin dan bagikan ke dokter atau keluarga Anda.
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

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-green-200 dark:border-green-900">
                  <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    QR Code untuk scan
                  </p>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={lastGeneratedUrl}
                      size={140}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
              Link Aktif ({shareTokens.length})
            </h3>

            {shareTokens.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                Belum ada link share. Buat link baru di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {shareTokens.map((token) => {
                  const url = `${window.location.origin}/share/${token.token}`
                  const isExpired =
                    token.expires_at && new Date(token.expires_at) < new Date()
                  const isMaxViews =
                    token.max_views && token.view_count >= token.max_views
                  const isInactive = isExpired || isMaxViews || !token.is_active

                  return (
                    <div
                      key={token.id}
                      className={`p-4 rounded-xl border space-y-3 transition-all ${
                        isInactive
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 opacity-75'
                          : 'border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Dibuat {formatRelativeTime(token.created_at)}
                            </span>
                            {isInactive && (
                              <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full font-semibold">
                                Tidak Aktif
                              </span>
                            )}
                            {!isInactive && (
                              <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Aktif
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span className="font-semibold">
                                {token.view_count}
                              </span>
                              {token.max_views && (
                                <span className="text-gray-400">
                                  {' '}
                                  / {token.max_views}
                                </span>
                              )}
                              <span className="text-gray-400">views</span>
                            </span>

                            {token.expires_at && (
                              <>
                                <span className="mx-1 text-gray-300">•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(token.expires_at)}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="mt-2">
                            <Input
                              value={url}
                              readOnly
                              className="text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(token.token)}
                          className="flex-1 min-w-[100px]"
                        >
                          {copiedToken === token.token ? (
                            <>
                              <Check className="w-3 h-3 mr-1.5" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1.5" />
                              Salin
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowQrFor(showQrFor === token.id ? null : token.id)
                          }
                          title="Tampilkan QR"
                        >
                          <QrCode className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                          title="Buka di tab baru"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        {token.is_active && !isExpired && !isMaxViews && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(token.id)}
                            title="Nonaktifkan"
                            className="hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950"
                          >
                            <Power className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(token.id)}
                          title="Hapus"
                          className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {showQrFor === token.id && (
                        <div className="flex flex-col items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 animate-fade-in-up">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <QrCode className="w-3 h-3" />
                            Scan untuk membuka link
                          </p>
                          <div className="p-2.5 bg-white rounded-lg shadow-sm">
                            <QRCodeSVG
                              value={url}
                              size={120}
                              level="M"
                              includeMargin={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Catatan:</strong> Link share memungkinkan orang lain
              melihat semua data tekanan darah Anda tanpa perlu login.
              Pastikan hanya membagikan link ini kepada orang yang Anda
              percaya.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
