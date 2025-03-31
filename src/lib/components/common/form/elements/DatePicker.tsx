"use client"

import React, { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover"
import { Button } from "@/src/lib/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar } from "@/src/lib/components/ui/calendar"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { ElementProps } from "@/src/lib/components/common/form/FormElement"

export const DatePicker = ({
                               onChange,
                               readonly,
                               placeholder = "Select date...",
                               ...props
                           }: ElementProps<Date>) => {
    const [isOpen, setIsOpen] = useState(false)
    const [date, setDate] = useState<Date | null>(props.value ?? null)

    useEffect(() => {
        if (props.value && props.value !== date) {
            setDate(props.value ?? null)
        }
    }, [props.value]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = (newDate: Date | null) => {
        if (!readonly) {
            setDate(newDate)
            onChange?.(newDate)
            setIsOpen(false)
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!readonly) {
            setDate(null)
            onChange?.(null)
        }
    }

    const renderValue = (value: Date  | null) => {
        return value ? value.toLocaleDateString() : placeholder
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full items-center justify-start font-normal",
                            props.className,
                            !date && "text-muted-foreground"
                        )}
                        onClick={(event) => {
                            event.preventDefault()
                            if (!readonly) setIsOpen(true)
                        }}
                        disabled={readonly}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {renderValue(date)}
                    </Button>
                    {date && !readonly && (
                        <Button
                            variant="ghost"
                            onClick={handleClear}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            <X />
                        </Button>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date ?? undefined}
                    onSelect={(value) => handleSelect(value ?? null)}
                    required={props.required}
                    initialFocus />
            </PopoverContent>
        </Popover>
    )
}

export default DatePicker