// @ts-nocheck
import nextPlugin from "@next/eslint-plugin-next"
import reactPlugin from "eslint-plugin-react"
import hooksPlugin from "eslint-plugin-react-hooks"
import ts from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import imprt from "eslint-plugin-import" // 'import' is ambiguous & prettier has trouble

export default [
    {
        plugins: {
            react: reactPlugin
        },
        rules: {
            ...reactPlugin.configs["jsx-runtime"].rules
        },
        settings: {
            react: {
                version: "detect" // You can add this if you get a warning about the React version when you lint
            }
        }
    },
    {
        plugins: {
            "react-hooks": hooksPlugin
        },
        rules: hooksPlugin.configs.recommended.rules
    },
    {
        plugins: {
            "@next/next": nextPlugin
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules
        }
    },
    {
        ignores: [".next/*"]
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: { modules: true },
                ecmaVersion: "latest",
                project: "./tsconfig.json"
            }
        },
        plugins: {
            import: imprt,
            "@typescript-eslint": ts,
            ts
        },
        rules: {
            ...ts.configs["eslint-recommended"].rules,
            ...ts.configs["recommended"].rules,
            "ts/return-await": 2
        }
    }
]