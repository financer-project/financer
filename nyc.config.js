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
        "test/**"
    ],
    "reporter": [
        "text-summary",
        "json",
        "html",
        "lcov"
    ],
    "instrumenter": "nyc",
    "sourceMap": false,
    "excludeAfterRemap": false,
    "clean": false
}