import assert from "node:assert/strict";
import test from "node:test";

import {
	createMediaUrlResolver,
	createMediaUrlResolverFromEnvironment,
} from "./mediaUrl.js";

const canonicalManifest = /** @type {any} */ ([
	{
		path: "/media/catalog/exercises/bench-press.png",
		storageKey: "assets/019abc123.png",
	},
]);

test("local media reads preserve local fallback sources", () => {
	const resolveUrl = createMediaUrlResolver({
		remoteReads: false,
		canonicalManifest,
	});

	assert.equal(
		resolveUrl("assets/019abc123.png", "/media/catalog/exercises/bench-press.png"),
		"/media/catalog/exercises/bench-press.png",
	);
});

test("remote media reads map canonical legacy paths and object keys to the public URL", () => {
	const resolveUrl = createMediaUrlResolver({
		remoteReads: true,
		publicUrlBase: "https://cdn.example.test/media/",
		canonicalManifest,
	});

	assert.equal(
		resolveUrl("/media/catalog/exercises/bench-press.png"),
		"https://cdn.example.test/media/assets/019abc123.png",
	);
	assert.equal(
		resolveUrl("assets/019abc123.png"),
		"https://cdn.example.test/media/assets/019abc123.png",
	);
	assert.equal(resolveUrl("/media/uploads/local.png"), "/media/uploads/local.png");
});

test("remote URL configuration requires a safe public base and the R2 provider", () => {
	assert.throws(
		() => createMediaUrlResolver({ remoteReads: true }),
		/MEDIA_PUBLIC_URL is required/,
	);
	assert.throws(
		() =>
			createMediaUrlResolver({
				remoteReads: true,
				publicUrlBase: "https://cdn.example.test/?token=unsafe",
			}),
		/without credentials, query, or fragment/,
	);
	assert.throws(
		() =>
			createMediaUrlResolverFromEnvironment({
				OBJECT_STORAGE_PROVIDER: "unknown",
			}),
		/Unsupported media storage provider: unknown/,
	);
});

test("environment selection keeps local as the default and enables configured R2 reads", () => {
	const localResolver = createMediaUrlResolverFromEnvironment({});
	assert.equal(
		localResolver("assets/019abc123.png", "/media/local.png"),
		"/media/local.png",
	);

	const r2Resolver = createMediaUrlResolverFromEnvironment({
		OBJECT_STORAGE_PROVIDER: "r2",
		MEDIA_PUBLIC_URL: "https://cdn.example.test",
	});
	assert.equal(
		r2Resolver("assets/019abc123.png"),
		"https://cdn.example.test/assets/019abc123.png",
	);
});

test("production media URL resolution cannot fall back to local paths", () => {
	assert.throws(
		() => createMediaUrlResolverFromEnvironment({ NODE_ENV: "production" }),
		/Production media URLs require OBJECT_STORAGE_PROVIDER=r2/,
	);
});
