"use client" // Error components must be Client components
import React, { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Button } from "@/src/lib/components/ui/button"

export default function DefaultError({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className={"flex flex-col w-lg h-screen justify-center items-start mx-auto gap-4"}>
            <Card className={"w-full"}>
                <CardHeader>
                    <CardTitle className={"text-destructive"}>Something went wrong!</CardTitle>
                    <CardDescription>An error has occurred.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => reset()}>
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
