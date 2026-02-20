import { readdir } from "node:fs/promises";
import { join } from "node:path";

const CHECK_PATHS = ["src/client/src/i18n", "src/server/i18n"];

type ValidationResult = {
	path: string;
	errors: string[];
};

interface JsonSchema {
	type?: string;
	required?: string[];
	properties?: Record<string, JsonSchema>;
	additionalProperties?: boolean;
}

/**
 * Validates actual JSON data against its JSON schema structure.
 * Supports fundamental nested objects and required fields.
 */
function validateObject(
	schema: JsonSchema,
	data: unknown,
	path: string = "",
): string[] {
	const errors: string[] = [];

	const type = schema.type;
	if (type === "object") {
		if (typeof data !== "object" || data === null || Array.isArray(data)) {
			errors.push(
				`[${path || "root"}] Expected object, got ${Array.isArray(data) ? "array" : typeof data}`,
			);
			return errors;
		}

		const dataObj = data as Record<string, unknown>;

		// Check required properties from schema
		if (Array.isArray(schema.required)) {
			for (const key of schema.required) {
				if (!(key in dataObj)) {
					errors.push(`[${path || "root"}] Missing required key: ${key}`);
				}
			}
		}

		// Check properties in data for unexpected ones
		const schemaProps = schema.properties || {};
		for (const key in dataObj) {
			if (!(key in schemaProps)) {
				if (schema.additionalProperties === false) {
					errors.push(`[${path || "root"}] Unexpected key: ${key}`);
				}
				continue;
			}
			// Recurse for nested objects
			errors.push(
				...validateObject(
					schemaProps[key],
					dataObj[key],
					path ? `${path}.${key}` : key,
				),
			);
		}
	} else if (type === "string") {
		if (typeof data !== "string") {
			errors.push(`[${path}] Expected string, got ${typeof data}`);
		}
	}

	return errors;
}

async function checkI18n() {
	const allResults: ValidationResult[] = [];
	let totalErrorsCount = 0;

	for (const dirPath of CHECK_PATHS) {
		const absoluteDirPath = join(process.cwd(), dirPath);

		// Check if directory exists
		try {
			await readdir(absoluteDirPath);
		} catch {
			console.error(`⚠️  Directory not found, skipping: ${dirPath}`);
			continue;
		}

		const schemaFilePath = join(absoluteDirPath, "schema.json");
		const schemaFile = Bun.file(schemaFilePath);

		if (!(await schemaFile.exists())) {
			console.error(`❌ schema.json not found in ${dirPath}`);
			continue;
		}

		let schema: JsonSchema;
		try {
			schema = (await schemaFile.json()) as JsonSchema;
		} catch (e) {
			console.error(`❌ Failed to parse schema.json in ${dirPath}: ${e}`);
			totalErrorsCount++;
			continue;
		}

		const files = await readdir(absoluteDirPath);
		const jsonFiles = files.filter(
			(f: string) =>
				f.endsWith(".json") && f !== "schema.json" && f !== "package.json",
		);

		for (const fileName of jsonFiles) {
			const filePath = join(absoluteDirPath, fileName);
			const dataFile = Bun.file(filePath);
			let data: unknown;
			try {
				data = await dataFile.json();
			} catch (e) {
				console.error(`❌ Failed to parse ${fileName} in ${dirPath}: ${e}`);
				totalErrorsCount++;
				continue;
			}

			const errors = validateObject(schema, data);
			if (errors.length > 0) {
				allResults.push({ path: join(dirPath, fileName), errors });
				totalErrorsCount += errors.length;
			}
		}
	}

	if (allResults.length > 0) {
		console.log("\n--- i18n Validation Report ---");
		for (const res of allResults) {
			console.log(`\n❌ ${res.path}:`);
			for (const err of res.errors) {
				console.log(`  - ${err}`);
			}
		}
		console.log(`\nFound ${totalErrorsCount} errors in total.`);
		process.exit(1);
	} else {
		console.log("✅ All i18n files are valid according to their schemas.");
		process.exit(0);
	}
}

checkI18n().catch((err) => {
	console.error(err);
	process.exit(1);
});
