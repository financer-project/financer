"use client"

import React, { useEffect, useState } from "react"
import { useField, useFormikContext } from "formik"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover" // Radix Popover
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/src/lib/components/ui/command" // Radix Command
import { X } from "lucide-react"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { Button } from "@/src/lib/components/ui/button"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SelectOption {
    label: string;
    value: string;
    render?: (label: string) => React.ReactNode
}

export interface SearchableSelectFieldProps<Entity> extends FormElementProps<Entity, string> {
    options: SelectOption[]
}

export const SelectField = <E, >({ name, options, readonly, ...props }: SearchableSelectFieldProps<E>) => {
    const [field, , helpers] = useField(name)
    const { isSubmitting } = useFormikContext()
    const [isOpen, setIsOpen] = useState(false) // Dropdown-Zustand
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (field.value === undefined) {
            helpers.setValue(null)
        }
        if (props.value !== undefined && props.value !== null && props.value !== field.value) {
            helpers.setValue(props.value)
        }
    }, [props, helpers, field])

    const handleSelect = (value: string) => {
        if (!readonly) {
            helpers.setValue(value)
            setSearch("") // Leeren des Suchtextfelds
            setIsOpen(false)
            props.onChange?.(value)
        }
    }

    const handleClear = () => {
        if (!readonly) {
            helpers.setValue(null)
            setSearch("")
            props.onChange?.(null)
        }
    }

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    const renderValue = (option: SelectOption) => {
        return option.render ? option.render(option.label) : option.label
    }

    return (
        <FormElement name={name} {...props}>
            <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        <Button
                            variant={"outline"}
                            className={cn("w-full items-start justify-start font-normal", field.value ? "" : "text-muted-foreground")}
                            onClick={(event) => {
                                event.preventDefault()
                                if (!readonly) setIsOpen(true)
                            }}
                            onFocusCapture={() => !readonly && setIsOpen(true)}
                            disabled={isSubmitting || readonly}>
                            {field.value
                                ? renderValue(options.find((option) => option.value === field.value)!)
                                : "Auswählen..."}
                        </Button>

                        {field.value && !readonly && (
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
                            placeholder="Suchen..."
                            value={search}
                            onValueChange={(value) => setSearch(value)}
                            disabled={readonly} />

                        <ScrollArea>
                            <CommandList>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => handleSelect(option.value)}>
                                            {renderValue(option)}
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
        </FormElement>
    )
}

export default SelectField
