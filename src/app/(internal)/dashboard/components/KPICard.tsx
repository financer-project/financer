"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

export type TrendDirection = "up" | "down" | "neutral"

interface KPICardProps {
    title: string
    value: string | number
    description?: string
    trend?: {
        value: number
        direction: TrendDirection
        label?: string
    }
    icon?: React.ReactNode
    className?: string
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    description,
    trend,
    icon,
    className
}) => {
    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {icon && <div className="text-muted-foreground">{icon}</div>}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <div className="flex items-center mt-2">
                        <span 
                            className={cn(
                                "flex items-center text-xs font-medium",
                                trend.direction === "up" && "text-green-500",
                                trend.direction === "down" && "text-red-500"
                            )}
                        >
                            {trend.direction === "up" && <ArrowUpIcon className="w-3 h-3 mr-1" />}
                            {trend.direction === "down" && <ArrowDownIcon className="w-3 h-3 mr-1" />}
                            {trend.value}%
                        </span>
                        {trend.label && (
                            <span className="text-xs text-muted-foreground ml-1">
                                {trend.label}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default KPICard