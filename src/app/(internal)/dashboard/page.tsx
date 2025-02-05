import { BlitzPage } from "@blitzjs/auth"
import Header from "@/src/lib/components/content/nav/Header"

export const dynamic = "force-dynamic"

const Dashboard: BlitzPage = async () => {

    return (
        <div>
            <Header title={"Dashboard"}
                    breadcrumbs={[
                        { label: "Dashboard" }
                    ]} />

        </div>
    )
}

export default Dashboard
