import React, { useState } from "react"
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

export const SelectField = <T, >({ options, value, onChange, readonly, ...props }: SelectFieldProps<T>) => {

    const [isOpen, setIsOpen] = useState(false) // Dropdown-Zustand
    const [search, setSearch] = useState("")
    const handleSelect = (newValue: T) => {
        if (!readonly) {
            onChange?.(newValue)
            setSearch("") // Clear search field
            setIsOpen(false)
        }
    }
    const handleClear = () => {
        if (!readonly) {
            onChange?.(null)
            setSearch("")
        }
    }
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )
    const renderValue = (option: SelectOption<T>) => {
        return option.render ? option.render(option.label) : option.label
    }
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <Button
                        variant={"outline"}
                        className={cn("w-full items-start justify-start font-normal", props.className, value ? "" : "text-muted-foreground")}
                        onClick={(event) => {
                            event.preventDefault()
                            if (!readonly) setIsOpen(true)
                        }}
                        disabled={readonly}>
                        {value
                            ? renderValue(options.find((option) => option.value === value)!)
                            : "Auswählen..."}
                    </Button>
                    {value && !readonly && (
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
                                        key={option.value as string}
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
    )
}