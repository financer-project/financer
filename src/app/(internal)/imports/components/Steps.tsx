"use client"

import { cn } from "@/lib/utils"

interface Step {
    id: string
    title: string
}

interface StepsProps {
    steps: Step[]
    currentStep: number
}

export const Steps = ({ steps, currentStep }: StepsProps) => {
    return (
        <div className="flex w-full py-4 relative">
            <div className={"absolute h-0.5 bg-muted w-10/12 top-1/3 left-1/12"} />
            <div className={"flex justify-between w-full"}>
                {steps.map((step, index) => (
                    <div key={step.id} className="flex relative">
                        {/* Step circle */}
                        <div className="flex flex-col items-center relative z-10">
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
                                index < currentStep
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : index === currentStep
                                        ? "border-primary bg-background text-primary"
                                        : "border-muted bg-muted text-muted-foreground"
                            )}>
                                {index < currentStep ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span
                                className={cn(
                                    "mt-2 text-xs font-medium",
                                    index <= currentStep ? "text-primary" : "text-muted-foreground"
                                )}>
                                {step.title}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}