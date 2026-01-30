"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function DatePicker({ value, onChange, placeholder = "Pilih tanggal", className, minDate, maxDate }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const containerRef = React.useRef(null)

  // Initialize current month from value if exists
  React.useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value))
    }
  }, [value])

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    // Adjust start to beginning of week (Monday)
    const startDate = new Date(start)
    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1))
    
    // Adjust end to end of week (Sunday)
    const endDate = new Date(end)
    const daysToAdd = endDate.getDay() === 0 ? 0 : 7 - endDate.getDay()
    endDate.setDate(endDate.getDate() + daysToAdd)

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const handleSelect = (date) => {
    onChange?.(format(date, 'yyyy-MM-dd')) // Standard HTML date format
    setIsOpen(false)
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const displayDate = value ? format(new Date(value), "dd MMMM yyyy", { locale: localeId }) : null

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 opacity-50" />
          {displayDate || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 w-[280px] rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="h-7 w-7 bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium">
                {format(currentMonth, "MMMM yyyy", { locale: localeId })}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="h-7 w-7 bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted-foreground">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                <div key={day} className="font-medium">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-sm">
              {days.map((day, idx) => {
                const isSelected = value && isSameDay(new Date(value), day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                
                // Check disabled state
                let isDisabled = false
                if (minDate && day < new Date(minDate)) isDisabled = true
                if (maxDate && day > new Date(maxDate)) isDisabled = true

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !isDisabled && handleSelect(day)}
                    disabled={isDisabled}
                    className={cn(
                      "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                      !isCurrentMonth && "text-muted-foreground opacity-50 invisible", 
                      isCurrentMonth && !isDisabled && "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      isToday(day) && !isSelected && "border border-primary text-primary",
                      isDisabled && "opacity-30 cursor-not-allowed text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
