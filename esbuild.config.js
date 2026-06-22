// esbuild bundles each entry point into a single IIFE. TypeScript is supported
// natively (no plugins). content.ts is the injected content script; background.ts
// is the service worker.
import { build } from "esbuild";

const common = {
	bundle: true,
	target: "chrome120",
	format: "iife",
	legalComments: "none",
};

await build({
	...common,
	entryPoints: ["src/content.ts"],
	outfile: "dist/content.js",
});

await build({
	...common,
	entryPoints: ["src/background.ts"],
	outfile: "dist/background.js",
});
