import React from "react"
import { CounterpartyType } from "@prisma/client"
import {
    Banknote,
    BarChart,
    Briefcase,
    Globe,
    GraduationCap,
    Heart,
    HelpCircle,
    Home,
    Landmark,
    Lightbulb,
    PiggyBank,
    Shield,
    Stethoscope,
    Store,
    User,
    Wrench
} from "lucide-react"
import { cn } from "@/src/lib/util/utils"

// Map CounterpartyType to appropriate icon
const getCounterpartyIcon = (type: CounterpartyType) => {
    switch (type) {
        case CounterpartyType.INDIVIDUAL:
            return User
        case CounterpartyType.MERCHANT:
            return Store
        case CounterpartyType.EMPLOYER:
            return Briefcase
        case CounterpartyType.GOVERNMENT:
            return Landmark
        case CounterpartyType.UTILITY:
            return Lightbulb
        case CounterpartyType.SERVICE_PROVIDER:
            return Wrench
        case CounterpartyType.LENDER:
            return Banknote
        case CounterpartyType.BORROWER:
            return PiggyBank
        case CounterpartyType.CHARITY:
            return Heart
        case CounterpartyType.INSURANCE:
            return Shield
        case CounterpartyType.HEALTHCARE:
            return Stethoscope
        case CounterpartyType.EDUCATION:
            return GraduationCap
        case CounterpartyType.LANDLORD:
            return Home
        case CounterpartyType.INVESTMENT_FIRM:
            return BarChart
        case CounterpartyType.PLATFORM:
            return Globe
        case CounterpartyType.OTHER:
        default:
            return HelpCircle
    }
}

interface CounterpartyIconProps {
    type: CounterpartyType,
    name: string,
    className?: string
    size?: number
}

const CounterpartyIcon: React.FC<CounterpartyIconProps> = ({ type, name, className, size = 16 }) => {
    const Icon = getCounterpartyIcon(type)

    return (
        <span className={"flex items-center gap-2"}>
            <Icon className={cn("inline-block", className)} size={size} />
            {name}
        </span>
    )
}

export default CounterpartyIcon
export { getCounterpartyIcon }