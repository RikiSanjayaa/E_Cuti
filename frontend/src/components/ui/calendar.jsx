import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { id } from 'date-fns/locale';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      locale={id}
      showOutsideDays={showOutsideDays}
      modifiers={{
        weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
        ...props.modifiers,
      }}
      modifiersClassNames={{
        weekend: "text-red-500 font-medium",
        ...props.modifiersClassNames,
      }}
      className={cn("p-3", className)}
      classNames={{
        // v9 class names
        months: "relative flex flex-col",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-10",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-1 top-2 h-9 w-9 p-0 opacity-70 hover:opacity-100 hover:bg-accent z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-1 top-2 h-9 w-9 p-0 opacity-70 hover:opacity-100 hover:bg-accent z-10"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center [&:nth-child(6)]:text-red-500 [&:nth-child(7)]:text-red-500",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-full"
        ),
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
        today: "bg-accent text-accent-foreground rounded-full",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-5 w-5" />;
          }
          return <ChevronRight className="h-5 w-5" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
