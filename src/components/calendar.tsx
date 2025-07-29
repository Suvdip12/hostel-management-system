"use client"

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { getDay, getDaysInMonth, isSameDay } from "date-fns"
import { atom, useAtom } from "jotai"
import {
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type CalendarState = {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  year: number
}

const monthAtom = atom<CalendarState["month"]>(
  new Date().getMonth() as CalendarState["month"]
)
const yearAtom = atom<CalendarState["year"]>(new Date().getFullYear())

export const useCalendarMonth = () => useAtom(monthAtom)
export const useCalendarYear = () => useAtom(yearAtom)

type CalendarContextProps = {
  locale: Intl.LocalesArgument
  startDay: number
}

const CalendarContext = createContext<CalendarContextProps>({
  locale: "en-US",
  startDay: 0,
})

export type Status = {
  id: string
  name: string
  color: string
}

export type Feature = {
  id: string
  name: string
  startAt: Date
  endAt: Date
  status: Status
}

type ComboboxProps = {
  value: string
  setValue: (value: string) => void
  data: {
    value: string
    label: string
  }[]
  labels: {
    button: string
    empty: string
    search: string
  }
  className?: string
}

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions["month"] = "long"
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
    .format
  return [...new Array(12).keys()].map((m) =>
    format(new Date(Date.UTC(2021, m, 2)))
  )
}

export const daysForLocale = (
  locale: Intl.LocalesArgument,
  startDay: number
) => {
  const weekdays: string[] = []
  const baseDate = new Date(2024, 0, startDay)
  for (let i = 0; i < 7; i++) {
    weekdays.push(
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(baseDate)
    )
    baseDate.setDate(baseDate.getDate() + 1)
  }
  return weekdays
}

