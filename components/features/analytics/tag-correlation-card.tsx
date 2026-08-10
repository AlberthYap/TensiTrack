import { Card, CardContent } from '@/components/ui/card'
import { Tag, TrendingUp, ArrowDown } from 'lucide-react'
import { getTag, type LifestyleTag } from '@/lib/lifestyle-tags'

export interface TagCorrelation {
  tag: LifestyleTag
  countWith: number
  countWithout: number
  avgSystolicWith: number
  avgDiastolicWith: number
  avgSystolicWithout: number
  avgDiastolicWithout: number
  sysDiff: number
  diaDiff: number
}

interface TagCorrelationCardProps {
  correlations: TagCorrelation[]
}

export function TagCorrelationCard({ correlations }: TagCorrelationCardProps) {
  const significant = correlations.filter(
    (c) => c.countWith >= 2 && Math.abs(c.sysDiff) >= 3
  )

  if (significant.length === 0) return null

  return (
    <Card className="overflow-hidden border-purple-200 dark:border-purple-800">
      <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-500" />
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          🔬 Korelasi Gaya Hidup
        </p>

        <div className="space-y-2.5">
          {significant.map((c) => {
            const sysUp = c.sysDiff > 0
            const diaUp = c.diaDiff > 0
            return (
              <div
                key={c.tag.key}
                className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3"
              >
                <span className="text-xl flex-shrink-0">{c.tag.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Saat <strong>{c.tag.label}</strong>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rata-rata tensi{' '}
                    <span className={sysUp ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                      {sysUp ? 'naik' : 'turun'} {Math.abs(Math.round(c.sysDiff))} mmHg
                    </span>
                    {' '}sistolik ({c.countWith}x kejadian)
                  </p>
                </div>
                {sysUp ? (
                  <TrendingUp className="w-5 h-5 text-red-400 flex-shrink-0" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 italic">
          Pola berdasarkan pencatatan 30 hari terakhir. Bukan diagnosis medis.
        </p>
      </CardContent>
    </Card>
  )
}
