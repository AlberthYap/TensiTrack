import { Card, CardContent } from '@/components/ui/card'
import { Flame, CalendarDays } from 'lucide-react'

interface StreakCardProps {
  /** Current streak: consecutive days (including today/yesterday) with readings */
  streak: number
  /** Days since last reading (0 = today, 1 = yesterday, etc.) */
  daysSinceLastReading: number
}

/**
 * Compact streak card for the dashboard.
 *
 * - streak > 0: "🔥 {n} hari berturut-turut mencatat tensi!"
 * - streak = 0: "⏳ Terakhir catat {n} hari lalu, yuk lanjut!"
 */
export function StreakCard({ streak, daysSinceLastReading }: StreakCardProps) {
  if (streak <= 0 && daysSinceLastReading < 0) return null

  const isActive = streak > 0

  return (
    <Card className="overflow-hidden">
      <div
        className={`h-1 bg-gradient-to-r ${
          isActive
            ? 'from-amber-400 via-orange-500 to-red-500'
            : 'from-gray-300 to-gray-400'
        }`}
      />
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-md ${
              isActive
                ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}
          >
            {isActive ? (
              <Flame className="w-5 h-5 text-white" />
            ) : (
              <CalendarDays className="w-5 h-5 text-white" />
            )}
          </span>

          <div>
            {isActive ? (
              <>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  🔥 {streak} hari berturut-turut!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Anda mencatat tensi {streak} hari berturut-turut. Pertahankan!
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  ⏳ Yuk lanjutkan!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Terakhir catat {daysSinceLastReading} hari lalu. Cek tensi
                  Anda hari ini.
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
