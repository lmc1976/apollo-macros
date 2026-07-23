import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { FoodsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddFood from "@/components/Foods/AddFood"
import { columns } from "@/components/Foods/columns"
import PendingFoods from "@/components/Pending/PendingFoods"

function getFoodsQueryOptions() {
  return {
    queryFn: () => FoodsService.readFoods({ skip: 0, limit: 100 }),
    queryKey: ["foods"],
  }
}

export const Route = createFileRoute("/_layout/foods")({
  component: Foods,
  head: () => ({
    meta: [
      {
        title: "Foods - FastAPI Cloud",
      },
    ],
  }),
})

function FoodsTableContent() {
  const { data: foods } = useSuspenseQuery(getFoodsQueryOptions())

  if (foods.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">You don't have any foods yet</h3>
        <p className="text-muted-foreground">Add a new food to get started</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={foods.data} />
}

function FoodsTable() {
  return (
    <Suspense fallback={<PendingFoods />}>
      <FoodsTableContent />
    </Suspense>
  )
}

function Foods() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foods</h1>
          <p className="text-muted-foreground">
            Catálogo de alimentos de referência (valores por 100g)
          </p>
        </div>
        <AddFood />
      </div>
      <FoodsTable />
    </div>
  )
}
