import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

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
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Form } from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError, toDatetimeLocalInputValue } from "@/utils"
import { DailyLogEntryFields } from "./DailyLogEntryFields"
import { type DailyLogFormData, dailyLogFormSchema } from "./dailyLogFormSchema"

interface EditDailyLogProps {
  entry: DailyLogPublic
  onSuccess: () => void
}

const EditDailyLog = ({ entry, onSuccess }: EditDailyLogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      entry_type: entry.entry_type,
      entry_datetime: toDatetimeLocalInputValue(entry.entry_datetime),
      label: entry.label ?? "",
      food_id: entry.food_id ?? "",
      food_name: entry.food_name ?? "",
      quantity_g: entry.quantity_g ?? null,
      recipe_id: entry.recipe_id ?? "",
      recipe_name: entry.recipe_name ?? "",
      recipe_servings: entry.recipe_servings ?? null,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: DailyLogFormData) => {
      const base = {
        entry_type: data.entry_type,
        entry_datetime: new Date(data.entry_datetime).toISOString(),
        label: data.label || undefined,
      }
      return DailyLogsService.updateDailyLog({
        id: entry.id,
        requestBody:
          data.entry_type === "food"
            ? {
                ...base,
                food_id: data.food_id,
                quantity_g: data.quantity_g ?? 0,
                recipe_id: undefined,
                recipe_servings: undefined,
              }
            : {
                ...base,
                recipe_id: data.recipe_id,
                recipe_servings: data.recipe_servings ?? 0,
                food_id: undefined,
                quantity_g: undefined,
              },
      })
    },
    onSuccess: () => {
      showSuccessToast("Registro atualizado com sucesso")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] })
    },
  })

  const onSubmit = (data: DailyLogFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Edit Entry
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Entry</DialogTitle>
              <DialogDescription>
                Atualize os dados deste registro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <DailyLogEntryFields form={form} />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditDailyLog
