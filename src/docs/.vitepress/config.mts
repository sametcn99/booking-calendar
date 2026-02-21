import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Booking Calendar",
	description:
		"Self-hosted, open-source appointment management system. A modern PWA built with Bun, React, and TypeORM for professionals who value privacy and control.",
	lang: "en-US",
	lastUpdated: true,
	cleanUrls: true,
	appearance: false,
	sitemap: {
		hostname: "https://booking-calendar-docs.vercel.app/",
	},
	head: [
		["link", { rel: "icon", href: "/favicon.ico" }],
		[
			"link",
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
		],
		[
			"link",
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
		],
		[
			"link",
			{ rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
		],
		["link", { rel: "manifest", href: "/manifest.json" }],
		["meta", { name: "theme-color", content: "#7c3aed" }],

		// Open Graph
		["meta", { property: "og:type", content: "website" }],
		[
			"meta",
			{
				property: "og:title",
				content: "Booking Calendar — Self-Hosted Appointment Management",
			},
		],
		[
			"meta",
			{
				property: "og:description",
				content:
					"A modern, open-source, and privacy-focused booking system for professionals. Built with Bun, React, and TypeORM.",
			},
		],
		["meta", { property: "og:image", content: "/android-chrome-512x512.png" }],
		["meta", { property: "og:site_name", content: "Booking Calendar Docs" }],
		["meta", { property: "og:locale", content: "en_US" }],

		// Twitter Card
		["meta", { name: "twitter:card", content: "summary_large_image" }],
		[
			"meta",
			{
				name: "twitter:title",
				content: "Booking Calendar — Self-Hosted Appointment Management",
			},
		],
		[
			"meta",
			{
				name: "twitter:description",
				content:
					"A modern, open-source, and privacy-focused booking system for professionals.",
			},
		],
		["meta", { name: "twitter:image", content: "/android-chrome-512x512.png" }],

		// Additional SEO
		[
			"meta",
			{
				name: "keywords",
				content:
					"booking calendar, appointment management, self-hosted, open-source, PWA, Bun, React, TypeORM, SQLite, scheduling, web push notifications",
			},
		],
		["meta", { name: "author", content: "sametcn99" }],
		["meta", { name: "robots", content: "index, follow" }],
		[
			"link",
			{
				rel: "canonical",
				href: "https://booking-calendar-docs.vercel.app/",
			},
		],
	],
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: "/favicon-32x32.png",
		siteTitle: "Booking Calendar",

		nav: [
			{ text: "Home", link: "/" },
			{ text: "Guide", link: "/guide/getting-started" },
			{ text: "Reference", link: "/reference/api" },
			{
				text: "Links",
				items: [
					{
						text: "GitHub",
						link: "https://github.com/sametcn99/booking-calendar",
					},
					{ text: "Contributing", link: "/contributing" },
				],
			},
		],

		sidebar: [
			{
				text: "Introduction",
				collapsed: false,
				items: [
					{ text: "Getting Started", link: "/guide/getting-started" },
					{ text: "Features", link: "/guide/features" },
					{ text: "Architecture", link: "/guide/architecture" },
					{ text: "Localization", link: "/guide/localization" },
					{ text: "Branding", link: "/guide/branding" },
					{ text: "Troubleshooting", link: "/guide/troubleshooting" },
				],
			},
			{
				text: "Configuration",
				collapsed: false,
				items: [
					{ text: "Environment Variables", link: "/guide/configuration" },
					{ text: "Web Push (VAPID)", link: "/guide/web-push" },
					{ text: "Email System", link: "/guide/email-system" },
				],
			},
			{
				text: "Deployment",
				collapsed: false,
				items: [
					{ text: "Docker Guide", link: "/guide/deployment-docker" },
					{ text: "Manual Installation", link: "/guide/deployment-manual" },
				],
			},
			{
				text: "Reference",
				collapsed: false,
				items: [
					{ text: "API Endpoints", link: "/reference/api" },
					{ text: "Webhook Notifications", link: "/reference/webhooks" },
					{ text: "Security Checklist", link: "/reference/security" },
				],
			},
		],

		socialLinks: [
			{ icon: "github", link: "https://github.com/sametcn99/booking-calendar" },
		],

		footer: {
			message: "Released under the GPL 3.0 License.",
		},

		search: {
			provider: "local",
		},

		editLink: {
			pattern:
				"https://github.com/sametcn99/booking-calendar/edit/main/src/docs/:path",
			text: "Edit this page on GitHub",
		},
	},
});
