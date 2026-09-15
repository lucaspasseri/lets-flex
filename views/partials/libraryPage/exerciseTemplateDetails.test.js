import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";

import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

const templatePath = path.resolve(
	"views/partials/libraryPage/exerciseTemplateDetails.ejs",
);

const imageMedia = {
	src: "/media/catalog/muscles/chest.png",
	width: 640,
	height: 480,
	alt: "Chest",
	presentation: "image",
	initial: null,
};

const initialMedia = {
	src: null,
	width: 640,
	height: 480,
	alt: "Serratus anterior — initial tile",
	presentation: "initial",
	initial: "S",
};

test("exercise detail renders every muscle group with names, roles, and shared media", async () => {
	const html = await ejs.renderFile(templatePath, {
		t: i18n.getFixedT("en"),
		template: {
			id: 42,
			baseName: "Bench press",
			details: {
				movementPattern: { name: "Horizontal push" },
				muscleTemplates: {
					groups: [
						{
							label: "Primary",
							items: [
								{
									name: "Chest",
									roleLabel: "Primary",
									media: imageMedia,
								},
							],
						},
						{
							label: "Secondary",
							items: [
								{
									name: "Triceps",
									roleLabel: "Secondary",
									media: null,
								},
							],
						},
						{
							label: "Other roles",
							items: [
								{
									name: "Serratus anterior",
									roleLabel: "Synergist",
									media: initialMedia,
								},
							],
						},
					],
					items: [],
				},
				variants: [],
			},
		},
	});

	assert.match(
		html,
		/<section class="exercise-template__muscles" aria-labelledby="exercise-template-42-muscles">/,
	);
	assert.match(html, /Muscles trained/);
	assert.match(html, /<h4[^>]*>Primary<\/h4>[\s\S]*?Chest[\s\S]*?Primary/);
	assert.match(html, /<h4[^>]*>Secondary<\/h4>[\s\S]*?Triceps[\s\S]*?Secondary/);
	assert.match(
		html,
		/<h4[^>]*>Other roles<\/h4>[\s\S]*?Serratus anterior[\s\S]*?Synergist/,
	);
	assert.match(html, /src="\/media\/catalog\/muscles\/chest\.png"/);
	assert.match(html, /data-media-presentation="initial"/);
	assert.doesNotMatch(html, /data-muscle-id|prime_mover|secondary_mover/);
});

test("exercise detail keeps the muscle section useful when relationships are absent", async () => {
	const html = await ejs.renderFile(templatePath, {
		t: i18n.getFixedT("en"),
		template: {
			id: 43,
			baseName: "Unlisted exercise",
			details: {
				movementPattern: { name: "Not specified" },
				muscleTemplates: { groups: [], items: [] },
				variants: [],
			},
		},
	});

	assert.match(html, /No muscle relationships specified\./);
	assert.doesNotMatch(html, /exercise-template__muscle-item/);
});

test("exercise detail localizes the muscle section headings", async () => {
	const html = await ejs.renderFile(templatePath, {
		t: i18n.getFixedT("pt-BR"),
		template: {
			id: 44,
			baseName: "Supino",
			details: {
				movementPattern: { name: "Empurrar" },
				muscleTemplates: {
					groups: [
						{
							label: "Principal",
							items: [
								{
									name: "Peitoral",
									roleLabel: "Principal",
									media: null,
								},
							],
						},
					],
					items: [],
				},
				variants: [],
			},
		},
	});

	assert.match(html, /Foco do treino/);
	assert.match(html, /Músculos trabalhados/);
	assert.match(html, /Principal/);
	assert.match(html, /Peitoral/);
	assert.doesNotMatch(html, /Muscles trained|Training focus|Other roles/);
});
