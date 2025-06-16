"use client"

import React, { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover"
import { Button } from "@/src/lib/components/ui/button"
import { cn } from "@/src/lib/util/utils"
import { Check, X } from "lucide-react"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/src/lib/components/ui/command"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { ElementProps } from "@/src/lib/components/common/form/FormElement"
import { Badge } from "@/src/lib/components/ui/badge"

export interface SelectOption<T> {
    label: string;
    value: T;
    render?: (label: string) => React.ReactNode
}

interface SelectFieldProps<T> extends ElementProps<T> {
    options: SelectOption<T>[]
    multiple?: boolean
}

export const SelectField = <T, >({
                                     options,
                                     onChange,
                                     readonly,
                                     placeholder = "Select option ...",
                                     multiple = false,
                                     ...props
                                 }: SelectFieldProps<T>) => {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [internalValue, setInternalValue] = useState<T | T[] | null>(
        multiple ? (Array.isArray(props.value) ? props.value : []) : (props.value ?? null)
    )

    // Update internal state when external value changes
    useEffect(() => {
        if (props.value !== undefined) {
            if (multiple) {
                if (Array.isArray(props.value)) {
                    setInternalValue(props.value)
                } else if (props.value !== null) {
                    setInternalValue([props.value])
                } else {
                    setInternalValue([])
                }
            } else {
                setInternalValue(props.value ?? null)
            }
        }
    }, [props.value, multiple])

    const handleSelect = (newValue: T) => {
        if (!readonly) {
            setSearch("")

            if (multiple) {
                let updatedValues: T[]

                if (Array.isArray(internalValue)) {
                    // Check if value already exists in array
                    const valueExists = internalValue.some(
                        (val) => JSON.stringify(val) === JSON.stringify(newValue)
                    )

                    if (valueExists) {
                        // Remove value if it already exists
                        updatedValues = internalValue.filter(
                            (val) => JSON.stringify(val) !== JSON.stringify(newValue)
                        )
                    } else {
                        // Add value if it doesn't exist
                        updatedValues = [...internalValue, newValue]
                    }
                } else {
                    // Initialize array with new value
                    updatedValues = [newValue]
                }

                onChange?.(updatedValues as T)
                setInternalValue(updatedValues)
            } else {
                setIsOpen(false)
                onChange?.(newValue)
                setInternalValue(newValue)
            }
        }
    }

    const handleClear = () => {
        if (!readonly) {
            setSearch("")
            if (multiple) {
                onChange?.([] as T)
                setInternalValue([])
            } else {
                onChange?.(null)
                setInternalValue(null)
            }
        }
    }

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    const isValueSelected = (value: T): boolean => {
        if (multiple && Array.isArray(internalValue)) {
            return internalValue.some(val => JSON.stringify(val) === JSON.stringify(value))
        }
        return JSON.stringify(internalValue) === JSON.stringify(value)
    }

    const renderValue = (value: T | T[] | null) => {
        if (multiple && Array.isArray(value) && value.length > 0) {
            return (
                <div className="flex flex-wrap gap-2">
                    {value.map((val) => {
                        const option = options.find((opt) => JSON.stringify(opt.value) === JSON.stringify(val))
                        if (option) {
                            return (
                                <Badge variant={"secondary"}>
                                    {option.render ? option.render(option.label) : option.label}
                                </Badge>
                            )
                        }
                        return null
                    })}
                </div>
            )
        } else if (!multiple) {
            const option = options.find((option) => JSON.stringify(option.value) === JSON.stringify(value))
            if (option) {
                return option.render ? option.render(option.label) : option.label
            }
        }
        return placeholder
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <Button
                        variant={"outline"}
                        role="select-field"
                        className={cn(
                            "w-full justify-start font-normal shadow-sm px-4 py-0",
                            props.className,
                            (multiple ? (Array.isArray(internalValue) && internalValue.length > 0) : internalValue) ? "" : "text-muted-foreground"
                        )}
                        onClick={(event) => {
                            event.preventDefault()
                            if (!readonly) setIsOpen(true)
                        }}
                        disabled={readonly}>
                        {renderValue(internalValue)}
                    </Button>
                    {((multiple && Array.isArray(internalValue) && internalValue.length > 0) ||
                        (!multiple && internalValue !== null)) && !readonly && (
                        <Button
                            variant={"ghost"}
                            onClick={handleClear}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            <X />
                        </Button>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-full max-w-sm">
                <Command>
                    <CommandInput
                        placeholder="Search ..."
                        value={search}
                        onValueChange={(value) => setSearch(value)}
                        disabled={readonly} />
                    <ScrollArea>
                        <CommandList>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value as string}
                                        onSelect={() => handleSelect(option.value)}
                                        className={cn("transition-all", isValueSelected(option.value) && "bg-accent")}>
                                        <Check
                                            className={cn(isValueSelected(option.value) ? "visible" : "invisible")} />
                                        {option.render ? option.render(option.label) : option.label}
                                    </CommandItem>
                                ))
                            ) : (
                                <CommandEmpty>Keine Optionen gefunden</CommandEmpty>
                            )}
                        </CommandList>
                    </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
