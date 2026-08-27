import assert from "node:assert/strict";
import test from "node:test";
import { getUrlAndPath } from "./getUrlAndPath.js";

function run(referer) {
	const req = {
		path: "/library",
		originalUrl: "/library?sessionId=2",
		get(name) {
			if (name === "Referer") return referer;
			if (name === "host") return "example.test";
		},
	};
	const res = { locals: {} };
	let continued = false;
	getUrlAndPath(req, res, () => {
		continued = true;
	});
	return { page: res.locals.page, continued };
}

test("back navigation accepts only same-origin referrers", () => {
	assert.equal(
		run("https://example.test/programs?cycleId=4").page.backUrl,
		"/programs?cycleId=4",
	);
	assert.equal(run("https://outside.test/phishing").page.backUrl, "/");
	assert.equal(run("not a url").page.backUrl, "/");
});
