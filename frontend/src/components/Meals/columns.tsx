import type { ColumnDef } from "@tanstack/react-table"

import type { MealPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { MealActionsMenu } from "./MealActionsMenu"

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

export const columns: ColumnDef<MealPublic>[] = [
  {
    accessorKey: "label",
    header: "Refeição",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.label}</span>
        {row.original.is_recipe && <Badge variant="secondary">Receita</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "meal_datetime",
    header: "Data/hora",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.meal_datetime
          ? new Date(row.original.meal_datetime).toLocaleString()
          : ""}
      </span>
    ),
  },
  {
    id: "foods",
    header: "Alimentos",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.food_entries.map((entry) => entry.food_name).join(", ")}
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
        <MealActionsMenu meal={row.original} />
      </div>
    ),
  },
]
