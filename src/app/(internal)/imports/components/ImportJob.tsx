"use client"

import { useQuery } from "@blitzjs/rpc"
import getImportJob from "@/src/lib/model/imports/queries/getImportJob"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer } from "@/src/lib/components/common/data/DataItemContainer"
import Section from "@/src/lib/components/common/structure/Section"
import { Badge } from "@/src/lib/components/ui/badge"
import { ColumnMapping, ImportStatus, ValueMapping } from "@prisma/client"
import { Progress } from "@/src/lib/components/ui/progress"

export const ImportJob = withFormatters(({ importJobId, formatters }: WithFormattersProps & {
    importJobId: string
}) => {
    const [importJob] = useQuery(getImportJob, { id: importJobId })

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

    const getProgressPercentage = () => {
        if (importJob.totalRows && importJob.processedRows) {
            return Math.round((importJob.processedRows / importJob.totalRows) * 100)
        }
        return 0
    }

    return (
        <div className={"flex flex-col gap-16"}>
            <Section title={"Import Information"}
                     subtitle={"Details about this import job."}
                     actions={<div>{getStatusBadge(importJob.status)}</div>}>

                <DataItemContainer>
                    <DataItem label={"Name"}
                              data={importJob.name} />

                    <DataItem label={"File Name"}
                              data={importJob.fileName ?? "N/A"} />

                    <DataItem label={"Transaction Count"}
                              data={importJob._count.transactions} />
                </DataItemContainer>

                {(importJob.status === ImportStatus.PROCESSING || importJob.status === ImportStatus.COMPLETED) && (
                    <div className={"flex flex-col gap-2"}>
                        <p>Progress:</p>
                        <div>
                            <Progress value={getProgressPercentage()} className="w-full" />
                            <div className={"flex justify-end"}>
                            <span className={"text-sm text-muted-foreground"}>
                                {importJob.processedRows ?? 0} / {importJob.totalRows ?? 0}
                            </span>
                            </div>
                        </div>
                        <p>Transactions:</p>
                        <div>
                            <Progress value={importJob._count.transactions / (importJob.totalRows ?? 0) * 100}
                                      className="w-full" />
                            <div className={"flex justify-end"}>
                            <span className={"text-sm text-muted-foreground"}>
                                {importJob._count.transactions ?? 0} / {importJob.totalRows ?? 0}
                            </span>
                            </div>
                        </div>
                    </div>
                )}

                {importJob.status === ImportStatus.FAILED && importJob.errorMessage && (
                    <DataItemContainer>
                        <DataItem label={"Error Message"}
                                  data={<span className="text-red-500">{importJob.errorMessage}</span>}
                                  className={"col-span-2"} />
                    </DataItemContainer>
                )}
            </Section>

            <Section title={"Column Mappings"}
                     subtitle={"How CSV columns are mapped to transaction fields."}>
                <div className={"grid grid-cols-3 gap-4"}>
                    {importJob.columnMappings.map((mapping: ColumnMapping) => (
                        <div key={mapping.id} className="border rounded p-4">
                            <div className="font-medium">{mapping.csvHeader}</div>
                            <div className="text-sm text-muted-foreground">
                                Mapped to: <span className="font-medium">{mapping.fieldName}</span>
                            </div>
                            {mapping.format && (
                                <div className="text-sm text-muted-foreground">
                                    Format: <span className="font-mono">{mapping.format}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

            <Section title={"Value Mappings"}
                     subtitle={"How values from the CSV are mapped to entities in the system."}>
                <div className={"grid grid-cols-3 gap-4"}>
                    {importJob.valueMappings.map((mapping: ValueMapping) => (
                        <div key={mapping.id} className="border rounded p-4">
                            <div className="font-medium">{mapping.sourceValue}</div>
                            <div className="text-sm text-muted-foreground">
                                Mapped to: <span className="font-medium">{mapping.targetType}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                ID: <span className="font-mono text-xs">{mapping.targetId}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title={"Administrative Data"}
                     subtitle={"Administrative data contains information about when this import was created and updated."}>
                <DataItemContainer>
                    <DataItem label={"Created At"}
                              data={formatters.date.format(importJob.createdAt)} />

                    <DataItem label={"Updated At"}
                              data={formatters.date.format(importJob.updatedAt)} />

                    <DataItem label={"Household"}
                              data={importJob.householdId} />
                </DataItemContainer>
            </Section>
        </div>
    )
})

export default ImportJob