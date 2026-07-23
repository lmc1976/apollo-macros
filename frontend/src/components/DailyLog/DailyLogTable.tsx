import { ChevronDown, ChevronRight } from "lucide-react"
import { Fragment, useState } from "react"

import type { DailyLogPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DailyLogActionsMenu } from "./DailyLogActionsMenu"

function formatNumber(value: number | null | undefined) {
  return value == null
    ? "-"
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

interface DailyLogTableProps {
  entries: DailyLogPublic[]
}

export function DailyLogTable({ entries }: DailyLogTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10" />
          <TableHead>Item</TableHead>
          <TableHead>Rótulo</TableHead>
          <TableHead>Data/hora</TableHead>
          <TableHead>Calorias</TableHead>
          <TableHead>Proteína</TableHead>
          <TableHead>Carboidrato</TableHead>
          <TableHead>Gordura</TableHead>
          <TableHead>Custo</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={10}
              className="h-32 text-center text-muted-foreground"
            >
              No results found.
            </TableCell>
          </TableRow>
        ) : (
          entries.map((entry) => {
            const isRecipe = entry.entry_type === "recipe"
            const expanded = expandedIds.has(entry.id)
            const ingredients = entry.ingredients ?? []

            return (
              <Fragment key={entry.id}>
                <TableRow>
                  <TableCell>
                    {isRecipe && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => toggle(entry.id)}
                      >
                        {expanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.food_name ?? entry.recipe_name}
                    {isRecipe && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({formatNumber(entry.recipe_servings)}{" "}
                        {entry.recipe_servings === 1 ? "porção" : "porções"})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.label ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(entry.entry_datetime).toLocaleString()}
                  </TableCell>
                  <TableCell>{formatNumber(entry.energy_kcal)} kcal</TableCell>
                  <TableCell>{formatNumber(entry.protein_g)} g</TableCell>
                  <TableCell>{formatNumber(entry.carbohydrate_g)} g</TableCell>
                  <TableCell>{formatNumber(entry.lipid_g)} g</TableCell>
                  <TableCell>
                    {entry.cost_brl > 0
                      ? `R$ ${formatNumber(entry.cost_brl)}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DailyLogActionsMenu entry={entry} />
                    </div>
                  </TableCell>
                </TableRow>
                {isRecipe &&
                  expanded &&
                  ingredients.map((ingredient, index) => (
                    <TableRow
                      key={`${entry.id}-${ingredient.food_id}-${index}`}
                      className="bg-muted/30 hover:bg-muted/30"
                    >
                      <TableCell />
                      <TableCell className="text-muted-foreground pl-8 font-mono text-sm">
                        {index === ingredients.length - 1 ? "└─" : "├─"}{" "}
                        {ingredient.food_name}
                      </TableCell>
                      <TableCell colSpan={2} />
                      <TableCell className="text-muted-foreground">
                        {formatNumber(ingredient.energy_kcal)} kcal
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(ingredient.protein_g)} g
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(ingredient.carbohydrate_g)} g
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNumber(ingredient.lipid_g)} g
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ingredient.cost_brl
                          ? `R$ ${formatNumber(ingredient.cost_brl)}`
                          : "-"}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
              </Fragment>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
