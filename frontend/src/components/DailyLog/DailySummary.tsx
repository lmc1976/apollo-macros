import type { DailyLogPublic } from "@/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

interface DailySummaryProps {
  entries: DailyLogPublic[]
}

export function DailySummary({ entries }: DailySummaryProps) {
  const totals = entries.reduce(
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

  const items = [
    { label: "Calorias", value: `${formatNumber(totals.energy_kcal)} kcal` },
    { label: "Proteína", value: `${formatNumber(totals.protein_g)} g` },
    { label: "Carboidrato", value: `${formatNumber(totals.carbohydrate_g)} g` },
    { label: "Gordura", value: `${formatNumber(totals.lipid_g)} g` },
    {
      label: "Custo",
      value: totals.cost_brl > 0 ? `R$ ${formatNumber(totals.cost_brl)}` : "-",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total do dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">
                {item.label}
              </span>
              <span className="text-lg font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
