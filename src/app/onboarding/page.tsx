"use client"

import { useEffect } from "react"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import checkOnboardingStatus from "@/src/lib/model/onboarding/queries/checkOnboardingStatus"
import { z } from "zod"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { MultiStepForm, Step } from "@/src/lib/components/common/form/MultiStepForm"
import { TextField } from "@/src/lib/components/common/form/elements/TextField"
import { PasswordField } from "@/src/lib/components/common/form/elements/PasswordField"
import { SelectFormField } from "@/src/lib/components/common/form/elements/SelectFormField"
import { TextAreaField } from "@/src/lib/components/common/form/elements/TextAreaField"
import processOnboarding from "@/src/lib/model/onboarding/mutations/processOnboarding"
import currencyCodes from "currency-codes"

// Combined schema for all onboarding steps
const OnboardingSchema = z.object({
    // Step 1: User signup
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(10, "Password must be at least 10 characters"),

    // Step 2: Household creation
    householdName: z.string().min(3, "Household name must be at least 3 characters"),
    currency: z.string().min(1, "Currency is required"),
    description: z.string().nullable().optional(),

    // Step 3: Admin settings (simplified for onboarding)
    defaultLanguage: z.string().default("en-US"),
    defaultTheme: z.string().default("light"),
    allowRegistration: z.boolean().default(true)
})

type OnboardingValues = z.infer<typeof OnboardingSchema>

export default function OnboardingPage() {
    const router = useRouter()
    const [onboardingStatus] = useQuery(checkOnboardingStatus, {})
    const [processOnboardingMutation] = useMutation(processOnboarding)

    // Route protection - redirect if onboarding is not needed
    useEffect(() => {
        if (onboardingStatus && !onboardingStatus.needsOnboarding) {
            router.push("/dashboard")
        }
    }, [onboardingStatus, router])

    // Show loading while checking onboarding status
    if (!onboardingStatus) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div>Loading...</div>
            </div>
        )
    }

    // Redirect in progress
    if (!onboardingStatus.needsOnboarding) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div>Redirecting...</div>
            </div>
        )
    }

    const handleOnboardingComplete = async (values: OnboardingValues) => {
        try {
            // Process entire onboarding in a single mutation
            await processOnboardingMutation({
                ...values,

                // Security settings with defaults
                invitationTokenExpirationHours: 72,
                resetPasswordTokenExpirationHours: 4
            })

            // Redirect to dashboard
            router.push("/dashboard")
        } catch (error) {
            console.error("Onboarding error:", error)
            throw error
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <Card>
                    <CardContent className={"pt-6"}>
                        <MultiStepForm
                            title={"Onboarding"}
                            description={"Complete your account setup and preferences"}
                            schema={OnboardingSchema}
                            onSubmit={handleOnboardingComplete}
                            initialValues={{
                                firstName: "",
                                lastName: "",
                                email: "",
                                password: "",
                                householdName: "",
                                currency: "USD",
                                description: "",
                                defaultLanguage: "en-US",
                                defaultTheme: "light",
                                allowRegistration: true
                            }}>
                            <Step
                                name="Account"
                                title="Create Your Account"
                                description="First, let's create your user account"
                                validationSchema={z.object({
                                    firstName: z.string().min(1, "First name is required"),
                                    lastName: z.string().min(1, "Last name is required"),
                                    email: z.email("Invalid email address"),
                                    password: z.string().min(10, "Password must be at least 10 characters")
                                })}>
                                <div className="flex flex-row gap-4">
                                    <div className="flex-1">
                                        <TextField
                                            type="text"
                                            label="First Name"
                                            name="firstName"
                                            placeholder="First Name"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <TextField
                                            type="text"
                                            label="Last Name"
                                            name="lastName"
                                            placeholder="Last Name"
                                            required
                                        />
                                    </div>
                                </div>

                                <TextField
                                    type="email"
                                    label="Email Address"
                                    name="email"
                                    placeholder="Email"
                                    required
                                />

                                <PasswordField
                                    name="password"
                                    label="Password"
                                    placeholder="Password"
                                    required
                                />
                            </Step>

                            <Step
                                name="Household"
                                title="Create Your Household"
                                description="Set up your household for managing finances"
                                validationSchema={z.object({
                                    householdName: z.string().min(3, "Household name must be at least 3 characters"),
                                    currency: z.string().min(1, "Currency is required")
                                })}
                            >
                                <div className="flex flex-row gap-4">
                                    <div className="flex-1">
                                        <TextField
                                            name="householdName"
                                            label="Household Name"
                                            placeholder="My Household"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <SelectFormField
                                            name="currency"
                                            label="Currency"
                                            placeholder="Select Currency"
                                            required
                                            options={currencyCodes.data.map((value) => ({
                                                value: value.code,
                                                label: `${value.currency} (${value.code})`
                                            }))}
                                        />
                                    </div>
                                </div>

                                <TextAreaField
                                    name="description"
                                    label="Description (Optional)"
                                    placeholder="Describe your household..."
                                />
                            </Step>

                            <Step
                                name="Settings"
                                title="Configure Settings"
                                description="Set your preferences and complete the setup"
                            >
                                <div className="flex flex-row gap-4">
                                    <div className="flex-1">
                                        <SelectFormField
                                            name="defaultLanguage"
                                            label="Default Language"
                                            placeholder="Select Language"
                                            options={[
                                                { value: "en-US", label: "English (US)" },
                                                { value: "en-GB", label: "English (GB)" },
                                                { value: "de-DE", label: "German" },
                                                { value: "fr-FR", label: "French" },
                                                { value: "es-ES", label: "Spanish" }
                                            ]}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <SelectFormField
                                            name="defaultTheme"
                                            label="Default Theme"
                                            placeholder="Select Theme"
                                            options={[
                                                { value: "light", label: "Light" },
                                                { value: "dark", label: "Dark" }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="allowRegistration"
                                        name="allowRegistration"
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="allowRegistration" className="text-sm font-medium">
                                        Allow user registration (others can sign up)
                                    </label>
                                </div>
                            </Step>
                        </MultiStepForm>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}