import assert from "node:assert/strict";
import test from "node:test";

import { i18n } from "../../infrastructure/i18n/i18n.js";
import createMuscles from "./createMuscleViewModel.js";

const media = (request) => ({
	src: `/media/${request.entityId}.png`,
	alt: `${request.label} illustration`,
	width: 640,
	height: 480,
	aspectRatio: 4 / 3,
	matchType: "muscle",
	mediaType: "image",
	fallbackType: "none",
	presentation: "image",
	initial: null,
	entityType: "muscle",
	matchedKey: request.key,
	matchedId: request.entityId,
	isFallback: false,
});

test("exercise muscle ViewModel keeps every relationship, groups roles, and resolves media", () => {
	const requests = [];
	const viewModel = createMuscles({
		muscles: [
			{
				id: 1,
				commonName: "Chest",
				canonicalCommonName: "Chest",
				scientificName: "Pectoralis major",
				bodyRegion: "Torso",
				referenceUrl: "",
				role: { id: 1, key: "prime_mover", name: "Prime mover", description: "" },
			},
			{
				id: 2,
				commonName: "Triceps",
				canonicalCommonName: "Triceps",
				scientificName: "Triceps brachii",
				bodyRegion: "Arms",
				referenceUrl: "",
				role: {
					id: 7,
					key: "secondary_mover",
					name: "Secondary mover",
					description: "",
				},
			},
			{
				id: 3,
				commonName: "Front Delts",
				canonicalCommonName: "Front Delts",
				scientificName: "Anterior deltoid",
				bodyRegion: "Shoulders",
				referenceUrl: "",
				role: { id: 2, key: "synergist", name: "Synergist", description: "" },
			},
		],
		mediaResolver: (request) => {
			requests.push(request);
			return media(request);
		},
		translate: i18n.getFixedT("en"),
		locale: "en",
	});

	assert.deepEqual(
		viewModel.items.map(({ id, name, roleLabel, roleGroup }) => ({
			id,
			name,
			roleLabel,
			roleGroup,
		})),
		[
			{ id: 1, name: "Chest", roleLabel: "Primary", roleGroup: "primary" },
			{ id: 2, name: "Triceps", roleLabel: "Secondary", roleGroup: "secondary" },
			{ id: 3, name: "Front Delts", roleLabel: "Synergist", roleGroup: "other" },
		],
	);
	assert.deepEqual(
		viewModel.groups.map(({ key, label, items }) => ({
			key,
			label,
			count: items.length,
		})),
		[
			{ key: "primary", label: "Primary", count: 1 },
			{ key: "secondary", label: "Secondary", count: 1 },
			{ key: "other", label: "Other roles", count: 1 },
		],
	);
	assert.equal(viewModel.primary?.id, 1);
	assert.equal(viewModel.secondary?.id, 2);
	assert.deepEqual(
		requests.map(({ entityType, entityId, key, label, locale, presentation }) => ({
			entityType,
			entityId,
			key,
			label,
			locale,
			presentation,
		})),
		[
			{
				entityType: "muscle",
				entityId: 1,
				key: "Chest",
				label: "Chest",
				locale: "en",
				presentation: "image",
			},
			{
				entityType: "muscle",
				entityId: 2,
				key: "Triceps",
				label: "Triceps",
				locale: "en",
				presentation: "image",
			},
			{
				entityType: "muscle",
				entityId: 3,
				key: "Front Delts",
				label: "Front Delts",
				locale: "en",
				presentation: "image",
			},
		],
	);
});

test("exercise muscle ViewModel localizes role labels and safely handles no relationships", () => {
	const portuguese = createMuscles({
		muscles: [
			{
				id: 1,
				commonName: "Peitoral",
				scientificName: "Pectoralis major",
				bodyRegion: "Torso",
				referenceUrl: "",
				role: { id: 1, key: "prime_mover", name: "Prime mover", description: "" },
			},
			{
				id: 2,
				commonName: "Tríceps",
				scientificName: "Triceps brachii",
				bodyRegion: "Arms",
				referenceUrl: "",
				role: {
					id: 7,
					key: "secondary_mover",
					name: "Secondary mover",
					description: "",
				},
			},
		],
		translate: i18n.getFixedT("pt-BR"),
		locale: "pt-BR",
	});
	const empty = createMuscles({ muscles: [] });

	assert.deepEqual(
		portuguese.items.map(({ roleLabel }) => roleLabel),
		["Principal", "Secundário"],
	);
	assert.deepEqual(empty.items, []);
	assert.deepEqual(empty.groups, []);
	assert.equal(empty.primary, undefined);
	assert.equal(empty.secondary, undefined);
});
