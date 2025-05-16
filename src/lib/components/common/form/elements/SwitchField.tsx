import { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { FormikValues, useField, useFormikContext } from "formik"
import { useEffect } from "react"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Label } from "@/src/lib/components/ui/label"
import { Switch } from "@/src/lib/components/ui/switch"
import { cn } from "@/lib/utils"

interface SwitchFieldProps<E> extends FormElementProps<E, boolean> {
    showCard?: boolean
}

const SwitchField = <E, >({ name, ...props }: SwitchFieldProps<E>) => {
    const [input, , helpers] = useField<boolean>(name)
    const { isSubmitting } = useFormikContext<FormikValues>()

    useEffect(() => {
        if (input.value === undefined) {
            helpers.setValue(false)
        }

        if (props.value && props.value !== input.value) {
            helpers.setValue(props.value)
        }
    }, [props.value]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Card className={cn("w-full", props.showCard ? "" : "border-0 shadow-none")}>
            <CardContent
                className={cn("flex flex-row items-center justify-between gap-8", props.showCard ? "p-3" : "p-0")}>
                <input type="hidden" name={name as string} value={input.value.toString()} />
                <div>
                    <Label htmlFor={name as string}>
                        {props.label}
                        {props.description &&
                            <p className={"text-muted-foreground text-sm mt-1"}>{props.description}</p>}
                    </Label>

                </div>
                <Switch id={name as string}
                        checked={input.value}
                        onCheckedChange={checked => {
                            helpers.setValue(checked)
                        }}
                        disabled={isSubmitting || props.readonly} />
            </CardContent>
        </Card>
    )
}

export default SwitchField