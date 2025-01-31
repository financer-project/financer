"use client"

import { usePaginatedQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import getHouseholds from "../queries/getHouseholds"
import { Route } from "next"
import { Button } from "@/src/lib/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"

const ITEMS_PER_PAGE = 100

export const HouseholdsList = () => {
    const searchparams = useSearchParams()!
    const page = Number(searchparams.get("page")) || 0
    const [{ households, hasMore, count }] = usePaginatedQuery(getHouseholds, {
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })
    const router = useRouter()
    const pathname = usePathname()

    const goToPreviousPage = () => {
        const params = new URLSearchParams(searchparams)
        params.set("page", (page - 1).toString())
        router.push((pathname + "?" + params.toString()) as Route)
    }
    const goToNextPage = () => {
        const params = new URLSearchParams(searchparams)
        params.set("page", (page + 1).toString())
        router.push((pathname + "?" + params.toString()) as Route)
    }

    return (
        <div className={"flex flex-col gap-4"}>
            <Card>
                <CardHeader>
                    <CardTitle className={"flex flex-row justify-between items-center"}>
                        <span>My Households ({count})</span>
                        <Button variant={"outline"}
                                asChild>
                            <Link href={"/households/new"}>
                                Create
                            </Link>
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {households.map((household) => (
                                <TableRow key={household.id}>
                                    <TableCell className={"font-semibold"}>
                                        <Link href={`/households/${household.id}`}>
                                            {household.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{household.currency}</TableCell>
                                    <TableCell>{household.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className={"flex flex-row gap-4 justify-end"}>
                <Button variant={"ghost"} disabled={page === 0} onClick={goToPreviousPage}>
                    Previous
                </Button>
                <Button variant={"ghost"} disabled={!hasMore} onClick={goToNextPage}>
                    Next
                </Button>
            </div>
        </div>
    )
}
