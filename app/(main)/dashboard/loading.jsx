// Route-level loading UI for the Industry Insights (dashboard) page
export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Top summary skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg bg-muted/30 dark:bg-muted/20 p-4"
            >
              <div className="h-4 w-32 rounded bg-muted/50 dark:bg-muted/30 animate-pulse mb-3" />
              <div className="h-8 w-20 rounded bg-muted/50 dark:bg-muted/30 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Salary chart + Recommended roles skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 h-80 rounded-lg bg-muted/30 dark:bg-muted/20 p-4">
            <div className="h-6 w-48 rounded bg-muted/50 dark:bg-muted/30 animate-pulse mb-4" />
            <div className="h-56 rounded bg-muted/50 dark:bg-muted/30 animate-pulse" />
          </div>

          <div className="h-80 rounded-lg bg-muted/30 dark:bg-muted/20 p-4">
            <div className="h-6 w-40 rounded bg-muted/50 dark:bg-muted/30 animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-full rounded bg-muted/50 dark:bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trends and Recommended Skills skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/30 dark:bg-muted/20 p-4">
            <div className="h-6 w-40 rounded bg-muted/50 dark:bg-muted/30 animate-pulse mb-4" />
            <ul className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <li key={idx} className="h-4 w-full rounded bg-muted/50 dark:bg-muted/30 animate-pulse" />
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/30 dark:bg-muted/20 p-4">
            <div className="h-6 w-48 rounded bg-muted/50 dark:bg-muted/30 animate-pulse mb-4" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-8 w-24 rounded bg-muted/50 dark:bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
