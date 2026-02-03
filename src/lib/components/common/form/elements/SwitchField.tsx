import { FormElementProps } from "@/src/lib/components/common/form/FormElement"
import { FormikValues, useField, useFormikContext } from "formik"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Switch } from "@/src/lib/components/ui/switch"
import { cn } from "@/src/lib/util/utils"
import { useFormFieldInit } from "@/src/lib/hooks/use-form-field-init"

interface SwitchFieldProps<E> extends FormElementProps<E, boolean> {
    showCard?: boolean
}

const SwitchField = <E, >({ name, ...props }: SwitchFieldProps<E>) => {
    const [field, , helpers] = useField<boolean>(name as string)
    const { isSubmitting } = useFormikContext<FormikValues>()

    useFormFieldInit<boolean>({
        fieldValue: field.value,
        propValue: props.value,
        defaultValue: false,
        helpers
    })

    return (
        <label htmlFor={name as string}>
            <Card
                className={cn("w-full transition-all", props.showCard ? "hover:bg-secondary/40" : "border-0 shadow-none bg-secondary hover:bg-secondary/60")}>
                <CardContent
                    className={cn("flex flex-row items-center justify-between gap-8 p-3")}>
                    <input type="hidden" name={name as string} value={field.value.toString()} />
                    <div>
                        <p className={"text-sm font-medium"}>{props.label}</p>
                        {props.description &&
                            <small className={"text-muted-foreground mt-1 block"}>{props.description}</small>}
                    </div>
                    <Switch id={name as string}
                            checked={field.value}
                            onCheckedChange={helpers.setValue}
                            onClick={(e) => e.stopPropagation()}
                            disabled={isSubmitting || props.readonly} />
                </CardContent>
            </Card>
        </label>

    )
}

export default SwitchField