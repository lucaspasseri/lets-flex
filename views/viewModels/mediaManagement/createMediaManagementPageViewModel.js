import createViewModelTranslator from "../translate.js";

const entityLabelKeys = Object.freeze({
	exercise: "exercise",
	exercise_variant: "exerciseVariant",
	muscle: "muscle",
	equipment: "equipment",
	movement_pattern: "movementPattern",
});

const entityTypeDefaults = Object.freeze({
	exercise: "Exercise",
	exercise_variant: "Global exercise variant",
	muscle: "Muscle",
	equipment: "Equipment",
	movement_pattern: "Movement pattern",
});

const canonicalMimeTypes = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/svg+xml",
]);

function entityLabel(t, entityType) {
	return t(`mediaManagement.entities.${entityLabelKeys[entityType] ?? "exercise"}`, {
		defaultValue: entityType,
	});
}

function entityTypeLabel(t, entityType) {
	return t(`mediaManagement.entityTypes.${entityLabelKeys[entityType] ?? "exercise"}`, {
		defaultValue: entityTypeDefaults[entityType] ?? entityType,
	});
}

function entityHref(value, entityType, search) {
	const params = [`entity=${encodeURIComponent(value)}`];
	if (entityType) params.push(`entityType=${encodeURIComponent(entityType)}`);
	if (search) params.push(`search=${encodeURIComponent(search)}`);
	return `/admin/media?${params.join("&")}`;
}

function sourceLabel(t, source) {
	const key = {
		direct: "direct",
		"base-exercise": "baseExercise",
		"movement-pattern": "movementPattern",
		environment: "environment",
		category: "category",
		initial: "initial",
	}[source];
	return t(`mediaManagement.sources.${key ?? "initial"}`, {
		defaultValue: source === "direct" ? "Direct media" : "Fallback media",
	});
}

function fieldValue(formState, name, fallback = "") {
	return formState?.values?.[name] ?? fallback;
}

function hasLocalizedCanonicalAltText(asset) {
	return [asset?.alt_text_en, asset?.alt_text_pt_br].every(
		(value) => typeof value === "string" && value.trim() !== "",
	);
}

/**
 * @param {{page: object, currentUser: object | null, data: any, formState?: any, pageFeedback?: any, translate?: Function}} input
 */
