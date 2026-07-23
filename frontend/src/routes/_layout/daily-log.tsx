import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { DailyLogsService } from "@/client"
import AddDailyLog from "@/components/DailyLog/AddDailyLog"
import { DailyLogTable } from "@/components/DailyLog/DailyLogTable"
import PendingDailyLog from "@/components/Pending/PendingDailyLog"

function getDailyLogsQueryOptions() {
  return {
    queryFn: () => DailyLogsService.readDailyLogs({ skip: 0, limit: 100 }),
    queryKey: ["daily-logs"],
  }
}

export const Route = createFileRoute("/_layout/daily-log")({
  component: DailyLog,
  head: () => ({
    meta: [
      {
        title: "Daily Log - FastAPI Cloud",
      },
    ],
  }),
})

function DailyLogTableContent() {
  const { data: dailyLogs } = useSuspenseQuery(getDailyLogsQueryOptions())

  if (dailyLogs.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          You don't have any daily log entries yet
        </h3>
        <p className="text-muted-foreground">Add a new entry to get started</p>
      </div>
    )
  }

  return <DailyLogTable entries={dailyLogs.data} />
}

function DailyLogTableSuspense() {
  return (
    <Suspense fallback={<PendingDailyLog />}>
      <DailyLogTableContent />
    </Suspense>
  )
}

function DailyLog() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Log</h1>
          <p className="text-muted-foreground">
            Registre o que você comeu, alimento a alimento ou por receita
          </p>
        </div>
        <AddDailyLog />
      </div>
      <DailyLogTableSuspense />
    </div>
  )
}
