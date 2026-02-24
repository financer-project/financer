import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getImportJob, { ImportJobModel } from "@/src/lib/model/imports/queries/getImportJob"
import { ImportJob } from "../components/ImportJob"
import ImportJobHeader from "@/src/app/(internal)/imports/[importId]/header"
import { Page, PageContent } from "@/src/lib/components/content/page"

async function fetchImportJob(id: string): Promise<ImportJobModel> {
    return invoke(getImportJob, { id: id })
}

export async function generateMetadata(props: ImportJobPageProps): Promise<Metadata> {
    const params = await props.params
    const importJob = await fetchImportJob(params.importId)
    return {
        title: importJob.name
    }
}

type ImportJobPageProps = {
    params: Promise<{ importId: string }>
}

export default async function ImportDetailsPage(props: Readonly<ImportJobPageProps>) {
    const params = await props.params
    const importJob = await fetchImportJob(params.importId)

    return (
        <Page>
            <ImportJobHeader importJob={importJob} />
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <ImportJob importJobId={importJob.id} />
                </Suspense>
            </PageContent>
        </Page>
    )
}