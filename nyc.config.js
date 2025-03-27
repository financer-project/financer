module.exports = {
    "extends": "@istanbuljs/nyc-config-typescript",
    "report-dir": ".test/coverage/",
    "all": true,
    "extension": [
        ".ts",
        ".tsx",
        ".css"
    ],
    "include": [
        "src/**/*.ts",
        "src/**/*.tsx"
    ],
    "exclude": [
        "test/**",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/route.ts"
    ],
    "reporter": [
        "text-summary",
        "json",
        "html",
        "lcov"
    ],
    "instrumenter": "nyc",
    "sourceMap": true,
    "clean": false
}