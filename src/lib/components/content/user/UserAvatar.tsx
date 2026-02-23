"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/src/lib/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/lib/components/ui/tooltip"
import { cn } from "@/src/lib/util/utils"
import { BotIcon } from "lucide-react"

export interface UserAvatarUser {
    id: string
    firstName: string
    lastName: string
    avatarPath?: string | null
}

export interface UserAvatarProps {
    user: UserAvatarUser | null | undefined
    size?: "sm" | "md" | "lg"
    showName?: boolean
    showTooltip?: boolean
    className?: string
}

const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm"
}

export function UserAvatar({
    user,
    size = "md",
    showName = false,
    showTooltip,
    className
}: Readonly<UserAvatarProps>) {
    const shouldShowTooltip = showTooltip ?? !showName

    if (!user) {
        const systemAvatar = (
            <Avatar className={cn(sizeClasses[size], className)}>
                <AvatarFallback className="bg-muted text-muted-foreground">
                    <BotIcon className="h-3 w-3" />
                </AvatarFallback>
            </Avatar>
        )

        const systemContent = showName ? (
            <div className="flex items-center gap-2">
                {systemAvatar}
                <span className="text-sm text-muted-foreground">System</span>
            </div>
        ) : systemAvatar

        if (shouldShowTooltip) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-flex">{systemContent}</span>
                    </TooltipTrigger>
                    <TooltipContent>System</TooltipContent>
                </Tooltip>
            )
        }

        return systemContent
    }

    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    const fullName = `${user.firstName} ${user.lastName}`.trim()
    const avatarUrl = user.avatarPath ? `/api/users/avatar/${user.id}` : undefined

    const avatarElement = (
        <Avatar className={cn(sizeClasses[size], className)}>
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-muted">{initials}</AvatarFallback>
        </Avatar>
    )

    const content = showName ? (
        <div className="flex items-center gap-2">
            {avatarElement}
            <span className="text-sm">{fullName}</span>
        </div>
    ) : avatarElement

    if (shouldShowTooltip) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">{content}</span>
                </TooltipTrigger>
                <TooltipContent>{fullName}</TooltipContent>
            </Tooltip>
        )
    }

    return content
}
