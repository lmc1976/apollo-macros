import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type DailyLogCreate, DailyLogsService } from "@/client"
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
import { Form } from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError, nowForDatetimeLocalInput } from "@/utils"
import { DailyLogEntryFields } from "./DailyLogEntryFields"
import { type DailyLogFormData, dailyLogFormSchema } from "./dailyLogFormSchema"

const emptyDefaultValues = (): DailyLogFormData => ({
  entry_type: "food",
  entry_datetime: nowForDatetimeLocalInput(),
  label: "",
  food_id: "",
  food_name: "",
  quantity_g: null,
  recipe_id: "",
  recipe_name: "",
  recipe_servings: null,
})

const AddDailyLog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: emptyDefaultValues(),
  })

  const mutation = useMutation({
    mutationFn: (data: DailyLogCreate) =>
      DailyLogsService.createDailyLog({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Registro criado com sucesso")
      form.reset(emptyDefaultValues())
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] })
    },
  })

  const onSubmit = (data: DailyLogFormData) => {
    const base = {
      entry_type: data.entry_type,
      entry_datetime: new Date(data.entry_datetime).toISOString(),
      label: data.label || undefined,
    }
    mutation.mutate(
      data.entry_type === "food"
        ? { ...base, food_id: data.food_id, quantity_g: data.quantity_g ?? 0 }
        : {
            ...base,
            recipe_id: data.recipe_id,
            recipe_servings: data.recipe_servings ?? 0,
          },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
          <DialogDescription>
            Registre um alimento ou uma receita que você consumiu.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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

export default AddDailyLog
