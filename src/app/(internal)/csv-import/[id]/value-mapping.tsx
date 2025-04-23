import { BlitzPage, Routes } from "@blitzjs/next"
import Layout from "@/src/core/layouts/Layout"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import getCSVImport from "@/src/lib/model/csv-import/queries/getCSVImport"
import getCSVImportMappings from "@/src/lib/model/csv-import/mapping/queries/getCSVImportMappings"
import getCSVImportValueMappings from "@/src/lib/model/csv-import/value-mapping/queries/getCSVImportValueMappings"
import createCSVImportValueMapping from "@/src/lib/model/csv-import/value-mapping/mutations/createCSVImportValueMapping"
import deleteCSVImportValueMapping from "@/src/lib/model/csv-import/value-mapping/mutations/deleteCSVImportValueMapping"
import startCSVImport from "@/src/lib/model/csv-import/mutations/startCSVImport"
import { useCurrentUser } from "@/src/features/users/hooks/useCurrentUser"
import Link from "next/link"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import getCategories from "@/src/lib/model/category/queries/getCategories"
import * as path from "node:path"
import * as fs from "node:fs"
import Papa from "papaparse"

const CSVImportValueMappingPage: BlitzPage = () => {
    const router = useRouter()
    const id = router.query.id as string
    const [createCSVImportValueMappingMutation] = useMutation(createCSVImportValueMapping)
    const [deleteCSVImportValueMappingMutation] = useMutation(deleteCSVImportValueMapping)
    const [startCSVImportMutation] = useMutation(startCSVImport)
    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const currentUser = useCurrentUser()
    const [selectedMapping, setSelectedMapping] = useState<string | null>(null)
    const [uniqueValues, setUniqueValues] = useState<Record<string, string[]>>({})
    
    // Fetch the CSV import
    const [csvImport] = useQuery(getCSVImport, { id })
    
    // Fetch existing mappings
    const [{ cSVImportMappings: mappings }] = useQuery(getCSVImportMappings, { 
        where: { importId: id } 
    })

    // Fetch accounts and categories for mapping
    const [{ accounts }] = useQuery(getAccounts, { where: { householdId: csvImport?.householdId } })
    const [{ categories }] = useQuery(getCategories, { where: { householdId: csvImport?.householdId } })

    // Get mappings that might need value mapping (account, category)
    const valueMappableFields = ["account", "category"]
    const mappingsForValueMapping = mappings.filter(mapping => 
        valueMappableFields.includes(mapping.fieldName)
    )

    // Fetch existing value mappings for the selected mapping
    const [{ cSVImportValueMappings: valueMappings }] = useQuery(
        getCSVImportValueMappings, 
        { where: { mappingId: selectedMapping } },
        { enabled: !!selectedMapping }
    )

    // Load unique values from the CSV file for the selected mapping
    useEffect(() => {
        if (!selectedMapping || !csvImport) return

        const loadUniqueValues = async () => {
            try {
                const selectedMappingObj = mappings.find(m => m.id === selectedMapping)
                if (!selectedMappingObj) return

                // If we already have the unique values for this mapping, don't reload
                if (uniqueValues[selectedMappingObj.columnName]) return

                // Read the CSV file
                const importFolder = path.join(process.cwd(), "data", "imports", csvImport.id)
                const filePath = path.join(importFolder, "import.csv")
                const fileString = await fs.promises.readFile(filePath, "utf-8")

                // Parse the CSV file
                const parseResult = Papa.parse(fileString, {
                    header: true,
                    skipEmptyLines: true
                })

                if (parseResult.errors?.length > 0) {
                    console.error(`CSV parsing error: ${parseResult.errors[0].message}`)
                    return
                }

                // Extract unique values for the selected column
                const columnName = selectedMappingObj.columnName
                const values = parseResult.data.map(row => row[columnName])
                const uniqueColumnValues = [...new Set(values)].filter(Boolean)

                setUniqueValues(prev => ({
                    ...prev,
                    [columnName]: uniqueColumnValues
                }))
            } catch (error) {
                console.error("Error loading unique values:", error)
            }
        }

        loadUniqueValues()
    }, [selectedMapping, csvImport, mappings, uniqueValues])

    const onSubmit = async (data) => {
        setIsSubmitting(true)
        try {
            await createCSVImportValueMappingMutation({
                mappingId: selectedMapping!,
                originalValue: data.originalValue,
                mappedValue: data.mappedValue,
                id: data.id || undefined
            })
            reset()
        } catch (error) {
            console.error("Error creating value mapping:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteValueMapping = async (valueMappingId) => {
        try {
            await deleteCSVImportValueMappingMutation({ id: valueMappingId })
        } catch (error) {
            console.error("Error deleting value mapping:", error)
        }
    }

    const handleStartImport = async () => {
        setIsStarting(true)
        try {
            await startCSVImportMutation({ id })
            router.push(`/csv-import/${id}/import`)
        } catch (error) {
            console.error("Error starting import:", error)
            setIsStarting(false)
            alert(`Error starting import: ${error.message}`)
        }
    }

    if (!currentUser || !csvImport) {
        return <div>Loading...</div>
    }

    // Get options for the mapped value based on the field type
    const getMappedValueOptions = () => {
        if (!selectedMapping) return []
        
        const mapping = mappings.find(m => m.id === selectedMapping)
        if (!mapping) return []

        switch (mapping.fieldName) {
            case "account":
                return accounts.map(account => ({
                    id: account.id,
                    name: account.name
                }))
            case "category":
                return categories.map(category => ({
                    id: category.id,
                    name: category.name
                }))
            default:
                return []
        }
    }

    // Get the column name for the selected mapping
    const getSelectedColumnName = () => {
        if (!selectedMapping) return ""
        const mapping = mappings.find(m => m.id === selectedMapping)
        return mapping?.columnName || ""
    }

    // Get unique values for the selected column
    const getUniqueValuesForSelectedColumn = () => {
        const columnName = getSelectedColumnName()
        return uniqueValues[columnName] || []
    }

    return (
        <Layout title="Map CSV Values">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Map CSV Values to Existing Entities</h1>
                <p className="mb-4">
                    Map specific values from your CSV file to existing entities like accounts and categories.
                </p>

                {mappingsForValueMapping.length === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    No mappings found that require value mapping. You can proceed to the next step.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow sm:rounded-md mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Select a field to map values
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {mappingsForValueMapping.map((mapping) => (
                                    <button
                                        key={mapping.id}
                                        onClick={() => setSelectedMapping(mapping.id)}
                                        className={`px-4 py-3 border rounded-md text-left ${
                                            selectedMapping === mapping.id
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <p className="font-medium">
                                            {mapping.columnName} → {mapping.fieldName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {mapping.fieldName === "account" ? "Map to existing accounts" : "Map to existing categories"}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {selectedMapping && (
                    <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Value Mappings for {getSelectedColumnName()}
                                </h3>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {valueMappings.map((valueMapping) => (
                                    <li key={valueMapping.id} className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Original: <span className="font-bold">{valueMapping.originalValue}</span>
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Mapped to: <span className="font-medium">
                                                        {getMappedValueOptions().find(opt => opt.id === valueMapping.mappedValue)?.name || valueMapping.mappedValue}
                                                    </span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteValueMapping(valueMapping.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {valueMappings.length === 0 && (
                                    <li className="px-4 py-4 sm:px-6 text-gray-500">
                                        No value mappings yet. Add a mapping below.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="bg-white shadow sm:rounded-md mb-6">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Add New Value Mapping
                                </h3>
                                <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Original Value
                                        </label>
                                        <select
                                            {...register("originalValue", { required: "Original value is required" })}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Select a value</option>
                                            {getUniqueValuesForSelectedColumn().map((value) => (
                                                <option key={value} value={value}>
                                                    {value}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.originalValue && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {errors.originalValue.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Map to
                                        </label>
                                        <select
                                            {...register("mappedValue", { required: "Mapped value is required" })}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Select a value</option>
                                            {getMappedValueOptions().map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.mappedValue && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {errors.mappedValue.message}
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
                                            {isSubmitting ? "Adding..." : "Add Value Mapping"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-between">
                    <Link href={`/csv-import/${id}/mapping`}>
                        <a className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Back to Column Mapping
                        </a>
                    </Link>
                    <button
                        onClick={handleStartImport}
                        disabled={isStarting}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            isStarting && "opacity-50 cursor-not-allowed"
                        }`}
                    >
                        {isStarting ? "Starting..." : "Start Import"}
                    </button>
                </div>
            </div>
        </Layout>
    )
}

CSVImportValueMappingPage.authenticate = true

export default CSVImportValueMappingPage