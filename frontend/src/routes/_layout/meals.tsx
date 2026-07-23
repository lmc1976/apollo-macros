import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { MealsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddMeal from "@/components/Meals/AddMeal"
import { columns } from "@/components/Meals/columns"
import PendingMeals from "@/components/Pending/PendingMeals"

function getMealsQueryOptions() {
  return {
    queryFn: () => MealsService.readMeals({ skip: 0, limit: 100 }),
    queryKey: ["meals"],
  }
}

export const Route = createFileRoute("/_layout/meals")({
  component: Meals,
  head: () => ({
    meta: [
      {
        title: "Meals - FastAPI Cloud",
      },
    ],
  }),
})

function MealsTableContent() {
  const { data: meals } = useSuspenseQuery(getMealsQueryOptions())

  if (meals.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">You don't have any meals yet</h3>
        <p className="text-muted-foreground">Add a new meal to get started</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={meals.data} />
}

function MealsTable() {
  return (
    <Suspense fallback={<PendingMeals />}>
      <MealsTableContent />
    </Suspense>
  )
}

function Meals() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meals</h1>
          <p className="text-muted-foreground">
            Registre suas refeições e acompanhe macros e custo
          </p>
        </div>
        <AddMeal />
      </div>
      <MealsTable />
    </div>
  )
}
