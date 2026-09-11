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
