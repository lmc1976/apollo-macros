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
import EditMealSection from "./EditMealSection"

function formatNumber(value: number | null | undefined) {
  return value == null
    ? "-"
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

interface MealGroup {
  key: string
  label: string
  time: string
  entries: DailyLogPublic[]
}

function groupByMeal(entries: DailyLogPublic[]): MealGroup[] {
  const groups = new Map<string, MealGroup>()
  for (const entry of entries) {
    const time = new Date(entry.entry_datetime).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    const label = entry.label || "Sem rótulo"
    const key = `${label}__${time}`
    const group = groups.get(key)
    if (group) {
      group.entries.push(entry)
    } else {
      groups.set(key, { key, label, time, entries: [entry] })
    }
  }
  return Array.from(groups.values())
}

function sumMealTotals(entries: DailyLogPublic[]) {
  return entries.reduce(
    (acc, entry) => ({
      energy_kcal: acc.energy_kcal + entry.energy_kcal,
      protein_g: acc.protein_g + entry.protein_g,
      carbohydrate_g: acc.carbohydrate_g + entry.carbohydrate_g,
      lipid_g: acc.lipid_g + entry.lipid_g,
      cost_brl: acc.cost_brl + entry.cost_brl,
    }),
    {
      energy_kcal: 0,
      protein_g: 0,
      carbohydrate_g: 0,
      lipid_g: 0,
      cost_brl: 0,
    },
  )
}

interface DailyLogTableProps {
  entries: DailyLogPublic[]
  date: string
}

export function DailyLogTable({ entries, date }: DailyLogTableProps) {
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

  const groups = groupByMeal(entries)

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const totals = sumMealTotals(group.entries)
        const groupEntryIds = new Set(group.entries.map((entry) => entry.id))
        const otherEntries = entries.filter(
          (entry) => !groupEntryIds.has(entry.id),
        )
        return (
          <div key={group.key} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold">
                  {group.label} - {group.time}
                </h3>
                <EditMealSection
                  date={date}
                  groupLabel={group.entries[0]?.label}
                  groupTime={group.time}
                  entries={group.entries}
                  otherEntries={otherEntries}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Total: {formatNumber(totals.energy_kcal)} kcal |{" "}
                {formatNumber(totals.protein_g)}g proteína |{" "}
                {formatNumber(totals.carbohydrate_g)}g carb |{" "}
                {formatNumber(totals.lipid_g)}g gordura
                {totals.cost_brl > 0
                  ? ` | R$ ${formatNumber(totals.cost_brl)}`
                  : ""}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10" />
                  <TableHead>Item</TableHead>
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
                {group.entries.map((entry) => {
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
                              {entry.recipe_servings === 1
                                ? "porção"
                                : "porções"}
                              )
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatNumber(entry.energy_kcal)} kcal
                        </TableCell>
                        <TableCell>{formatNumber(entry.protein_g)} g</TableCell>
                        <TableCell>
                          {formatNumber(entry.carbohydrate_g)} g
                        </TableCell>
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
                })}
              </TableBody>
            </Table>
          </div>
        )
      })}
    </div>
  )
}
