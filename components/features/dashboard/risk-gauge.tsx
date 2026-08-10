import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RiskGaugeProps {
  score: number       // -3 to +4
  trendLabel: string  // "membaik" / "memburuk" / "stabil"
  categoryLabel: string
  streak: number
}

const LEVELS = [
  { min: 3, max: 99, label: 'Risiko Rendah', color: 'emerald', emoji: '🟢', desc: 'Jaga terus pola hidup sehat Anda!' },
  { min: 1, max: 2, label: 'Risiko Moderat', color: 'amber', emoji: '🟡', desc: 'Beberapa faktor perlu perhatian ringan.' },
  { min: -1, max: 0, label: 'Risiko Meningkat', color: 'orange', emoji: '🟠', desc: 'Konsultasikan dengan dokter untuk evaluasi.' },
  { min: -99, max: -2, label: 'Risiko Tinggi', color: 'red', emoji: '🔴', desc: 'Segera konsultasikan dengan dokter Anda.' },
]

export function RiskGauge({ score, trendLabel, categoryLabel, streak }: RiskGaugeProps) {
  const level = LEVELS.find((l) => score >= l.min && score <= l.max) || LEVELS[2]

  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  }

  const iconMap: Record<string, React.ReactNode> = {
    emerald: <Shield className="w-5 h-5 text-emerald-600" />,
    amber: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    orange: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    red: <AlertTriangle className="w-5 h-5 text-red-600" />,
  }

  // Gauge bar: map -3..+4 to 0..100%
  const pct = Math.max(0, Math.min(100, ((score + 3) / 7) * 100))
  const barColor =
    pct >= 70 ? 'bg-emerald-500' :
    pct >= 43 ? 'bg-amber-500' :
    pct >= 29 ? 'bg-orange-500' :
    'bg-red-500'

  return (
    <Card className={`overflow-hidden border ${bgMap[level.color]}`}>
      <div className={`h-1 bg-gradient-to-r ${level.color === 'emerald' ? 'from-emerald-400 to-teal-500' : level.color === 'amber' ? 'from-amber-400 to-yellow-500' : level.color === 'orange' ? 'from-orange-400 to-red-400' : 'from-red-500 to-rose-600'}`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Peta Risiko
          </p>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            🔥 {streak} hari berturut-turut
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {iconMap[level.color]}
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {level.emoji} {level.label}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{level.desc}</p>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-gray-400 dark:text-gray-500">Tren</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{trendLabel}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500">Kategori</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{categoryLabel}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500">Konsistensi</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{streak} hari</p>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic text-center">
          Indikator screening awal — bukan diagnosis medis. Konsultasikan dengan dokter.
        </p>
      </CardContent>
    </Card>
  )
}
