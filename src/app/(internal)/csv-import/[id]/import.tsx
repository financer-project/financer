import { BlitzPage, Routes } from "@blitzjs/next"
import Layout from "@/src/core/layouts/Layout"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useState, useEffect } from "react"
import getCSVImport from "@/src/lib/model/csv-import/queries/getCSVImport"
import executeCSVImport from "@/src/lib/model/csv-import/mutations/executeCSVImport"
import { useCurrentUser } from "@/src/features/users/hooks/useCurrentUser"
import Link from "next/link"
import { ImportStatus } from "@prisma/client"

const CSVImportExecutePage: BlitzPage = () => {
    const router = useRouter()
    const id = router.query.id as string
    const [executeCSVImportMutation] = useMutation(executeCSVImport)
    const [isExecuting, setIsExecuting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const currentUser = useCurrentUser()
    
    // Fetch the CSV import
    const [csvImport, { refetch }] = useQuery(getCSVImport, { id })

    // Execute the import when the page loads if the status is IN_PROGRESS
    useEffect(() => {
        if (!csvImport || isExecuting || success || error) return

        if (csvImport.status === ImportStatus.IN_PROGRESS) {
            handleExecuteImport()
        }
    }, [csvImport])

    const handleExecuteImport = async () => {
        setIsExecuting(true)
        setError(null)
        try {
            await executeCSVImportMutation({ id })
            setSuccess(true)
            refetch()
        } catch (err) {
            console.error("Error executing import:", err)
            setError(err.message || "An error occurred during import")
            refetch()
        } finally {
            setIsExecuting(false)
        }
    }

    const getStatusBadge = () => {
        switch (csvImport?.status) {
            case ImportStatus.DRAFT:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                        Draft
                    </span>
                )
            case ImportStatus.IN_PROGRESS:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                        In Progress
                    </span>
                )
            case ImportStatus.COMPLETED:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                        Completed
                    </span>
                )
            case ImportStatus.FAILED:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                        Failed
                    </span>
                )
            default:
                return null
        }
    }

    if (!currentUser || !csvImport) {
        return <div>Loading...</div>
    }

    return (
        <Layout title="Execute CSV Import">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Import CSV Data</h1>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Import Details
                        </h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    File Name
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {csvImport.originalFileName || "N/A"}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Status
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {getStatusBadge()}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Row Count
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {csvImport.rowCount}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Created At
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(csvImport.createdAt).toLocaleString()}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Updated At
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(csvImport.updatedAt).toLocaleString()}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <strong>Error:</strong> {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-green-700">
                                    <strong>Success!</strong> The import has been completed successfully.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {csvImport.status === ImportStatus.IN_PROGRESS && isExecuting && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Processing...</strong> Your import is being processed. This may take a moment.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between">
                    <Link href={`/csv-import/${id}/value-mapping`}>
                        <a className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Back to Value Mapping
                        </a>
                    </Link>
                    
                    {csvImport.status === ImportStatus.FAILED && (
                        <button
                            onClick={handleExecuteImport}
                            disabled={isExecuting}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                isExecuting && "opacity-50 cursor-not-allowed"
                            }`}
                        >
                            {isExecuting ? "Retrying..." : "Retry Import"}
                        </button>
                    )}
                    
                    {csvImport.status === ImportStatus.COMPLETED && (
                        <Link href={Routes.Home()}>
                            <a className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Go to Dashboard
                            </a>
                        </Link>
                    )}
                </div>
            </div>
        </Layout>
    )
}

CSVImportExecutePage.authenticate = true

export default CSVImportExecutePage