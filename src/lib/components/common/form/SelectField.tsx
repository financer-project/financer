import React, { useState } from "react"
import { useField, useFormikContext } from "formik"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover" // Radix Popover
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command" // Radix Command
import { X } from "lucide-react" // Icon-Set für den Clear-Button
import FormElement, { FormElementProps } from "@/src/lib/components/common/form/FormElement"

export interface SearchableSelectFieldProps extends FormElementProps {
  options: { label: string; value: string }[] // Liste der verfügbaren Optionen
}

export const SelectField: React.FC<SearchableSelectFieldProps> = ({ name, label, options }) => {
  const [field, meta, helpers] = useField(name)
  const { isSubmitting } = useFormikContext()
  const [isOpen, setIsOpen] = useState(false) // Dropdown-Zustand
  const [search, setSearch] = useState("") // Lokaler Suchzustand

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
    option.label.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <FormElement name={name} label={label}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        {/* Eingabefeld */}
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <button
              type="button"
              className="w-full text-left px-3 py-2 border rounded-md focus:outline-none focus:ring pr-9"
              onClick={() => setIsOpen(!isOpen)}
            >
              {field.value
                ? options.find((option) => option.value === field.value)?.label || "Auswählen..."
                : "Auswählen..."}
            </button>

            {/* X-Button für Löschen */}
            {field.value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>

        {/* Dropdown-Inhalt */}
        <PopoverContent className="p-2 w-full max-w-sm">
          <Command>
            {/* Suchfeld */}
            <CommandInput
              placeholder="Suchen..."
              value={search}
              onValueChange={(value) => setSearch(value)}
            />

            {/* Optionen */}
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
          </Command>
        </PopoverContent>
      </Popover>
    </FormElement>
  )
}

export default SelectField
