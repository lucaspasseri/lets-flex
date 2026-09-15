import { getMuscleRoleGroup, getMuscleRoleLabel } from "../muscleRoles/presentation.js";
import { resolveMedia as resolveStaticMedia } from "../media/resolveMedia.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMuscleMapper} ExerciseTemplateMuscleMapper
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMusclesViewModel} ExerciseTemplateMusclesViewModel
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMuscleGroupViewModel} ExerciseTemplateMuscleGroupViewModel
 */

/**
 * @typedef {object} CreateMuscleTemplateInput
 * @property {ExerciseTemplateMuscleMapper[]} muscles
 * @property {Function} [mediaResolver]
 * @property {Function} [translate]
 * @property {"en" | "pt-BR"} [locale]
 */

/**
 * Project every exercise-muscle relationship into presentation-ready data. The legacy
 * `primary`/`secondary` properties remain as compatibility aliases until the template is updated
 * to consume the complete grouped collection.
 *
 * @param {CreateMuscleTemplateInput} input
 * @returns {ExerciseTemplateMusclesViewModel}
 */
function createMuscles({ muscles = [], mediaResolver, translate, locale = "en" }) {
	const t = (key, defaultValue) => translateMessage(translate, key, defaultValue);
	const resolvePresentationMedia = mediaResolver ?? resolveStaticMedia;
	const presentation = mediaResolver ? "image" : "initial";

	const items = muscles.map((muscle) => {
		const roleGroup = getMuscleRoleGroup(muscle.role);
		const roleLabel = getMuscleRoleLabel(muscle.role, translate);

		return {
			id: muscle.id,
			name: muscle.commonName,
			roleLabel,
			roleGroup,
			media: resolvePresentationMedia({
				entityType: "muscle",
				entityId: muscle.id,
				key: muscle.canonicalCommonName ?? muscle.commonName,
				label: muscle.commonName,
				locale,
				presentation,
			}),
		};
	});

	const groups = /** @type {ExerciseTemplateMuscleGroupViewModel[]} */ (
		[
			{
				key: "primary",
				label: t("library.muscleRoleGroups.primary", "Primary"),
				items: items.filter((item) => item.roleGroup === "primary"),
			},
			{
				key: "secondary",
				label: t("library.muscleRoleGroups.secondary", "Secondary"),
				items: items.filter((item) => item.roleGroup === "secondary"),
			},
			{
				key: "other",
				label: t("library.muscleRoleGroups.other", "Other roles"),
				items: items.filter((item) => item.roleGroup === "other"),
			},
		].filter((group) => group.items.length > 0)
	);

	return {
		items,
		groups,
		primary: items.find((item) => item.roleGroup === "primary"),
		secondary: items.find((item) => item.roleGroup === "secondary"),
	};
}

export default createMuscles;
