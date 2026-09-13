import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

import { resolveMedia } from "../../../../src/features/media/resolveMedia.js";

const templatePath = path.resolve("views/partials/shared/components/media.ejs");

test("shared media renders informative image metadata without changing the frame contract", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Bench Press",
		label: "Bench Press",
	});
	const html = await ejs.renderFile(templatePath, {
		media,
		inFrame: true,
		variant: "exercise",
	});

	assert.match(html, /class="media-frame__content media-frame--exercise"/);
	assert.match(html, /src="\/media\/exercise-bench-press\.svg"/);
	assert.match(html, /alt="Bench press exercise illustration"/);
	assert.doesNotMatch(html, /media-frame--initial/);
});

test("shared media emits native deferred-loading attributes when a collection requests them", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Bench Press",
		label: "Bench Press",
	});
	const html = await ejs.renderFile(templatePath, {
		media,
		loading: "lazy",
		decoding: "async",
	});

	assert.match(html, /loading="lazy"/);
	assert.match(html, /decoding="async"/);
});

test("shared media supports a compact density without changing the requested aspect ratio", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Bench Press",
		label: "Bench Press",
	});
	const html = await ejs.renderFile(templatePath, {
		media,
		variant: "thumbnail",
		density: "compact",
	});

	assert.match(html, /media-frame--thumbnail media-frame--compact/);
	assert.match(html, /width="960"[\s\S]*height="640"/);
});

test("shared media renders an accessible initial in the same presentation contract", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Unlisted Exercise",
		label: "Unlisted Exercise",
	});
	const html = await ejs.renderFile(templatePath, { media, inFrame: true });

	assert.match(
		html,
		/class="media-frame__initial media-frame--initial media-frame--thumbnail"/,
	);
	assert.match(html, /data-media-presentation="initial"/);
	assert.match(html, /role="img" aria-label="Unlisted Exercise — initial tile"/);
	assert.match(html, />U<\/span>/);
	assert.doesNotMatch(html, /<img/);
});

test("session-initial presentation keeps the compact icon geometry", async () => {
	const media = resolveMedia({
		entityType: "session",
		label: "Upper body session",
		presentation: "initial",
	});
	const html = await ejs.renderFile(templatePath, { media, variant: "initial" });

	assert.match(html, /class="media-frame media-frame--initial media-frame--icon"/);
	assert.doesNotMatch(html, /<img/);
});

test("exercise-preview initials retain the requested 3:2 geometry", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Unlisted Exercise",
		label: "Unlisted Exercise",
	});
	const html = await ejs.renderFile(templatePath, {
		media,
		inFrame: true,
		variant: "exercise",
	});

	assert.match(
		html,
		/class="media-frame__initial media-frame--initial media-frame--exercise"/,
	);
	assert.doesNotMatch(html, /<img/);
});

test("bounded previews use the shared contained-media variant", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Bench Press",
		label: "Bench Press",
	});
	const html = await ejs.renderFile(templatePath, {
		media,
		inFrame: true,
		variant: "preview",
	});

	assert.match(html, /class="media-frame__content media-frame--preview"/);
});

test("decorative initial media remains hidden from assistive technology", async () => {
	const media = resolveMedia({
		entityType: "exercise",
		baseName: "Unlisted Exercise",
		label: "Unlisted Exercise",
	});
	const html = await ejs.renderFile(templatePath, {
		media,
		className: "exercise-template__summary-media",
		variant: "icon",
		decorative: true,
	});

	assert.match(html, /aria-hidden="true"/);
	assert.match(html, /media-frame media-frame--initial media-frame--icon/);
	assert.doesNotMatch(html, /role="img"/);
});
