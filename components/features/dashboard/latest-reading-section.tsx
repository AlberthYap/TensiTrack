import { createClient } from '@/lib/supabase/server'
import { LatestReading } from './latest-reading'
import { EmptyState } from '@/components/ui/empty-state'
import { Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface LatestReadingSectionProps {
  userId: string
}

export async function LatestReadingSection({ userId }: LatestReadingSectionProps) {
  const supabase = await createClient()

  const { data: latestRecord } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestRecord) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Heart}
            gradient="hero"
            title="Belum ada pencatatan"
            description="Mulai catat tekanan darah pertama Anda hari ini untuk mulai memantau kesehatan."
            action={
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/records/new">Catat Sekarang</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    )
  }

  return <LatestReading record={latestRecord} />
}
