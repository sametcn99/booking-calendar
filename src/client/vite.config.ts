import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, "../..", "");
	const seo = {
		lang: env.VITE_SEO_LANG || "en",
		title: env.VITE_SEO_TITLE || "Booking Calendar",
		description: env.VITE_SEO_DESCRIPTION || "Personal booking calendar",
		keywords:
			env.VITE_SEO_KEYWORDS || "booking,calendar,appointments,self-hosted",
		author: env.VITE_SEO_AUTHOR || "Booking Calendar",
		ogType: env.VITE_SEO_OG_TYPE || "website",
		twitterCard: env.VITE_SEO_TWITTER_CARD || "summary",
		publicUrl: env.VITE_PUBLIC_URL || env.BASE_URL || "http://localhost:3000",
	};
	const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3000";

	return {
		envDir: "../..",
		plugins: [
			react(),
			{
				name: "inject-seo-meta",
				transformIndexHtml(html) {
					return html
						.replaceAll("__SEO_LANG__", seo.lang)
						.replaceAll("__SEO_TITLE__", seo.title)
						.replaceAll("__SEO_DESCRIPTION__", seo.description)
						.replaceAll("__SEO_KEYWORDS__", seo.keywords)
						.replaceAll("__SEO_AUTHOR__", seo.author)
						.replaceAll("__SEO_OG_TYPE__", seo.ogType)
						.replaceAll("__SEO_PUBLIC_URL__", seo.publicUrl)
						.replaceAll("__SEO_TWITTER_CARD__", seo.twitterCard);
				},
			},
			VitePWA({
				strategies: "injectManifest",
				srcDir: "src",
				filename: "sw.ts",
				devOptions: {
					enabled: true,
					type: "module",
				},
				registerType: "autoUpdate",
				manifestFilename: "site.webmanifest",
				includeAssets: [
					"favicon.ico",
					"favicon-16x16.png",
					"favicon-32x32.png",
					"apple-touch-icon.png",
					"android-chrome-192x192.png",
					"android-chrome-512x512.png",
				],
				manifest: {
					name: seo.title,
					short_name: "Booking",
					description: seo.description,
					theme_color: "#1a1025",
					background_color: "#1a1025",
					display: "standalone",
					start_url: "/",
					icons: [
						{
							src: "android-chrome-192x192.png",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "android-chrome-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "any maskable",
						},
					],
				},
				workbox: {
					globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
				},
			}),
		],
		server: {
			port: 5173,
			proxy: {
				"/api": {
					target: apiProxyTarget,
					changeOrigin: true,
				},
			},
		},
	};
});
