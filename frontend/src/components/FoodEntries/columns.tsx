import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy } from "lucide-react"

import type { FoodEntryPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { FoodEntryActionsMenu } from "./FoodEntryActionsMenu"

function CopyId({ id }: { id: string }) {
  const [copiedText, copy] = useCopyToClipboard()
  const isCopied = copiedText === id

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-mono text-xs text-muted-foreground">{id}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copy(id)}
      >
        {isCopied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3" />
        )}
        <span className="sr-only">Copy ID</span>
      </Button>
    </div>
  )
}

export const columns: ColumnDef<FoodEntryPublic>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <CopyId id={row.original.id} />,
  },
  {
    accessorKey: "food_name",
    header: "Food",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.food_name}</span>
    ),
  },
  {
    accessorKey: "quantity_g",
    header: "Quantity (g)",
    cell: ({ row }) => row.original.quantity_g,
  },
  {
    accessorKey: "calories",
    header: "Calories",
    cell: ({ row }) => row.original.calories,
  },
  {
    accessorKey: "protein_g",
    header: "Protein (g)",
    cell: ({ row }) => row.original.protein_g,
  },
  {
    accessorKey: "carbs_g",
    header: "Carbs (g)",
    cell: ({ row }) => row.original.carbs_g,
  },
  {
    accessorKey: "fat_g",
    header: "Fat (g)",
    cell: ({ row }) => row.original.fat_g,
  },
  {
    accessorKey: "entry_datetime",
    header: "Logged at",
    cell: ({ row }) => {
      const value = row.original.entry_datetime
      return (
        <span className="text-muted-foreground">
          {value ? new Date(value).toLocaleString() : ""}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <FoodEntryActionsMenu foodEntry={row.original} />
      </div>
    ),
  },
]
