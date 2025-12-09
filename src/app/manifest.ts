import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Financer",
        short_name: "Financer",
        description: "Personal finance dashboard and tools.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FFFFFF",
        theme_color: "#1B9889FF",
        orientation: "portrait-primary",
        icons: [
            {
                "src": "/financer-icon-full.png",
                "sizes": "512x512",
                "type": "image/png"
            },
            {
                "src": "/financer-icon-64.png",
                "sizes": "64x64",
                "type": "image/png",
                "purpose": "any"
            }
        ]
    }
}