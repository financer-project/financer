import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Financer",
  description: "Documentation for Financer - Personal Finance Management",

  head: [["link", { rel: "icon", href: "/favicon.ico" }]],

  ignoreDeadLinks: [/^http:\/\/localhost/],

  vite: {
    css: {
      postcss: {},
    },
  },

  themeConfig: {
    siteTitle: "Financer Docs",

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Features", link: "/features/" },
      {
        text: "Links",
        items: [
          {
            text: "GitHub",
            link: "https://github.com/financer-project/financer",
          },
          { text: "Website", link: "https://financer-project.org" },
        ],
      },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/introduction" },
          { text: "Getting Started", link: "/getting-started" },
        ],
      },
      {
        text: "Features",
        items: [
          { text: "Overview", link: "/features/" },
          { text: "Households", link: "/features/households" },
          { text: "Accounts", link: "/features/accounts" },
          { text: "Transactions", link: "/features/transactions" },
          { text: "Categories", link: "/features/categories" },
          { text: "Tags", link: "/features/tags" },
          { text: "Counterparties", link: "/features/counterparties" },
          { text: "Dashboard & Analytics", link: "/features/dashboard" },
          { text: "CSV Import", link: "/features/import" },
        ],
      },
      {
        text: "Deployment",
        items: [
          { text: "Docker", link: "/deployment/docker" },
          { text: "Configuration", link: "/deployment/configuration" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/financer-project/financer",
      },
    ],

    footer: {
      message: "Released under the BSD 3-Clause License.",
      copyright: "Copyright © Financer Project",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/financer-project/financer-docs/edit/main/:path",
      text: "Edit this page on GitHub",
    },
  },
});
