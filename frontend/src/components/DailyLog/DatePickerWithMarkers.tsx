import { useQuery } from "@tanstack/react-query"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { DailyLogsService } from "@/client"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  dateInputValueToLocalDate,
  formatDateInputBR,
  localDateToDateInputValue,
} from "@/utils"

interface DatePickerWithMarkersProps {
  value: string
  onChange: (value: string) => void
}

export function DatePickerWithMarkers({
  value,
  onChange,
}: DatePickerWithMarkersProps) {
  const [open, setOpen] = useState(false)
  const selected = dateInputValueToLocalDate(value)
  const [visibleMonth, setVisibleMonth] = useState(selected)

  const { data: markedDates } = useQuery({
    queryKey: [
      "daily-log-dates",
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
    ],
    queryFn: () =>
      DailyLogsService.readDailyLogDates({
        year: visibleMonth.getFullYear(),
        month: visibleMonth.getMonth() + 1,
      }),
  })

  const markedDays = (markedDates ?? []).map((date) =>
    dateInputValueToLocalDate(date),
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-fit justify-start">
          <CalendarIcon />
          {formatDateInputBR(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onMonthChange={setVisibleMonth}
          modifiers={{ hasEntries: markedDays }}
          modifiersClassNames={{ hasEntries: "[&>button]:font-bold" }}
          onSelect={(date) => {
            if (!date) return
            onChange(localDateToDateInputValue(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
