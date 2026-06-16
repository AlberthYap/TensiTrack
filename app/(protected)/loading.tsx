import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div>
        <div className="h-9 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg shimmer" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-800 rounded-md mt-2 shimmer" />
      </div>

      {/* Hero card skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800 shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 dark:bg-gray-800/50 rounded-lg shimmer" />
        </CardContent>
      </Card>
    </div>
  )
}
