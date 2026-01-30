import * as React from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  minDate,
  maxDate,
  modifiers,
  modifiersClassNames,
  className,
}) {
  const [open, setOpen] = React.useState(false)

  // Convert string date to Date object if needed
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    // Parse YYYY-MM-DD string
    const parts = value.split("-")
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    return undefined
  }, [value])

  const handleSelect = (date) => {
    if (date) {
      // Convert to YYYY-MM-DD string for form compatibility
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange("")
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal shadow-none bg-transparent hover:bg-transparent border-input",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? (
            format(dateValue, "EEEE, d MMMM yyyy", { locale: id })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
