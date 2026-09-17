import assert from "node:assert/strict";
import test from "node:test";
import {
	assertDevelopmentR2Configuration,
	createR2MediaObjectProbe,
	createR2MediaBaselineObjectStore,
	createR2MediaStorage,
	createR2S3Client,
	getR2OperationDiagnostics,
	readR2Configuration,
	readR2ObjectProbeConfiguration,
} from "./r2Storage.js";

function createFakeClient(responses = []) {
	const commands = [];
	return {
		commands,
		async send(command) {
			commands.push(command);
			const response = responses.shift();
			if (response instanceof Error) throw response;
			return response;
		},
	};
}

test("R2 clients use path-style addressing for account-level endpoints", async () => {
	const client = createR2S3Client({
		endpoint: "https://account.r2.cloudflarestorage.com",
		accessKeyId: "access-key",
		secretAccessKey: "secret-key",
	});

	const concreteClient = /** @type {{config: {forcePathStyle: boolean}}} */ (
		/** @type {unknown} */ (client)
	);
	assert.equal(concreteClient.config.forcePathStyle, true);
});

test("development R2 configuration rejects production media and registry buckets", () => {
	assert.throws(
		() =>
			assertDevelopmentR2Configuration({
				NODE_ENV: "development",
				R2_BUCKET_NAME: "lets-flex-media-prod",
				R2_DEVELOPMENT_BUCKET_NAME: "lets-flex-media-dev",
				R2_CANONICAL_REGISTRY_BUCKET_NAME: "lets-flex-canonical-registry-dev",
			}),
		/R2_BUCKET_NAME to match R2_DEVELOPMENT_BUCKET_NAME.*selected=lets-flex-media-prod/,
	);
	assert.throws(
		() =>
			assertDevelopmentR2Configuration({
				NODE_ENV: "development",
				R2_BUCKET_NAME: "lets-flex-media-dev",
				R2_DEVELOPMENT_BUCKET_NAME: "lets-flex-media-dev",
				R2_CANONICAL_REGISTRY_BUCKET_NAME: "lets-flex-canonical-registry-prod",
			}),
		/production-scoped canonical registry bucket.*lets-flex-canonical-registry-prod/,
	);
});

test("R2 storage writes, reads, checks, deletes, and derives public URLs", async () => {
	const client = createFakeClient([
		{},
		{},
		{ Body: { transformToByteArray: async () => Uint8Array.from([1, 2, 3]) } },
		{},
	]);
	const storage = createR2MediaStorage({
		client,
		bucketName: "media-development",
		publicUrlBase: "https://cdn.example.test/media",
	});

	const stored = await storage.put(Buffer.from([1, 2, 3]), {
		extension: "PNG",
		filename: "exercise-front",
		contentType: "image/png",
	});

	assert.match(stored.storageKey, /^assets\/[0-9a-f-]{36}\.png$/iu);
	assert.equal(await storage.exists(stored.storageKey), true);
	assert.deepEqual(await storage.read(stored.storageKey), Buffer.from([1, 2, 3]));
	await storage.delete(stored.storageKey);
	assert.equal(
		storage.getPublicUrl(stored.storageKey),
		`https://cdn.example.test/media/${stored.storageKey}`,
	);

	assert.deepEqual(client.commands[0].input, {
		Bucket: "media-development",
		Key: stored.storageKey,
		Body: Buffer.from([1, 2, 3]),
		ContentType: "image/png",
	});
	assert.deepEqual(client.commands[1].input, {
		Bucket: "media-development",
		Key: stored.storageKey,
	});
	assert.deepEqual(client.commands[2].input, {
		Bucket: "media-development",
		Key: stored.storageKey,
	});
	assert.deepEqual(client.commands[3].input, {
		Bucket: "media-development",
		Key: stored.storageKey,
	});
});

test("R2 storage treats a missing head response as not found and propagates other errors", async () => {
	const missing = new Error("missing");
	missing.name = "NotFound";
	const denied = /** @type {Error & {$metadata: {httpStatusCode: number}}} */ (
		new Error("denied")
	);
	denied.$metadata = { httpStatusCode: 403 };

	const missingClient = createFakeClient([missing]);
	const missingStorage = createR2MediaStorage({
		client: missingClient,
		bucketName: "media-development",
		publicUrlBase: "https://cdn.example.test",
	});
	assert.equal(await missingStorage.exists("assets/missing.png"), false);

	const deniedClient = createFakeClient([denied]);
	const deniedStorage = createR2MediaStorage({
		client: deniedClient,
		bucketName: "media-development",
		endpoint: "https://account.r2.cloudflarestorage.com",
		publicUrlBase: "https://cdn.example.test",
	});
	await assert.rejects(
		() => deniedStorage.exists("assets/denied.png"),
		(error) => {
			const operationError = /** @type {Error & {cause?: unknown}} */ (error);
			assert.equal(operationError.name, "R2OperationError");
			assert.equal(operationError.cause, denied);
			assert.deepEqual(getR2OperationDiagnostics(operationError), {
				operation: "HeadObject",
				bucketName: "media-development",
				endpointHostname: "account.r2.cloudflarestorage.com",
				forcePathStyle: true,
				objectKey: "assets/denied.png",
				providerName: "Error",
				httpStatusCode: 403,
				providerMessage: "denied",
			});
			return true;
		},
	);
});

