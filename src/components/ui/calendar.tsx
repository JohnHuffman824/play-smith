"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "./utils"
import "./button.css"
import "./calendar.css"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("calendar", props.mode === "range" ? "calendar-range" : "calendar-single", className)}
      classNames={{
        months: "calendar-months",
        month: "calendar-month",
        caption: "calendar-caption",
        caption_label: "calendar-caption-label",
        nav: "calendar-nav",
        nav_button: cn("button calendar-nav-button"),
        nav_button_previous: "calendar-nav-button-previous",
        nav_button_next: "calendar-nav-button-next",
        table: "calendar-table",
        head_row: "calendar-head-row",
        head_cell: "calendar-head-cell",
        row: "calendar-row",
        cell: "calendar-cell",
        day: cn("button calendar-day"),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: "day-selected",
        day_today: "day-today",
        day_outside: "day-outside",
        day_disabled: "day-disabled",
        day_range_middle: "day-range-middle",
        day_hidden: "day-hidden",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
