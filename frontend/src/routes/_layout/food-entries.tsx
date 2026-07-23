import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { FoodEntriesService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddFoodEntry from "@/components/FoodEntries/AddFoodEntry"
import { columns } from "@/components/FoodEntries/columns"
import PendingFoodEntries from "@/components/Pending/PendingFoodEntries"

function getFoodEntriesQueryOptions() {
  return {
    queryFn: () => FoodEntriesService.readFoodEntries({ skip: 0, limit: 100 }),
    queryKey: ["food-entries"],
  }
}

export const Route = createFileRoute("/_layout/food-entries")({
  component: FoodEntries,
  head: () => ({
    meta: [
      {
        title: "Food Entries - FastAPI Cloud",
      },
    ],
  }),
})

function FoodEntriesTableContent() {
  const { data: foodEntries } = useSuspenseQuery(getFoodEntriesQueryOptions())

  if (foodEntries.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          You don't have any food entries yet
        </h3>
        <p className="text-muted-foreground">
          Log a new food entry to get started
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={foodEntries.data} />
}

function FoodEntriesTable() {
  return (
    <Suspense fallback={<PendingFoodEntries />}>
      <FoodEntriesTableContent />
    </Suspense>
  )
}

function FoodEntries() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Food Entries</h1>
          <p className="text-muted-foreground">
            Track what you eat and its macros
          </p>
        </div>
        <AddFoodEntry />
      </div>
      <FoodEntriesTable />
    </div>
  )
}
