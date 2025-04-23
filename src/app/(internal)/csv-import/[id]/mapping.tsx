import { BlitzPage, Routes } from "@blitzjs/next"
import Layout from "@/src/core/layouts/Layout"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useForm } from "react-hook-form"
import { useState } from "react"
import getCSVImport from "@/src/lib/model/csv-import/queries/getCSVImport"
import getCSVImportMappings from "@/src/lib/model/csv-import/mapping/queries/getCSVImportMappings"
import createCSVImportMapping from "@/src/lib/model/csv-import/mapping/mutations/createCSVImportMapping"
import deleteCSVImportMapping from "@/src/lib/model/csv-import/mapping/mutations/deleteCSVImportMapping"
import { useCurrentUser } from "@/src/features/users/hooks/useCurrentUser"
import Link from "next/link"

const CSVImportMappingPage: BlitzPage = () => {
    const router = useRouter()
    const id = router.query.id as string
    const [createCSVImportMappingMutation] = useMutation(createCSVImportMapping)
    const [deleteCSVImportMappingMutation] = useMutation(deleteCSVImportMapping)
    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const currentUser = useCurrentUser()
    
    // Fetch the CSV import
    const [csvImport] = useQuery(getCSVImport, { id })
    
    // Fetch existing mappings
    const [{ cSVImportMappings: mappings }] = useQuery(getCSVImportMappings, { 
        where: { importId: id } 
    })

    // Available fields for mapping
    const availableFields = [
        { id: "name", label: "Transaction Name", required: true },
        { id: "amount", label: "Amount" },
        { id: "valueDate", label: "Date", required: true },
        { id: "description", label: "Description" },
        { id: "type", label: "Transaction Type" },
        { id: "account", label: "Account", required: true },
        { id: "category", label: "Category" },
        { id: "household", label: "Household", required: true }
    ]

    // Check if required fields are mapped
    const requiredFields = availableFields.filter(field => field.required).map(field => field.id)
    const mappedFields = mappings.map(mapping => mapping.fieldName)
    const missingRequiredFields = requiredFields.filter(field => !mappedFields.includes(field))
    const canContinue = missingRequiredFields.length === 0

    const onSubmit = async (data) => {
        setIsSubmitting(true)
        try {
            await createCSVImportMappingMutation({
                importId: id,
                columnName: data.columnName,
                fieldName: data.fieldName
            })
            reset()
        } catch (error) {
            console.error("Error creating mapping:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteMapping = async (mappingId) => {
        try {
            await deleteCSVImportMappingMutation({ id: mappingId })
        } catch (error) {
            console.error("Error deleting mapping:", error)
        }
    }

    const handleContinue = () => {
        router.push(`/csv-import/${id}/value-mapping`)
    }

    if (!currentUser || !csvImport) {
        return <div>Loading...</div>
    }

    return (
        <Layout title="Map CSV Columns">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Map CSV Columns to Transaction Properties</h1>
                <p className="mb-4">
                    Map the columns from your CSV file to transaction properties. Required fields are marked with an asterisk (*).
                </p>

                <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
                    <ul className="divide-y divide-gray-200">
                        {mappings.map((mapping) => (
                            <li key={mapping.id} className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Column: <span className="font-bold">{mapping.columnName}</span>
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Mapped to: <span className="font-medium">{
                                                availableFields.find(f => f.id === mapping.fieldName)?.label || mapping.fieldName
                                            }</span>
                                            {availableFields.find(f => f.id === mapping.fieldName)?.required && " *"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteMapping(mapping.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                        {mappings.length === 0 && (
                            <li className="px-4 py-4 sm:px-6 text-gray-500">
                                No mappings yet. Add a mapping below.
                            </li>
                        )}
                    </ul>
                </div>

                <div className="bg-white shadow sm:rounded-md mb-6">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Add New Mapping
                        </h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CSV Column
                                </label>
                                <select
                                    {...register("columnName", { required: "Column is required" })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Select a column</option>
                                    {csvImport.columns.map((column) => (
                                        <option key={column} value={column}>
                                            {column}
                                        </option>
                                    ))}
                                </select>
                                {errors.columnName && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.columnName.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction Property
                                </label>
                                <select
                                    {...register("fieldName", { required: "Property is required" })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Select a property</option>
                                    {availableFields.map((field) => (
                                        <option key={field.id} value={field.id}>
                                            {field.label} {field.required && "*"}
                                        </option>
                                    ))}
                                </select>
                                {errors.fieldName && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.fieldName.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                        isSubmitting && "opacity-50 cursor-not-allowed"
                                    }`}
                                >
                                    {isSubmitting ? "Adding..." : "Add Mapping"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {missingRequiredFields.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Missing required fields:</strong> {missingRequiredFields.map(field => 
                                        availableFields.find(f => f.id === field)?.label
                                    ).join(", ")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between">
                    <Link href={Routes.Home()}>
                        <a className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cancel
                        </a>
                    </Link>
                    <button
                        onClick={handleContinue}
                        disabled={!canContinue}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            !canContinue && "opacity-50 cursor-not-allowed"
                        }`}
                    >
                        Continue to Value Mapping
                    </button>
                </div>
            </div>
        </Layout>
    )
}

CSVImportMappingPage.authenticate = true

export default CSVImportMappingPage