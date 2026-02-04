"use client"

import React, { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover"
import { cn } from "@/src/lib/util/utils"
import { Check, Plus, X } from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@/src/lib/components/ui/command"
import { ScrollArea } from "@/src/lib/components/ui/scroll-area"
import { ElementProps } from "@/src/lib/components/common/form/FormElement"
import { Badge } from "@/src/lib/components/ui/badge"
import { Checkbox } from "@/src/lib/components/ui/checkbox"
import { Separator } from "@/src/lib/components/ui/separator"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/src/lib/components/ui/input-group"

export interface SelectOption<T> {
    label: string;
    value: T;
    render?: (label: string) => React.ReactNode
}

interface BaseSelectProps<T> extends ElementProps<T> {
    keepPlaceholder?: boolean,
    disableClearButton?: true,
    onCreateNew?: () => void,
    createNewLabel?: string
}

interface SingleSelectProps<T> extends BaseSelectProps<T> {
    multiple?: false
    options: SelectOption<T>[],
}


interface MultiSelectProps<T> extends Omit<BaseSelectProps<T[]>, "value" | "onChange"> {
    multiple: true
    options: SelectOption<T>[],
    value?: T[]
    onChange?: (value: T[]) => void,
}


export type SelectFieldProps<T> = SingleSelectProps<T> | MultiSelectProps<T>

type SelectFieldValue<T> = T | T[] | null

export function SelectField<T>(props: MultiSelectProps<T>): React.ReactElement
export function SelectField<T>(props: SingleSelectProps<T>): React.ReactElement

export function SelectField<T, >({
                                     options,
                                     onChange,
                                     readonly,
                                     placeholder = "Select option ...",
                                     multiple = false,
                                     onCreateNew,
                                     createNewLabel,
                                     ...props
                                 }: SelectFieldProps<T>) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [internalValue, setInternalValue] = useState<SelectFieldValue<T>>(
        multiple ? (props.value ?? []) : (props.value ?? null)
    )

    const onChangeMultiple = onChange as (v: T[]) => void
    const onChangeSingle = onChange as (v: T | null) => void

    // Update internal state when external value changes
    useEffect(() => {
        if (props.value !== undefined) {
            if (multiple) {
                if (Array.isArray(props.value)) {
                    setInternalValue(props.value) // eslint-disable-line react-hooks/set-state-in-effect
                } else if (props.value === null) {
                    setInternalValue([])
                } else {
                    setInternalValue([props.value])
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

                onChangeMultiple?.(updatedValues)
                setInternalValue(updatedValues)
            } else if (isValueSelected(newValue)) {
                onChangeSingle?.(null)
                setInternalValue(null)
            } else {
                setIsOpen(false)
                onChangeSingle?.(newValue)
                setInternalValue(newValue)
            }
        }
    }

    const handleClear = () => {
        if (!readonly) {
            setSearch("")
            if (multiple) {
                onChangeMultiple?.([])
                setInternalValue([])
            } else {
                onChangeSingle?.(null)
                setInternalValue(null)
            }
        }
    }

    const hasValuesSelected = () => {
        return (multiple && Array.isArray(internalValue) && internalValue.length > 0) ||
            (!multiple && internalValue !== null)
    }

    const isValueSelected = (value: T): boolean => {
        if (multiple && Array.isArray(internalValue)) {
            return internalValue.some(val => JSON.stringify(val) === JSON.stringify(value))
        }
        return JSON.stringify(internalValue) === JSON.stringify(value)
    }

    const renderButtonContent = (value: SelectFieldValue<T>) => {
        if (props.keepPlaceholder) {
            return (
                <div className="flex gap-2 items-center">
                    <span>{placeholder}</span>
                    {renderValue(value) && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            {renderValue(value)}
                        </>
                    )}
                </div>
            )
        } else {
            return renderValue(value) ?? (<span className={"text-muted-foreground"}>{placeholder}</span>)
        }
    }

    const renderValue = (value: SelectFieldValue<T>) => {
        if (multiple && Array.isArray(value) && value.length > 0) {
            return (
                <div className="flex flex-wrap gap-2">
                    {value.length > 3
                        ? <Badge variant={"secondary"}>{value.length} selected</Badge>
                        : value.map((val) => {
                            const option = options.find((opt) => JSON.stringify(opt.value) === JSON.stringify(val))
                            if (option) {
                                return (
                                    <Badge key={option.value as string} variant={"secondary"}>
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
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <PopoverTrigger asChild>
                <InputGroup
                    role="select-field"
                    className={cn(
                        "cursor-pointer shadow-sm text-sm",
                        readonly && "opacity-50 pointer-events-none",
                        props.className
                    )}
                    onClick={(event) => {
                        event.preventDefault()
                        if (!readonly) setIsOpen(true)
                    }}>
                    <div className="flex items-center flex-1 px-3 min-w-0">
                        {renderButtonContent(internalValue)}
                    </div>
                    {hasValuesSelected() && !props.disableClearButton && !readonly && (
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClear()
                                }}>
                                <X />
                            </InputGroupButton>
                        </InputGroupAddon>
                    )}
                </InputGroup>
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
                            <CommandEmpty>No options found</CommandEmpty>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value as string}
                                    keywords={[option.label]}
                                    onSelect={() => handleSelect(option.value)}
                                    className={cn("transition-all", isValueSelected(option.value) && "bg-accent")}>
                                    {multiple
                                        ? <Checkbox checked={isValueSelected(option.value)} />
                                        : <Check
                                            className={cn(isValueSelected(option.value) ? "visible" : "invisible")} />}
                                    {option.render ? option.render(option.label) : option.label}
                                </CommandItem>
                            ))}
                            {onCreateNew && (
                                <>
                                    <CommandSeparator />
                                    <CommandItem onSelect={() => { setIsOpen(false); onCreateNew(); }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {createNewLabel ?? "Create new..."}
                                    </CommandItem>
                                </>
                            )}
                        </CommandList>
                    </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
