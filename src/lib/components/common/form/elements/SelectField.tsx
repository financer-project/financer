import React, { useState } from "react"
import { useField, useFormikContext } from "formik"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover" // Radix Popover
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/src/lib/components/ui/command" // Radix Command
import { X } from "lucide-react"
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { Button } from "@/src/lib/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"

export interface SearchableSelectFieldProps extends FormElementProps {
    options: { label: string; value: string }[] // Liste der verfügbaren Optionen
}

export const SelectField: React.FC<SearchableSelectFieldProps> = ({ name, options, ...props }) => {
    const [field, meta, helpers] = useField(name)
    const { isSubmitting } = useFormikContext()
    const [isOpen, setIsOpen] = useState(false) // Dropdown-Zustand
    const [search, setSearch] = useState("")

    helpers.setValue(props.value);

    // Bei Auswahl: Wert setzen und Dropdown schließen
    const handleSelect = (value: string) => {
        helpers.setValue(value)
        setSearch("") // Leeren des Suchtextfelds
        setIsOpen(false)
    }

    // Wert löschen
    const handleClear = () => {
        helpers.setValue("")
        setSearch("")
    }

    // Filter die Optionen basierend auf der Suche
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <FormElement name={name} {...props}>
            <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        <Button
                            variant={"outline"}
                            className={cn("w-full items-start justify-start font-normal", field.value ? "" : "text-muted-foreground")}
                            onClick={() => setIsOpen(!isOpen)}
                            onFocusCapture={() => setIsOpen(true)}
                            disabled={isSubmitting || props.readonly}>
                            {field.value
                                ? options.find((option) => option.value === field.value)?.label || "Auswählen..."
                                : "Auswählen..."}
                        </Button>

                        {field.value && (
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
                            onValueChange={(value) => setSearch(value)} />

                        <ScrollArea>
                            <CommandList>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                                            {option.label}
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
