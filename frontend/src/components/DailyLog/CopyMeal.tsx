import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Copy } from "lucide-react"
import { useState } from "react"

import { DailyLogsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { DatePickerWithMarkers } from "./DatePickerWithMarkers"

interface CopyMealProps {
  targetDate: string
}

const CopyMeal = ({ targetDate }: CopyMealProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [sourceDate, setSourceDate] = useState(targetDate)
  const [sourceLabel, setSourceLabel] = useState("")
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const resetAll = () => {
    setSourceDate(targetDate)
    setSourceLabel("")
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await DailyLogsService.readDailyLogs({
        date: sourceDate,
        limit: 100,
      })
      const wantedLabel = sourceLabel.trim().toLowerCase()
      const matching = data.filter(
        (entry) => (entry.label ?? "").trim().toLowerCase() === wantedLabel,
      )
      if (matching.length === 0) {
        throw new Error(
          `Nenhuma refeição "${sourceLabel}" encontrada nessa data`,
        )
      }

      await Promise.all(
        matching.map((entry) => {
          const sourceDateTime = new Date(entry.entry_datetime)
          const timeOfDay = sourceDateTime.toTimeString().slice(0, 8)
          const targetDateTime = new Date(
            `${targetDate}T${timeOfDay}`,
          ).toISOString()

          return DailyLogsService.createDailyLog({
            requestBody: {
              entry_type: entry.entry_type,
              entry_datetime: targetDateTime,
              label: entry.label ?? undefined,
              food_id:
                entry.entry_type === "food"
                  ? (entry.food_id ?? undefined)
                  : undefined,
              quantity_g:
                entry.entry_type === "food"
                  ? (entry.quantity_g ?? undefined)
                  : undefined,
              recipe_id:
                entry.entry_type === "recipe"
                  ? (entry.recipe_id ?? undefined)
                  : undefined,
              recipe_servings:
                entry.entry_type === "recipe"
                  ? (entry.recipe_servings ?? undefined)
                  : undefined,
            },
          })
        }),
      )
    },
    onSuccess: () => {
      showSuccessToast("Refeição copiada com sucesso")
      resetAll()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] })
    },
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="my-4">
          <Copy className="mr-2" />
          Copiar refeição
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar refeição</DialogTitle>
          <DialogDescription>
            Copie todos os alimentos de uma refeição de outro dia para o dia
            selecionado, mantendo o mesmo horário.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>De qual dia?</Label>
            <DatePickerWithMarkers
              value={sourceDate}
              onChange={setSourceDate}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="copy-meal-label">Qual refeição (rótulo)?</Label>
            <Input
              id="copy-meal-label"
              placeholder="Ex: Almoço"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <LoadingButton
            type="button"
            loading={mutation.isPending}
            disabled={!sourceDate || !sourceLabel.trim()}
            onClick={() => mutation.mutate()}
          >
            Copiar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CopyMeal
