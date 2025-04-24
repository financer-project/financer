"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { formatDistance } from "date-fns"
import getImportJobs from "@/src/lib/model/imports/queries/getImportJobs"
import { ImportStatus, Prisma } from "@prisma/client"

type ImportJobWithRelations = Prisma.ImportJobGetPayload<{
    include: {
        columnMappings: true;
        valueMappings: true;
        _count: {
            select: {
                transactions: true;
            };
        };
    };
}>

export const ImportJobsList = () => {
    const router = useRouter()
    const [{ importJobs }] = useQuery(getImportJobs, {})
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

    // Set up auto-refresh for jobs that are in progress
    useEffect(() => {
        const hasJobsInProgress = importJobs.some(job =>
            job.status === ImportStatus.PENDING || job.status === ImportStatus.PROCESSING
        )

        if (hasJobsInProgress && !refreshInterval) {
            const interval = setInterval(() => {
                router.refresh()
            }, 5000) // Refresh every 5 seconds
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

    const getProgressText = (job: ImportJobWithRelations) => {
        if (job.status === ImportStatus.PROCESSING && job.totalRows && job.processedRows) {
            const percentage = Math.round((job.processedRows / job.totalRows) * 100)
            return `${job.processedRows}/${job.totalRows} (${percentage}%)`
        }
        if (job.status === ImportStatus.COMPLETED && job._count?.transactions) {
            return `${job._count.transactions} transactions`
        }
        return "-"
    }

    if (importJobs.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">No import jobs found.</p>
                    <Button onClick={() => router.push("/imports/new")}>Create New Import</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {importJobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.name}</TableCell>
                                <TableCell>{getStatusBadge(job.status)}</TableCell>
                                <TableCell>{getProgressText(job)}</TableCell>
                                <TableCell>
                                    {formatDistance(new Date(job.createdAt), new Date(), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/imports/${job.id}`)}>
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default ImportJobsList
