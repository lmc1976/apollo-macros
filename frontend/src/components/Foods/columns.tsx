import type { ColumnDef } from "@tanstack/react-table"

import type { FoodPublic } from "@/client"
import { FoodActionsMenu } from "./FoodActionsMenu"

function formatNumber(value: number | null | undefined) {
  return value == null
    ? "-"
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

export const columns: ColumnDef<FoodPublic>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "food_group",
    header: "Grupo",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.food_group ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "source",
    header: "Fonte",
    cell: ({ row }) => row.original.source ?? "-",
  },
  {
    accessorKey: "energy_kcal",
    header: "Calorias",
    cell: ({ row }) => formatNumber(row.original.energy_kcal),
  },
  {
    accessorKey: "protein_g",
    header: "Proteína (g)",
    cell: ({ row }) => formatNumber(row.original.protein_g),
  },
  {
    accessorKey: "carbohydrate_g",
    header: "Carboidrato (g)",
    cell: ({ row }) => formatNumber(row.original.carbohydrate_g),
  },
  {
    accessorKey: "lipid_g",
    header: "Gordura (g)",
    cell: ({ row }) => formatNumber(row.original.lipid_g),
  },
  {
    id: "price",
    header: "Preço",
    cell: ({ row }) =>
      row.original.price_brl != null && row.original.price_reference_g
        ? `R$ ${formatNumber(row.original.price_brl)} / ${row.original.price_reference_g}g`
        : "-",
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <FoodActionsMenu food={row.original} />
      </div>
    ),
  },
]
