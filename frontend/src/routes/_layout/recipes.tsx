import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { RecipesService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingRecipes from "@/components/Pending/PendingRecipes"
import AddRecipe from "@/components/Recipes/AddRecipe"
import { columns } from "@/components/Recipes/columns"

function getRecipesQueryOptions() {
  return {
    queryFn: () => RecipesService.readRecipes({ skip: 0, limit: 100 }),
    queryKey: ["recipes"],
  }
}

export const Route = createFileRoute("/_layout/recipes")({
  component: Recipes,
  head: () => ({
    meta: [
      {
        title: "Recipes - FastAPI Cloud",
      },
    ],
  }),
})

function RecipesTableContent() {
  const { data: recipes } = useSuspenseQuery(getRecipesQueryOptions())

  if (recipes.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          You don't have any recipes yet
        </h3>
        <p className="text-muted-foreground">Add a new recipe to get started</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={recipes.data} />
}

function RecipesTable() {
  return (
    <Suspense fallback={<PendingRecipes />}>
      <RecipesTableContent />
    </Suspense>
  )
}

function Recipes() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Modelos reutilizáveis de combinações de alimentos
          </p>
        </div>
        <AddRecipe />
      </div>
      <RecipesTable />
    </div>
  )
}
