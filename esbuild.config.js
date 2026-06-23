// esbuild bundles each entry point into a single IIFE. TypeScript is supported
// natively (no plugins). content.ts is the injected content script; background.ts
// is the service worker.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readdirSync } from "fs";

const common = {
	bundle: true,
	target: "chrome120",
	legalComments: "none",
};

const js = { ...common, format: "iife" };

await build({
	...js,
	entryPoints: ["src/content.ts"],
	outfile: "dist/content.js",
});

await build({
	...js,
	entryPoints: ["src/background.ts"],
	outfile: "dist/background.js",
});

// esbuild inlines the @import statements of index.css into a single bundle.
await build({
	...common,
	entryPoints: ["src/presentation/styles/index.css"],
	outfile: "dist/content.css",
});

// Copy manifest and assets so dist/ is self-contained (load dist/ in Chrome
// dev mode and zip dist/ for publishing — no manual file selection needed).
copyFileSync("manifest.json", "dist/manifest.json");
mkdirSync("dist/assets", { recursive: true });
for (const file of readdirSync("assets")) {
	copyFileSync(`assets/${file}`, `dist/assets/${file}`);
}
