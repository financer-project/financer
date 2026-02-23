"use client"

import { useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import { Suspense, useState } from "react"
import getSuggestedTemplates from "@/src/lib/model/transactions/queries/getSuggestedTemplates"
import { SuggestedTemplate, suggestionKey } from "@/src/lib/model/transactions/services/recurringTransactionDetector"
import Section from "@/src/lib/components/common/structure/Section"
import { Badge } from "@/src/lib/components/ui/badge"
import { Button } from "@/src/lib/components/ui/button"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import { TransactionsList } from "@/src/app/(internal)/transactions/components/TransactionsList"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Separator } from "@/src/lib/components/ui/separator"

const DISMISSED_STORAGE_KEY = "financer-dismissed-suggestions"

function getDismissedKeys(): Set<string> {
    try {
        const stored = localStorage.getItem(DISMISSED_STORAGE_KEY)
        return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
    } catch {
        return new Set()
    }
}

function persistDismissedKeys(keys: Set<string>) {
    try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...keys]))
    } catch {
        // ignore storage errors
    }
}

const frequencyLabel: Record<RecurrenceFrequency, string> = {
    [RecurrenceFrequency.DAILY]: "Daily",
    [RecurrenceFrequency.WEEKLY]: "Weekly",
    [RecurrenceFrequency.MONTHLY]: "Monthly",
    [RecurrenceFrequency.YEARLY]: "Yearly"
}

const typeVariant = (type: TransactionType): "default" | "destructive" | "secondary" => {
    if (type === TransactionType.INCOME) return "default"
    if (type === TransactionType.EXPENSE) return "destructive"
    return "secondary"
}

const confidenceVariant = (confidence: "HIGH" | "MEDIUM" | "LOW"): "default" | "secondary" | "outline" => {
    if (confidence === "HIGH") return "default"
    if (confidence === "MEDIUM") return "secondary"
    return "outline"
}

function SuggestionCard({
    suggestion,
    onDismiss
}: {
    suggestion: SuggestedTemplate
    onDismiss: () => void
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const router = useRouter()

    const handleCreate = (e: React.MouseEvent) => {
        e.stopPropagation()
        const params = new URLSearchParams({
            name: suggestion.name,
            type: suggestion.type,
            amount: suggestion.amount.toString(),
            frequency: suggestion.frequency,
            accountId: suggestion.accountId,
            startDate: suggestion.latestDate.toISOString().split("T")[0]
        })
        if (suggestion.categoryId) params.set("categoryId", suggestion.categoryId)
        if (suggestion.counterpartyId) params.set("counterpartyId", suggestion.counterpartyId)
        router.push(`/transaction-templates/new?${params.toString()}`)
    }

    const transactionIds = suggestion.transactions.map(t => t.id)

    return (
        <Card>
            <CardHeader className={"items-center cursor-pointer"}
                        onClick={() => setIsExpanded(prev => !prev)}>
                <CardTitle className={"flex flex-row gap-2 items-center"}>
                    {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    }
                    {suggestion.name}
                </CardTitle>
                <CardDescription className={"flex flex-row gap-2 pl-6"}>
                    <Badge variant={typeVariant(suggestion.type)}
                           className={"text-foreground"}>
                        {suggestion.type}
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                        {suggestion.amount.toFixed(2)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{frequencyLabel[suggestion.frequency]}</span>
                    <Badge variant={confidenceVariant(suggestion.confidence)}>
                        {suggestion.confidence}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{suggestion.occurrences} occurrences</span>
                </CardDescription>
                <CardAction>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button size="sm" onClick={handleCreate}>
                            Create Template
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onDismiss}
                            title="Dismiss suggestion"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardAction>
            </CardHeader>
            {isExpanded && (
                <>
                    <Separator />
                    <CardContent>
                        <Suspense fallback={<div>Loading...</div>}>
                            <TransactionsList
                                hideFilters
                                fixedFilters={{ id: { in: transactionIds } }}
                            />
                        </Suspense>
                    </CardContent>
                </>
            )}
        </Card>
    )
}

export function SuggestedTemplateList() {
    const [suggestions] = useQuery(getSuggestedTemplates, null)
    const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => getDismissedKeys())

    if (!suggestions || suggestions.length === 0) return null

    // Only count dismissals for suggestions that still exist (prunes stale keys from created templates)
    const currentKeys = new Set(suggestions.map(suggestionKey))
    const activeDismissedKeys = new Set([...dismissedKeys].filter(k => currentKeys.has(k)))

    const visibleSuggestions = suggestions.filter(s => !activeDismissedKeys.has(suggestionKey(s)))
    const hiddenCount = activeDismissedKeys.size

    const handleDismiss = (suggestion: SuggestedTemplate) => {
        const updated = new Set([...dismissedKeys, suggestionKey(suggestion)])
        persistDismissedKeys(updated)
        setDismissedKeys(updated)
    }

    const handleResetDismissed = () => {
        persistDismissedKeys(new Set())
        setDismissedKeys(new Set())
    }

    const countBadge = (
        <Badge variant="secondary" className="text-xs">
            {visibleSuggestions.length}
        </Badge>
    )

    const resetAction = hiddenCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleResetDismissed}>
            Show {hiddenCount} dismissed
        </Button>
    )

    return (
        <Section
            title="Suggested Templates"
            subtitle="These patterns were detected in your transaction history. Create a template with one click."
            collapsible
            defaultCollapsed
            badge={countBadge}
            actions={resetAction || undefined}
        >
            {visibleSuggestions.map((suggestion, index) => (
                <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    onDismiss={() => handleDismiss(suggestion)}
                />
            ))}
        </Section>
    )
}
