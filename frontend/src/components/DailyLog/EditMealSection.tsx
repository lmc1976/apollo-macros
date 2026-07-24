import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { type DailyLogPublic, DailyLogsService } from "@/client"
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

function sectionKey(label: string | null | undefined, time: string) {
  return `${label || "Sem rótulo"}__${time}`
}

function entryTimeOfDay(isoString: string) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

interface EditMealSectionProps {
  date: string
  groupLabel: string | null | undefined
  groupTime: string
  entries: DailyLogPublic[]
  otherEntries: DailyLogPublic[]
}

const EditMealSection = ({
  date,
  groupLabel,
  groupTime,
  entries,
  otherEntries,
}: EditMealSectionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [label, setLabel] = useState(groupLabel ?? "")
  const [time, setTime] = useState(groupTime)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const resetAll = () => {
    setLabel(groupLabel ?? "")
    setTime(groupTime)
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const entry_datetime = new Date(`${date}T${time}`).toISOString()
      await Promise.all(
        entries.map((entry) =>
          DailyLogsService.updateDailyLog({
            id: entry.id,
            requestBody: {
              label: label.trim() || undefined,
              entry_datetime,
            },
          }),
        ),
      )
    },
    onSuccess: () => {
      showSuccessToast("Refeição atualizada com sucesso")
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] })
    },
  })

  const handleSave = () => {
    const willMerge = otherEntries.some(
      (entry) =>
        sectionKey(entry.label, entryTimeOfDay(entry.entry_datetime)) ===
        sectionKey(label.trim(), time),
    )
    if (willMerge) {
      toast.warning("Já existe uma refeição com esse rótulo e horário", {
        description: "Os itens das duas seções serão mesclados.",
      })
    }
    mutation.mutate()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Editar refeição"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar refeição</DialogTitle>
          <DialogDescription>
            Atualize o rótulo e o horário de todos os itens desta seção.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-section-label">Rótulo</Label>
            <Input
              id="edit-section-label"
              placeholder="Ex: Almoço"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-section-time">Hora</Label>
            <Input
              id="edit-section-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
            disabled={!time}
            onClick={handleSave}
          >
            Salvar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditMealSection
