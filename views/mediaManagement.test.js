import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

import createMediaManagementPageViewModel from "./viewModels/mediaManagement/createMediaManagementPageViewModel.js";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);
const pagePath = path.resolve("views/mediaManagement/index.ejs");

const baseData = {
	options: [
		{ entity_type: "exercise", entity_id: 42, name: "Bench Press" },
		{ entity_type: "exercise_variant", entity_id: 84, name: "Bench Press · Home" },
	],
	assets: [
		{
			id: 7,
			width: 960,
			height: 640,
			mime_type: "image/png",
			alt_texts: { en: "Bench press" },
		},
	],
	search: "",
};

function selectedData(overrides = {}) {
	return {
		entity_type: "exercise",
		entity_id: 42,
		name: "Bench Press",
		canonical_name: "bench_press",
		parent_name: null,
		request: { locale: "en" },
		directAssignment: {
			media_asset_id: 7,
			alt_text_en: "Bench press",
			alt_text_pt_br: "Supino",
		},
		effectiveMedia: {
			src: "/media/uploads/bench.png",
			alt: "Bench press",
			width: 960,
			height: 640,
			presentation: "image",
			mediaType: "image",
			isFallback: false,
		},
		effectiveSource: "direct",
		altTexts: { en: "Bench press", "pt-BR": "Supino" },
		...overrides,
	};
}

test("media management view renders shared controls, CSRF fields, and direct status", async () => {
	const viewModel = createMediaManagementPageViewModel({
		page: { title: "Media management" },
		currentUser: { id: 1, role: "admin" },
		data: { ...baseData, selected: selectedData() },
		translate: undefined,
	});
	const html = await renderFile(pagePath, { ...viewModel, csrfToken: "csrf-value" });

	assert.match(html, /<main class="main media-management">/);
	assert.match(html, /name="entityType"/);
	assert.match(html, /name="search"/);
	assert.match(html, /media-management__result-type">Exercise<\/span>/);
	assert.match(html, /media-management__result-name">Bench Press<\/span>/);
	assert.match(html, /media-management__result-type">Global exercise variant<\/span>/);
	assert.match(html, /href="\/admin\/media\?entity=exercise%3A42"/);
	assert.match(html, /name="media" type="file"/);
	assert.match(html, /accept="image\/png,image\/jpeg,image\/webp"/);
	assert.equal((html.match(/name="_csrf"/g) ?? []).length, 3);
	assert.match(html, /This entity uses its own primary media assignment\./);
	assert.match(html, /Upload replacement/);
	assert.match(html, /Remove direct assignment/);
	assert.match(html, /for="upload-alt-en"/);
	assert.match(html, /for="existing-alt-pt-br"/);
});

test("media management view explains inherited media and hides removal when no direct assignment exists", async () => {
	const viewModel = createMediaManagementPageViewModel({
		page: { title: "Media management" },
		currentUser: { id: 1, role: "admin" },
		data: {
			...baseData,
			selected: selectedData({
				entity_type: "exercise_variant",
				entity_id: 84,
				name: "Bench Press · Home",
				parent_name: "Bench Press",
				directAssignment: undefined,
				effectiveSource: "base-exercise",
				effectiveMedia: {
					src: "/media/uploads/bench.png",
					alt: "Bench press",
					width: 960,
					height: 640,
					presentation: "image",
					mediaType: "image",
					isFallback: true,
				},
			}),
		},
	});
	const html = await renderFile(pagePath, { ...viewModel, csrfToken: "csrf-value" });

	assert.match(html, /No direct assignment is set for this entity\./);
	assert.match(html, /Base exercise: Bench Press/);
	assert.match(html, /There is no direct assignment to remove\./);
	assert.doesNotMatch(
		html,
		/name="_csrf" value="csrf-value" \/><input type="hidden" name="entityType" value="exercise_variant" \/><input type="hidden" name="entityId" value="84" \/><button class="shared-button shared-button--danger-ghost"/,
	);
});

test("media management view communicates an empty filtered result", async () => {
	const viewModel = createMediaManagementPageViewModel({
		page: { title: "Media management" },
		currentUser: { id: 1, role: "admin" },
		data: {
			...baseData,
			options: [],
			entityType: "equipment",
			search: "kettlebell",
			selected: null,
		},
	});
	const html = await renderFile(pagePath, { ...viewModel, csrfToken: "csrf-value" });

	assert.match(html, /No catalog entities match these filters\./);
	assert.match(html, /Try another name or choose All supported types\./);
	assert.doesNotMatch(html, /name="entity"/);
});

test("media management feedback renders success and failure as distinct states", async () => {
	const data = { ...baseData, selected: selectedData() };
	const success = await renderFile(pagePath, {
		...createMediaManagementPageViewModel({
			page: { title: "Media management" },
			currentUser: { id: 1, role: "admin" },
			data,
			pageFeedback: {
				tone: "success",
				eyebrow: "Success",
				title: "Media updated",
				message: "The image was uploaded and assigned to this entity.",
			},
		}),
		csrfToken: "csrf-value",
	});
	assert.match(success, /class="page-feedback page-feedback--success"/);
	assert.match(success, /role="status"/);
	assert.doesNotMatch(success, /Action not completed|Review the information/);

	const failure = await renderFile(pagePath, {
		...createMediaManagementPageViewModel({
			page: { title: "Media management" },
			currentUser: { id: 1, role: "admin" },
			data,
			pageFeedback: {
				tone: "error",
				eyebrow: "Action not completed",
				title: "Media could not be updated",
				message: "Review the information and try again.",
			},
		}),
		csrfToken: "csrf-value",
	});
	assert.match(failure, /class="page-feedback page-feedback--error"/);
	assert.match(failure, /role="alert"/);
	assert.doesNotMatch(failure, /Media updated|The image was uploaded/);
});