export default function createMediaManagementPageViewModel({
	page,
	currentUser,
	data,
	formState = null,
	pageFeedback = null,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const selected = data.selected;
	const direct = selected?.directAssignment ?? null;
	const locale = selected?.request?.locale ?? "en";
	const selectedEntityValue = selected
		? `${selected.entity_type}:${selected.entity_id}`
		: "";
	const selectedAssetId = fieldValue(formState, "mediaAssetId", direct?.media_asset_id);
	const canonicalStorageKey = selected?.canonicalEntry?.path ?? null;
	const canonicalStorageKeys = new Set(
		[selected?.canonicalEntry?.path, selected?.canonicalEntry?.storageKey].filter(
			(value) => typeof value === "string",
		),
	);
	const directIsCanonical = Boolean(
		direct && canonicalStorageKeys.has(direct.storage_key),
	);
	const directIsEligible = Boolean(
		direct &&
		canonicalMimeTypes.has(direct.mime_type) &&
		hasLocalizedCanonicalAltText(direct),
	);
	const entityTypeOptions = Object.entries(entityLabelKeys).map(([value]) => ({
		value,
		label: entityTypeLabel(t, value),
	}));
	const entityOptions = data.options.map((option) => ({
		value: `${option.entity_type}:${option.entity_id}`,
		id: option.entity_id,
		type: option.entity_type,
		typeLabel: entityTypeLabel(t, option.entity_type),
		name: option.name,
		label: `${entityTypeLabel(t, option.entity_type)} · ${option.name} (#${option.entity_id})`,
		href: entityHref(
			`${option.entity_type}:${option.entity_id}`,
			data.entityType ?? "",
			data.search ?? "",
		),
	}));
	const selectedSource = selected ? sourceLabel(t, selected.effectiveSource) : null;
	const generationCandidate = selected?.generationCandidate ?? null;

	return {
		page,
		shell: { currentUser, activeNavigation: "admin-media" },
		mediaManagement: {
			heading: {
				eyebrow: t("mediaManagement.eyebrow", { defaultValue: "Administration" }),
				title: t("mediaManagement.title", { defaultValue: "Media management" }),
				description: t("mediaManagement.description", {
					defaultValue:
						"Review and maintain the media assigned to supported global catalog entities.",
				}),
				meta: t("mediaManagement.adminOnly", { defaultValue: "Admin only" }),
			},
			scopeDescription: t("mediaManagement.scopeDescription", {
				defaultValue:
					"Media changes use the same resolver that powers the Library and workout surfaces. Personal variants and environment strings are outside this workflow.",
			}),
			selector: {
				entityType: data.entityType ?? "",
				entityTypeOptions,
				search: data.search ?? "",
				selected: selectedEntityValue,
				options: entityOptions,
			},
			pageFeedback,
			selected: selected
				? {
						entityType: selected.entity_type,
						entityTypeLabel: entityLabel(t, selected.entity_type),
						entityId: selected.entity_id,
						name: selected.name,
						canonicalName: selected.canonical_name,
						parentName: selected.parent_name ?? null,
						direct,
						canonicalEntry: selected.canonicalEntry ?? null,
						canonicalStorageKey,
						directIsCanonical,
						directIsEligible,
						canPromote: Boolean(direct && !directIsCanonical && directIsEligible),
						canonicalStatusLabel: directIsCanonical
							? t("mediaManagement.canonicalStatus", { defaultValue: "Canonical" })
							: direct
								? t("mediaManagement.assignedNotCanonicalStatus", {
										defaultValue: "Assigned · not canonical",
									})
								: t("mediaManagement.unassignedStatus", { defaultValue: "Unassigned" }),
						directAssetLabel: direct
							? `#${direct.media_asset_id}${direct.alt_text_en ? ` · ${direct.alt_text_en}` : ""}`
							: null,
						effectiveMedia: selected.effectiveMedia,
						effectiveSource: selectedSource,
						effectiveSourceDetail: selected.effectiveMedia.isFallback
							? t("mediaManagement.fallbackDetail", {
									defaultValue: "No direct assignment is set for this entity.",
								})
							: t("mediaManagement.directDetail", {
									defaultValue: "This entity uses its own primary media assignment.",
								}),
						locale,
						altTexts: selected.altTexts,
						entityTypeValue: selected.entity_type,
						entityValue: selected.entity_id,
						entityReference: selectedEntityValue,
						canRemove: Boolean(direct),
						canGenerate: selected.canGenerate !== false,
						generationCandidate: generationCandidate
							? {
									id: generationCandidate.id,
									previewSrc: `/admin/media/candidates/${generationCandidate.id}/file`,
									alt: t("mediaManagement.candidateAlt", {
										name: selected.name,
										defaultValue: `Generated candidate for ${selected.name}`,
									}),
									width: generationCandidate.width,
									height: generationCandidate.height,
									provider: generationCandidate.provider,
									model: generationCandidate.provider_model,
									preset: generationCandidate.preset,
								}
							: null,
					}
				: null,
			assets: data.assets.map((asset) => {
				const altText = asset.alt_texts?.[locale] ?? asset.alt_texts?.en ?? null;
				const isCanonical = canonicalStorageKeys.has(asset.storage_key);
				const isAssigned = Boolean(direct && asset.id === direct.media_asset_id);
				const status = isCanonical
					? "canonical"
					: isAssigned
						? "assigned"
						: "unassigned";
				const statusLabel = {
					canonical: t("mediaManagement.canonicalStatus", {
						defaultValue: "Canonical",
					}),
					assigned: t("mediaManagement.assignedNotCanonicalStatus", {
						defaultValue: "Assigned · not canonical",
					}),
					unassigned: t("mediaManagement.unassignedStatus", {
						defaultValue: "Unassigned",
					}),
				}[status];
				return {
					id: asset.id,
					label: `${altText ? `#${asset.id} · ${altText}` : `#${asset.id} · ${asset.width}×${asset.height} · ${asset.mime_type}`} · ${statusLabel}`,
					selected: String(asset.id) === String(selectedAssetId),
					altText,
					status,
					statusLabel,
					isCanonical,
					isAssigned,
				};
			}),
			forms: {
				upload: {
					values: {
						altTextEn: fieldValue(formState, "altTextEn", selected?.altTexts.en ?? ""),
						altTextPtBr: fieldValue(
							formState,
							"altTextPtBr",
							selected?.altTexts["pt-BR"] ?? "",
						),
					},
					errors: formState?.kind === "upload" ? formState.errors : null,
				},
				existing: {
					values: {
						mediaAssetId: fieldValue(formState, "mediaAssetId", direct?.media_asset_id),
						altTextEn: fieldValue(formState, "altTextEn", selected?.altTexts.en ?? ""),
						altTextPtBr: fieldValue(
							formState,
							"altTextPtBr",
							selected?.altTexts["pt-BR"] ?? "",
						),
					},
					errors: formState?.kind === "existing" ? formState.errors : null,
				},
				remove: {
					errors: formState?.kind === "remove" ? formState.errors : null,
				},
				canonical: {
					errors: formState?.kind === "canonical" ? formState.errors : null,
				},
				generation: {
					values: { refinement: fieldValue(formState, "refinement", "") },
					errors: formState?.kind === "generation" ? formState.errors : null,
					nonce: data.generationNonce ?? "",
				},
				approval: {
					values: {
						altTextEn: fieldValue(formState, "altTextEn", ""),
						altTextPtBr: fieldValue(formState, "altTextPtBr", ""),
					},
					errors: formState?.kind === "approval" ? formState.errors : null,
				},
			},
			sourceLabels: {
				direct: sourceLabel(t, "direct"),
				inherited: sourceLabel(t, "base-exercise"),
				fallback: sourceLabel(t, "initial"),
			},
		},
	};
}
