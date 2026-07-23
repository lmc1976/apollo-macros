import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { FoodEntryPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteFoodEntry from "../FoodEntries/DeleteFoodEntry"
import EditFoodEntry from "../FoodEntries/EditFoodEntry"

interface FoodEntryActionsMenuProps {
  foodEntry: FoodEntryPublic
}

export const FoodEntryActionsMenu = ({
  foodEntry,
}: FoodEntryActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditFoodEntry foodEntry={foodEntry} onSuccess={() => setOpen(false)} />
        <DeleteFoodEntry id={foodEntry.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
