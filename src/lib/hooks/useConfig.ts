import { useEffect, useState } from "react"

interface AppConfig {
    demoData: boolean
}

const defaultConfig: AppConfig = {
    demoData: false,
}

export const useConfig = (): AppConfig => {
    const [config, setConfig] = useState<AppConfig>(defaultConfig)

    useEffect(() => {
        fetch("/api/config")
            .then((res) => res.json())
            .then((data) => setConfig(data))
            .catch(() => setConfig(defaultConfig))
    }, [])

    return config
}
