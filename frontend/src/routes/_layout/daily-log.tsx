import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense, useState } from "react"

import { DailyLogsService } from "@/client"
import AddDailyLog from "@/components/DailyLog/AddDailyLog"
import CopyMeal from "@/components/DailyLog/CopyMeal"
import { DailyLogTable } from "@/components/DailyLog/DailyLogTable"
import { DailySummary } from "@/components/DailyLog/DailySummary"
import { DatePickerWithMarkers } from "@/components/DailyLog/DatePickerWithMarkers"
import PendingDailyLog from "@/components/Pending/PendingDailyLog"
import { formatDateInputBR, nowForDateInput } from "@/utils"

function getDailyLogsQueryOptions(date: string) {
  return {
    queryFn: () =>
      DailyLogsService.readDailyLogs({ date, skip: 0, limit: 100 }),
    queryKey: ["daily-logs", date],
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

function DailyLogContent({ date }: { date: string }) {
  const { data: dailyLogs } = useSuspenseQuery(getDailyLogsQueryOptions(date))

  if (dailyLogs.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No entries for this day</h3>
        <p className="text-muted-foreground">Add a new entry to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DailyLogTable entries={dailyLogs.data} />
      <DailySummary entries={dailyLogs.data} />
    </div>
  )
}

function DailyLogSuspense({ date }: { date: string }) {
  return (
    <Suspense fallback={<PendingDailyLog />}>
      <DailyLogContent date={date} />
    </Suspense>
  )
}

function DailyLog() {
  const [date, setDate] = useState(nowForDateInput())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Log</h1>
          <p className="text-muted-foreground">
            Registre o que você comeu, alimento a alimento ou por receita
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyMeal targetDate={date} />
          <AddDailyLog selectedDate={date} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Dia {formatDateInputBR(date)}</h2>
        <DatePickerWithMarkers value={date} onChange={setDate} />
      </div>

      <DailyLogSuspense date={date} />
    </div>
  )
}
