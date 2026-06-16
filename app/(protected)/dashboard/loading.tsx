import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="h-9 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg shimmer" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-md mt-2 shimmer" />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat dashboard...
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-800 shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
              <div className="h-10 w-40 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
