import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { MealPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteMeal from "./DeleteMeal"
import EditMeal from "./EditMeal"

interface MealActionsMenuProps {
  meal: MealPublic
}

export const MealActionsMenu = ({ meal }: MealActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditMeal meal={meal} onSuccess={() => setOpen(false)} />
        <DeleteMeal id={meal.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
