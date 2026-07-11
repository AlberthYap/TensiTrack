'use client'

import { useState } from 'react'
import { Activity, RotateCcw, Info } from 'lucide-react'
import {
  calculateCategory,
  getCategoryInfo,
  formatBloodPressure,
} from '@/lib/blood-pressure'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function BpCheckWidget() {
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')

  const sys = parseInt(systolic)
  const dia = parseInt(diastolic)
  const valid =
    !isNaN(sys) &&
    !isNaN(dia) &&
    sys >= 50 &&
    sys <= 250 &&
    dia >= 30 &&
    dia <= 150

  const category = valid ? calculateCategory(sys, dia) : null
  const info = category ? getCategoryInfo(category) : null

  function reset() {
    setSystolic('')
    setDiastolic('')
    setPulse('')
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-lg shadow-blue-900/5 border border-blue-100 dark:border-blue-900/40 p-6 sm:p-8 overflow-hidden">
      {/* Decorative background blob */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-full blur-2xl opacity-70 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Cek tekanan darah sekarang
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Masukkan angka dari alat tensi Anda — klasifikasi otomatis.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="bp-sys" className="text-xs font-medium">
              Sistolik
            </Label>
            <Input
              id="bp-sys"
              type="number"
              inputMode="numeric"
              placeholder="120"
              min={50}
              max={250}
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              className="mt-1 text-lg font-mono"
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">mmHg, “atas”</p>
          </div>
          <div>
            <Label htmlFor="bp-dia" className="text-xs font-medium">
              Diastolik
            </Label>
            <Input
              id="bp-dia"
              type="number"
              inputMode="numeric"
              placeholder="80"
              min={30}
              max={150}
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              className="mt-1 text-lg font-mono"
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">mmHg, “bawah”</p>
          </div>
        </div>

        <div className="mt-3">
          <Label htmlFor="bp-pulse" className="text-xs font-medium">
            Denyut nadi <span className="text-blue-600 dark:text-blue-400 font-normal">(opsional)</span>
          </Label>
          <Input
            id="bp-pulse"
            type="number"
            inputMode="numeric"
            placeholder="72"
            min={30}
            max={200}
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            className="mt-1 font-mono"
          />
        </div>

        {/* Result */}
        <div
          className={cn(
            'mt-6 rounded-2xl border transition-all duration-300 overflow-hidden',
            valid
              ? 'border-transparent bg-gradient-to-br from-blue-50 via-white to-blue-50/40 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-950/10 shadow-inner'
              : 'border-dashed border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-gray-900/40'
          )}
        >
          {valid && category && info ? (
            <div className="p-5 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                    {formatBloodPressure(sys, dia)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    mmHg
                  </span>
                </div>
                <CategoryBadge category={category} size="md" />
              </div>
              {pulse && Number.isFinite(parseInt(pulse)) && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nadi: <span className="font-mono">{parseInt(pulse)}</span> bpm
                </p>
              )}
              <p
                className={cn(
                  'mt-3 text-sm leading-relaxed',
                  info.textColor
                )}
              >
                {info.description}
              </p>
              <details className="mt-3 group">
                <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 select-none list-none [&::-webkit-details-marker]:hidden">
                  <Info className="w-3 h-3" />
                  Rekomendasi lengkap
                </summary>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-blue-100 dark:border-blue-900/40">
                  {info.recommendation}
                </p>
              </details>
            </div>
          ) : (
            <div className="p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Masukkan sistolik &amp; diastolik untuk melihat klasifikasi
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Contoh sistolik 50-250, diastolik 30-150
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <span className="font-semibold">Disclaimer:</span> Ini hanya
            klasifikasi otomatis, bukan diagnosis medis.
          </p>
          {(systolic || diastolic || pulse) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-gray-500 hover:text-blue-700"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
