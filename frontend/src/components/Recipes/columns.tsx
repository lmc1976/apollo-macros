import type { ColumnDef } from "@tanstack/react-table"

import type { RecipePublic } from "@/client"
import { RecipeActionsMenu } from "./RecipeActionsMenu"

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

export const columns: ColumnDef<RecipePublic>[] = [
  {
    accessorKey: "name",
    header: "Receita",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    id: "ingredients",
    header: "Alimentos",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.ingredients
          .map((ingredient) => ingredient.food_name)
          .join(", ")}
      </span>
    ),
  },
  {
    accessorKey: "total_energy_kcal",
    header: "Calorias",
    cell: ({ row }) => `${formatNumber(row.original.total_energy_kcal)} kcal`,
  },
  {
    accessorKey: "total_protein_g",
    header: "Proteína",
    cell: ({ row }) => `${formatNumber(row.original.total_protein_g)} g`,
  },
  {
    accessorKey: "total_carbohydrate_g",
    header: "Carboidrato",
    cell: ({ row }) => `${formatNumber(row.original.total_carbohydrate_g)} g`,
  },
  {
    accessorKey: "total_lipid_g",
    header: "Gordura",
    cell: ({ row }) => `${formatNumber(row.original.total_lipid_g)} g`,
  },
  {
    accessorKey: "total_cost_brl",
    header: "Custo",
    cell: ({ row }) =>
      row.original.total_cost_brl > 0
        ? `R$ ${formatNumber(row.original.total_cost_brl)}`
        : "-",
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RecipeActionsMenu recipe={row.original} />
      </div>
    ),
  },
]
