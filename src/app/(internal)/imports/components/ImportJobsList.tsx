"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@blitzjs/rpc"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/src/lib/components/ui/badge"
import { DateTime } from "luxon"
import getImportJobs from "@/src/lib/model/imports/queries/getImportJobs"
import { ImportStatus } from "@prisma/client"
import { DataTable, TableColumn } from "@/src/lib/components/common/data/DataTable"
import { ImportJobModel } from "@/src/lib/model/imports/queries/getImportJob"

const ITEMS_PER_PAGE = 20
const UPDATE_INTERVAL = 2000

export const ImportJobsList = () => {
    const router = useRouter()
    const urlSearchParams = useSearchParams()
    const page = Number(urlSearchParams?.get("page") ?? 0)
    const [{ importJobs, hasMore }] = useQuery(getImportJobs, {
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

    // Set up auto-refresh for jobs that are in progress
    useEffect(() => {
        const hasJobsInProgress = importJobs.some(job =>
            job.status === ImportStatus.PENDING || job.status === ImportStatus.PROCESSING
        )

        if (hasJobsInProgress && !refreshInterval) {
            const interval = setInterval(() => {
                router.refresh()
            }, UPDATE_INTERVAL)
            setRefreshInterval(interval)
        } else if (!hasJobsInProgress && refreshInterval) {
            clearInterval(refreshInterval)
            setRefreshInterval(null)
        }

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval)
            }
        }
    }, [importJobs, refreshInterval, router])

    const getStatusBadge = (status: ImportStatus) => {
        switch (status) {
            case ImportStatus.DRAFT:
                return <Badge variant="outline">Draft</Badge>
            case ImportStatus.PENDING:
                return <Badge variant="secondary">Pending</Badge>
            case ImportStatus.PROCESSING:
                return <Badge variant="secondary" className="animate-pulse">Processing</Badge>
            case ImportStatus.COMPLETED:
                return <Badge variant="default">Completed</Badge>
            case ImportStatus.FAILED:
                return <Badge variant="destructive">Failed</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const getProgressText = (job: ImportJobModel) => {
        if (job.status === ImportStatus.PROCESSING && job.totalRows && job.processedRows) {
            const percentage = Math.round((job.processedRows / job.totalRows) * 100)
            return `${job.processedRows}/${job.totalRows} (${percentage}%)`
        }
        if (job.status === ImportStatus.COMPLETED && job._count?.transactions) {
            return `${job._count.transactions} transactions`
        }
        return "-"
    }

    const columns: TableColumn<ImportJobModel>[] = [
        {
            name: "Name",
            render: (job) => <span className="font-medium">{job.name}</span>
        },
        {
            name: "Status",
            render: (job) => getStatusBadge(job.status)
        },
        {
            name: "Progress",
            render: (job) => getProgressText(job)
        },
        {
            name: "Created",
            render: (job) => DateTime.fromJSDate(new Date(job.createdAt)).toRelative()
        }
    ]

    return (
        <DataTable
            data={importJobs}
            columns={columns}
            hasMore={hasMore}
            itemRoute={(job) => `/imports/${job.id}`} />
    )
}

export default ImportJobsList