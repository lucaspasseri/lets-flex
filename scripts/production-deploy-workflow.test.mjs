import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const workflowPath = new URL(
	"../.github/workflows/production-deploy.yml",
	import.meta.url,
);

test("production deployment prepares production before triggering Render", async () => {
	const workflow = await readFile(workflowPath, "utf8");
	const verify = workflow.indexOf("run: npm run verify");
	const preflight = workflow.indexOf("run: npm run media:durability:preflight");
	const prepare = workflow.indexOf("run: npm run production:prepare");
	const render = workflow.indexOf("name: Trigger Render deployment");

	assert.ok(verify >= 0);
	assert.ok(preflight > verify);
	assert.ok(prepare > preflight);
	assert.ok(render > prepare);
	assert.doesNotMatch(workflow, /continue-on-error:\s*true/u);
	assert.doesNotMatch(workflow, /if:\s*.*always\(\)/u);
});

test("production preparation maps its production Environment contract explicitly", async () => {
	const workflow = await readFile(workflowPath, "utf8");
	const prepareStart = workflow.indexOf("- name: Prepare production");
	const renderStart = workflow.indexOf("- name: Trigger Render deployment");
	const prepareStep = workflow.slice(prepareStart, renderStart);

	const variableMappings = [
		"NODE_ENV",
		"DATABASE_SSL",
		"ADMIN_EMAIL",
		"MEDIA_PUBLIC_URL",
		"PRODUCTION_DATABASE_RESET_MODE",
		"R2_BUCKET_NAME",
		"R2_ENDPOINT",
		"R2_REGION",
		"R2_CANONICAL_REGISTRY_BUCKET_NAME",
		"R2_CANONICAL_REGISTRY_PREFIX",
	];
	for (const name of variableMappings)
		assert.ok(prepareStep.includes(`${name}: $` + `{{ vars.${name} }}`), name);

	const secretMappings = [
		"DATABASE_URL",
		"ADMIN_PASSWORD",
		"ALLOW_PRODUCTION_DB_RESET",
		"R2_ACCESS_KEY_ID",
		"R2_SECRET_ACCESS_KEY",
		"R2_CANONICAL_REGISTRY_ACCESS_KEY_ID",
		"R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY",
	];
	for (const name of secretMappings)
		assert.ok(prepareStep.includes(`${name}: $` + `{{ secrets.${name} }}`), name);

	assert.match(prepareStep, /run: npm run production:prepare/u);
	assert.doesNotMatch(prepareStep, /I_CONFIRM_PRODUCTION_DB_RESET/u);
	assert.doesNotMatch(prepareStep, /postgres(?:ql)?:\/\//u);
});

test("Render remains a normal startup deployment target", async () => {
	const packageJson = JSON.parse(
		await readFile(new URL("../package.json", import.meta.url), "utf8"),
	);
	const serverSource = await readFile(new URL("../server.js", import.meta.url), "utf8");

	assert.equal(packageJson.scripts.start, "node server.js");
	assert.match(serverSource, /createApp\(/u);
	assert.match(serverSource, /app\.listen\(/u);
	assert.doesNotMatch(
		serverSource,
		/production:prepare|resetAndSeedDatabase|schemaSql/u,
	);
});
