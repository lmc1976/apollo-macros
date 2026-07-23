import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { DailyLogPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteDailyLog from "./DeleteDailyLog"
import EditDailyLog from "./EditDailyLog"

interface DailyLogActionsMenuProps {
  entry: DailyLogPublic
}

export const DailyLogActionsMenu = ({ entry }: DailyLogActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditDailyLog entry={entry} onSuccess={() => setOpen(false)} />
        <DeleteDailyLog id={entry.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