const Combobox = ({
  value,
  setValue,
  data,
  labels,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "touch-manipulation justify-between capitalize",
            className
          )}
          variant="outline"
          size="sm"
        >
          <span className="truncate">
            {value
              ? data.find((item) => item.value === value)?.label
              : labels.button}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command
          filter={(value, search) => {
            const label = data.find((item) => item.value === value)?.label
            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder={labels.search} className="h-9" />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  className="capitalize"
                  key={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  value={item.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type OutOfBoundsDayProps = {
  day: number
}

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="bg-secondary dark:bg-muted text-muted-foreground relative h-full w-full p-1 text-xs">
    {day}
  </div>
)

export type CalendarBodyProps = {
  features: Feature[]
  children: (props: { feature: Feature }) => ReactNode
  onDateSelect?: (date: Date) => void
}

export const CalendarBody = ({
  features,
  children,
  onDateSelect,
}: CalendarBodyProps) => {
  const [month] = useCalendarMonth()
  const [year] = useCalendarYear()
  const { startDay } = useContext(CalendarContext)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Memoize expensive date calculations
  const currentMonthDate = useMemo(
    () => new Date(year, month, 1),
    [year, month]
  )

  const daysInMonth = useMemo(
    () => getDaysInMonth(currentMonthDate),
    [currentMonthDate]
  )

  const firstDay = useMemo(
    () => (getDay(currentMonthDate) - startDay + 7) % 7,
    [currentMonthDate, startDay]
  )

  // Memoize previous month calculations
  const prevMonthData = useMemo(() => {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1))
    const prevMonthDaysArray = Array.from(
      { length: prevMonthDays },
      (_, i) => i + 1
    )
    return { prevMonthDays, prevMonthDaysArray }
  }, [month, year])

  // Memoize next month calculations
  const nextMonthData = useMemo(() => {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextMonthYear = month === 11 ? year + 1 : year
    const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1))
    const nextMonthDaysArray = Array.from(
      { length: nextMonthDays },
      (_, i) => i + 1
    )
    return { nextMonthDaysArray }
  }, [month, year])

  // Memoize features filtering by day to avoid recalculating on every render
  const featuresByDay = useMemo(() => {
    const result: { [day: number]: Feature[] } = {}
    for (let day = 1; day <= daysInMonth; day++) {
      result[day] = features.filter((feature) => {
        return isSameDay(new Date(feature.endAt), new Date(year, month, day))
      })
    }
    return result
  }, [features, daysInMonth, year, month])

  const days: ReactNode[] = []

  for (let i = 0; i < firstDay; i++) {
    const day =
      prevMonthData.prevMonthDaysArray[
        prevMonthData.prevMonthDays - firstDay + i
      ]
    if (day) {
      days.push(<OutOfBoundsDay day={day} key={`prev-${i}`} />)
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const featuresForDay = featuresByDay[day] || []
    const currentDate = new Date(year, month, day)

    days.push(
      <div
        className="text-muted-foreground hover:bg-muted/50 relative flex h-full w-full cursor-pointer touch-manipulation flex-col gap-1 p-1 text-xs transition-colors md:p-2"
        key={day}
        onClick={() => onDateSelect?.(currentDate)}
      >
        <div className="font-medium">{day}</div>
        <div className="space-y-1">
          {featuresForDay.slice(0, 2).map((feature) => children({ feature }))}
        </div>
        {featuresForDay.length > 2 && (
          <span className="text-muted-foreground block text-xs">
            +{featuresForDay.length - 2} more
          </span>
        )}
      </div>
    )
  }

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7)
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthData.nextMonthDaysArray[i]
      if (day) {
        days.push(<OutOfBoundsDay day={day} key={`next-${i}`} />)
      }
    }
  }

  if (!isClient) {
    return (
      <div className="bg-border grid flex-grow grid-cols-7 gap-px">
        {Array.from({ length: 42 }, (_, index) => (
          <div
            key={index}
            className="bg-background relative min-h-[60px] overflow-hidden md:min-h-[80px] lg:min-h-[100px]"
          >
            <div className="text-muted-foreground p-1 text-xs md:p-2">
              {/* Empty placeholder */}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-border grid flex-grow grid-cols-7 gap-px">
      {days.map((day, index) => (
        <div
          className={cn(
            "bg-background relative min-h-[60px] overflow-hidden md:min-h-[80px] lg:min-h-[100px]",
            "transition-colors"
          )}
          key={index}
        >
          {day}
        </div>
      ))}
    </div>
  )
}

export type CalendarDatePickerProps = {
  className?: string
  children: ReactNode
}

export const CalendarDatePicker = ({
  className,
  children,
}: CalendarDatePickerProps) => (
  <div className={cn("flex items-center gap-1", className)}>{children}</div>
)

export type CalendarMonthPickerProps = {
  className?: string
}

export const CalendarMonthPicker = ({
  className,
}: CalendarMonthPickerProps) => {
  const [month, setMonth] = useCalendarMonth()
  const { locale } = useContext(CalendarContext)

  // Memoize month data to avoid recalculating date formatting
  const monthData = useMemo(() => {
    return monthsForLocale(locale).map((month, index) => ({
      value: index.toString(),
      label: month,
    }))
  }, [locale])

  return (
    <Combobox
      className={className}
      data={monthData}
      labels={{
        button: "Select month",
        empty: "No month found",
        search: "Search month",
      }}
      setValue={(value) =>
        setMonth(Number.parseInt(value) as CalendarState["month"])
      }
      value={month.toString()}
    />
  )
}

export type CalendarYearPickerProps = {
  className?: string
  start: number
  end: number
}

export const CalendarYearPicker = ({
  className,
  start,
  end,
}: CalendarYearPickerProps) => {
  const [year, setYear] = useCalendarYear()

  return (
    <Combobox
      className={className}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: "Select year",
        empty: "No year found",
        search: "Search year",
      }}
      setValue={(value) => setYear(Number.parseInt(value))}
      value={year.toString()}
    />
  )
}

export type CalendarDatePaginationProps = {
  className?: string
}

export const CalendarDatePagination = ({
  className,
}: CalendarDatePaginationProps) => {
  const [month, setMonth] = useCalendarMonth()
  const [year, setYear] = useCalendarYear()

  const handlePreviousMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth((month - 1) as CalendarState["month"])
    }
  }, [month, year, setMonth, setYear])

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth((month + 1) as CalendarState["month"])
    }
  }, [month, year, setMonth, setYear])

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        onClick={handlePreviousMonth}
        size="sm"
        variant="ghost"
        className="touch-manipulation"
      >
        <ChevronLeftIcon size={16} />
      </Button>
      <Button
        onClick={handleNextMonth}
        size="sm"
        variant="ghost"
        className="touch-manipulation"
      >
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  )
}

export type CalendarDateProps = {
  children: ReactNode
}

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between p-3">{children}</div>
)

export type CalendarHeaderProps = {
  className?: string
}

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext)

  // Memoize days data to avoid recalculating date formatting
  const daysData = useMemo(() => {
    return daysForLocale(locale, startDay)
  }, [locale, startDay])

  return (
    <div className={cn("grid flex-grow grid-cols-7", className)}>
      {daysData.map((day) => (
        <div className="text-muted-foreground p-3 text-right text-xs" key={day}>
          {day}
        </div>
      ))}
    </div>
  )
}

export type CalendarItemProps = {
  feature: Feature
  className?: string
}

export const CalendarItem = memo(
  ({ feature, className }: CalendarItemProps) => (
    <div className={cn("flex items-center gap-1 md:gap-2", className)}>
      <div
        className="h-2 w-2 shrink-0 rounded-full md:h-3 md:w-3"
        style={{
          backgroundColor: feature.status.color,
        }}
      />
      <span className="truncate text-xs leading-tight">{feature.name}</span>
    </div>
  )
)

CalendarItem.displayName = "CalendarItem"

export type CalendarProviderProps = {
  locale?: Intl.LocalesArgument
  startDay?: number
  children: ReactNode
  className?: string
}

export const CalendarProvider = ({
  locale = "en-US",
  startDay = 0,
  children,
  className,
}: CalendarProviderProps) => (
  <CalendarContext.Provider value={{ locale, startDay }}>
    <div className={cn("relative flex flex-col", className)}>{children}</div>
  </CalendarContext.Provider>
)
