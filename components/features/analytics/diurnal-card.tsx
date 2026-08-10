import { Card, CardContent } from '@/components/ui/card'
import { Sun, Moon, ArrowRight, ArrowDown, Minus } from 'lucide-react'

interface DiurnalStats {
  morningAvg: { systolic: number; diastolic: number } | null
  eveningAvg: { systolic: number; diastolic: number } | null
  sysDiff: number
  diaDiff: number
  morningCount: number
  eveningCount: number
}

interface DiurnalCardProps {
  stats: DiurnalStats
}

export function DiurnalCard({ stats }: DiurnalCardProps) {
  if (!stats.morningAvg && !stats.eveningAvg) return null
  if (stats.morningCount < 2 && stats.eveningCount < 2) return null

  const renderDiff = (diff: number) => {
    if (diff === 0) return <Minus className="w-4 h-4 text-gray-400" />
    if (diff > 0) return <ArrowRight className="w-4 h-4 text-red-500 rotate-45" />
    return <ArrowDown className="w-4 h-4 text-emerald-500" />
  }

  const isWorse = stats.sysDiff >= 5 || stats.diaDiff >= 5

  return (
    <Card className="overflow-hidden border-amber-200 dark:border-amber-800">
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          ☀️ Pagi vs 🌙 Malam (30 hari)
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Morning */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Pagi (6-11)</span>
            </div>
            {stats.morningAvg ? (
              <>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {stats.morningAvg.systolic}/{stats.morningAvg.diastolic}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stats.morningCount}x pencatatan</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Belum ada data</p>
            )}
          </div>

          {/* Evening */}
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Malam (16-21)</span>
            </div>
            {stats.eveningAvg ? (
              <>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {stats.eveningAvg.systolic}/{stats.eveningAvg.diastolic}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stats.eveningCount}x pencatatan</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Belum ada data</p>
            )}
          </div>
        </div>

        {stats.morningAvg && stats.eveningAvg && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg p-2.5 text-sm ${
              isWorse
                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {renderDiff(stats.sysDiff)}
            <span>
              Malam hari naik <strong>{Math.abs(stats.sysDiff)}/{Math.abs(stats.diaDiff)} mmHg</strong>
              {isWorse ? ' — perlu diperhatikan' : ' — masih dalam batas wajar'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
