import { StatCard } from '@/components/ui/stat-card'
import { TrendingUp, Calendar, Activity, Heart } from 'lucide-react'
import { formatBloodPressure } from '@/lib/blood-pressure'

interface QuickStatsProps {
  weeklyAverage: {
    systolic: number
    diastolic: number
  } | null
  totalRecords: number
}

export function QuickStats({ weeklyAverage, totalRecords }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
      <StatCard
        label="Rata-rata 7 Hari"
        value={
          weeklyAverage
            ? formatBloodPressure(weeklyAverage.systolic, weeklyAverage.diastolic)
            : '-'
        }
        suffix="mmHg"
        icon={TrendingUp}
        gradient="hero"
      />
      <StatCard
        label="Pencatatan 7 Hari"
        value={totalRecords}
        icon={Calendar}
        gradient="success"
        subtitle="data minggu ini"
      />
      <StatCard
        label="Status"
        value={totalRecords > 0 ? 'Aktif' : 'Belum Ada'}
        icon={Activity}
        gradient={totalRecords > 0 ? 'success' : 'warm'}
        subtitle={
          totalRecords > 0
            ? 'Terus pantau kesehatan Anda'
            : 'Mulai catat data pertama'
        }
      />
    </div>
  )
}
