// esbuild bundles each entry point into a single IIFE. TypeScript is supported
// natively (no plugins). content.ts is the injected content script; background.ts
// is the service worker.
import { build } from "esbuild";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "fs";

function loadDotEnv(path = ".env") {
	if (!existsSync(path)) return {};

	const values = {};
	for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
		if (!match) continue;

		let value = match[2].trim();
		const quote = value[0];
		if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
			value = value.slice(1, -1);
		}
		values[match[1]] = value;
	}

	return values;
}

const env = { ...process.env, ...loadDotEnv() };

const common = {
	bundle: true,
	target: "chrome120",
	legalComments: "none",
};

const js = {
	...common,
	format: "iife",
	define: {
		__VOICE_TRANSCRIBER_INTEGRATION_TOKEN__: JSON.stringify(
			env.VOICE_TRANSCRIBER_INTEGRATION_TOKEN ?? ""
		),
	},
};

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
