"use client"

import React, { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover"
import { Button } from "@/src/lib/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/src/lib/components/ui/command"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { ElementProps } from "@/src/lib/components/common/form/FormElement"

export interface SelectOption<T> {
    label: string;
    value: T;
    render?: (label: string) => React.ReactNode
}

interface SelectFieldProps<T> extends ElementProps<T> {
    options: SelectOption<T>[]
}

export const SelectField = <T, >({
                                     options,
                                     onChange,
                                     readonly,
                                     placeholder = "Select option ...",
                                     ...props
                                 }: SelectFieldProps<T>) => {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [internalValue, setInternalValue] = useState<T | null>(props.value ?? null)

    // Update internal state when external value changes
    useEffect(() => {
        if (props.value && props.value !== internalValue) {
            setInternalValue(props.value ?? null)
        }
    }, [props.value]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = (newValue: T) => {
        if (!readonly) {
            setSearch("")
            setIsOpen(false)
            onChange?.(newValue)
            setInternalValue(newValue)
        }
    }

    const handleClear = () => {
        if (!readonly) {
            setSearch("")
            onChange?.(null)
            setInternalValue(null)
        }
    }

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    const renderValue = (value: T | null) => {
        const option = options.find((option) => option.value === value)
        if (option) {
            return option.render ? option.render(option.label) : option.label
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
                        className={cn("w-full items-start justify-start font-normal", props.className, internalValue ? "" : "text-muted-foreground")}
                        onClick={(event) => {
                            event.preventDefault()
                            if (!readonly) setIsOpen(true)
                        }}
                        disabled={readonly}>
                        {renderValue(internalValue)}
                    </Button>
                    {internalValue && !readonly && (
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
                                        onSelect={() => handleSelect(option.value)}>
                                        {renderValue(option.value)}
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