test("R2 object probe can preserve a definitive missing response for reset diagnostics", async () => {
	const missing = Object.assign(new Error("not found"), {
		name: "NotFound",
		$metadata: { httpStatusCode: 404 },
	});
	const probe = createR2MediaObjectProbe({
		client: createFakeClient([missing]),
		bucketName: "media-development",
		endpoint: "https://account.r2.cloudflarestorage.com",
		throwOnMissing: true,
	});

	await assert.rejects(
		() => probe.exists("assets/missing.png"),
		(error) => {
			assert.deepEqual(getR2OperationDiagnostics(error), {
				operation: "HeadObject",
				bucketName: "media-development",
				endpointHostname: "account.r2.cloudflarestorage.com",
				forcePathStyle: true,
				objectKey: "assets/missing.png",
				objectMissing: true,
				providerName: "NotFound",
				httpStatusCode: 404,
				providerMessage: "not found",
			});
			return true;
		},
	);
});

test("R2 configuration requires complete server-side settings and validates URLs", () => {
	const configuration = readR2Configuration({
		R2_BUCKET_NAME: "media-development",
		R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
		R2_REGION: "auto",
		R2_ACCESS_KEY_ID: "access-key",
		R2_SECRET_ACCESS_KEY: "secret-key",
		MEDIA_PUBLIC_URL: "https://cdn.example.test",
	});
	assert.deepEqual(configuration, {
		bucketName: "media-development",
		endpoint: "https://account.r2.cloudflarestorage.com",
		region: "auto",
		accessKeyId: "access-key",
		secretAccessKey: "secret-key",
		publicUrlBase: "https://cdn.example.test",
	});

	assert.throws(
		() => readR2Configuration({ R2_BUCKET_NAME: "media-development" }),
		/R2_ENDPOINT is required/,
	);
	assert.throws(
		() =>
			createR2MediaStorage({
				bucketName: "media-development",
				publicUrlBase: "https://cdn.example.test/?token=unsafe",
			}),
		/without credentials, query, or fragment/,
	);
});

test("R2 object probe only requires settings needed for read-only existence checks", async () => {
	const configuration = readR2ObjectProbeConfiguration({
		R2_BUCKET_NAME: "media-production",
		R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
		R2_ACCESS_KEY_ID: "access-key",
		R2_SECRET_ACCESS_KEY: "secret-key",
	});
	assert.deepEqual(configuration, {
		bucketName: "media-production",
		endpoint: "https://account.r2.cloudflarestorage.com",
		region: "auto",
		accessKeyId: "access-key",
		secretAccessKey: "secret-key",
	});

	const client = createFakeClient([{}]);
	const probe = createR2MediaObjectProbe({ ...configuration, client });
	assert.equal(await probe.exists("assets/canonical.webp"), true);
	assert.deepEqual(client.commands[0].input, {
		Bucket: "media-production",
		Key: "assets/canonical.webp",
	});
});

test("R2 baseline object store reads and conditionally creates exact keys", async () => {
	const client = createFakeClient([
		{
			Body: { transformToByteArray: async () => Uint8Array.from([1, 2]) },
			ContentType: "image/webp",
			ContentLength: 2,
			ETag: '"etag-1"',
		},
		{},
	]);
	const store = createR2MediaBaselineObjectStore({
		client,
		bucketName: "media-development",
		endpoint: "https://account.r2.cloudflarestorage.com",
		accessKeyId: "access-key",
		secretAccessKey: "secret-key",
	});

	assert.deepEqual(await store.inspect("assets/canonical.webp"), {
		bytes: Buffer.from([1, 2]),
		contentType: "image/webp",
		contentLength: 2,
		etag: '"etag-1"',
	});
	await store.putIfAbsent("assets/canonical.webp", Buffer.from([3, 4]), {
		contentType: "image/webp",
	});
	assert.deepEqual(client.commands[1].input, {
		Bucket: "media-development",
		Key: "assets/canonical.webp",
		Body: Buffer.from([3, 4]),
		ContentType: "image/webp",
		IfNoneMatch: "*",
	});
});

test("R2 storage validates object keys and ignores upload filenames", async () => {
	const storage = createR2MediaStorage({
		client: createFakeClient(),
		bucketName: "media-development",
		publicUrlBase: "https://cdn.example.test",
	});

	await assert.rejects(
		() => storage.delete("assets/../private.png"),
		/Media object key is invalid/,
	);
	assert.throws(
		() => storage.getPublicUrl("assets/image.png?download=1"),
		/Media object key is invalid/,
	);
	const stored = await storage.put(Buffer.from("image"), {
		extension: "png",
		filename: "../unsafe",
	});
	assert.match(stored.storageKey, /^assets\/[0-9a-f-]{36}\.png$/iu);
});
