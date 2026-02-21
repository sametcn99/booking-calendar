// https://vitepress.dev/guide/custom-theme

import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./style.css";
import ImageViewerP from "@miletorix/vitepress-image-viewer";
import "@miletorix/vitepress-image-viewer/style.css";

export default {
	extends: DefaultTheme,
	Layout: () => {
		return h(DefaultTheme.Layout, null, {
			// https://vitepress.dev/guide/extending-default-theme#layout-slots
		});
	},
	enhanceApp(ctx) {
		ImageViewerP(ctx.app); //[!code ++]
	},
} satisfies Theme;
