/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */
/** @typedef {import("./media.types.js").MediaManifestEntry} MediaManifestEntry */

const catalogSection = Object.freeze({
	exercise: "exercise",
	exercise_variant: "exerciseVariant",
	muscle: "muscle",
	equipment: "equipment",
	movement_pattern: "movementPattern",
});

/** @param {string} src @param {string} alt @param {string} matchType */
const mediaAsset = (src, alt, matchType) =>
	/** @type {MediaManifestEntry} */ ({
		src,
		alt,
		width: 960,
		height: 640,
		aspectRatio: 1.5,
		matchType,
		presentation: "image",
		initial: null,
	});

/**
 * @param {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} entityType
 * @param {string} entityKey
 * @param {string} path
 * @param {string} alt
 * @param {string} altPtBr
 * @param {{mimeType?: string, width?: number, height?: number}} [options]
 * @returns {CanonicalMediaManifestEntry}
 */
const canonicalAsset = (
	entityType,
	entityKey,
	path,
	alt,
	altPtBr,
	{ mimeType = "image/png", width = 1536, height = 1024 } = {},
) => ({
	entityType,
	entityKey,
	path,
	role: "primary",
	mimeType,
	width,
	height,
	source: "curated",
	alt,
	altTexts: { en: alt, "pt-BR": altPtBr },
});

const exerciseAsset = (key, filename, alt, altPtBr) =>
	canonicalAsset(
		"exercise",
		key,
		`/media/catalog/exercises/${filename}.png`,
		alt,
		altPtBr,
	);

const equipmentAsset = (key, filename, alt, altPtBr) =>
	canonicalAsset(
		"equipment",
		key,
		`/media/catalog/equipment/${filename}.png`,
		alt,
		altPtBr,
	);

const movementPatternAsset = (key, filename, alt, altPtBr) =>
	canonicalAsset(
		"movement_pattern",
		key,
		`/media/catalog/movement-patterns/${filename}.png`,
		alt,
		altPtBr,
	);

/**
 * Repository-controlled media recovered from the reviewed assignment record. UUID upload names
 * are not used as identity: each entry explicitly maps a stable catalog key to a source path and
 * complete reconstruction metadata.
 */
export const canonicalMediaManifest = Object.freeze([
	canonicalAsset(
		"exercise_variant",
		"barbell-bench-press",
		"/media/exercise-barbell-bench-press.svg",
		"Barbell bench press exercise illustration",
		"Ilustração do exercício supino com barra",
		{ mimeType: "image/svg+xml", width: 960, height: 640 },
	),
	canonicalAsset(
		"muscle",
		"chest",
		"/media/muscle-chest.svg",
		"Chest muscle illustration",
		"Ilustração do músculo peitoral",
		{ mimeType: "image/svg+xml", width: 960, height: 640 },
	),

	exerciseAsset("bench-press", "bench-press", "Bench press", "Supino"),
	exerciseAsset("push-up", "push-up", "Push-up", "Flexão de braços"),
	exerciseAsset("row", "row", "Row exercise", "Exercício de remada"),
	exerciseAsset("leg-press", "leg-press", "Leg press", "Leg press"),
	canonicalAsset(
		"exercise_variant",
		"goblet-squat",
		"/media/catalog/exercise-variants/goblet-squat.png",
		"Goblet squat",
		"Agachamento goblet",
	),
	exerciseAsset(
		"hip-extension",
		"hip-extension",
		"Hip extension",
		"Extensão de quadril",
	),
	exerciseAsset("running", "running", "Running", "Corrida"),

	equipmentAsset("barbell", "barbell", "Barbell", "Barra"),
	equipmentAsset("dumbbell", "dumbbell", "Dumbbell", "Halter"),
	equipmentAsset("kettlebell", "kettlebell", "Kettlebell", "Kettlebell"),
	equipmentAsset(
		"resistance-band",
		"resistance-band",
		"Resistance band",
		"Faixa elástica",
	),

	movementPatternAsset(
		"push",
		"push",
		"Push movement pattern",
		"Padrão de movimento de empurrar",
	),
	movementPatternAsset(
		"pull",
		"pull",
		"Pull movement pattern",
		"Padrão de movimento de puxar",
	),
	movementPatternAsset(
		"squat",
		"squat",
		"Squat movement pattern",
		"Padrão de movimento de agachar",
	),
	movementPatternAsset(
		"hinge",
		"hinge",
		"Hinge movement pattern",
		"Padrão de movimento de dobrar o quadril",
	),
	movementPatternAsset(
		"gait",
		"gait",
		"Gait movement pattern",
		"Padrão de movimento de marcha",
	),

	exerciseAsset(
		"overhead-press",
		"overhead-press",
		"Standing barbell overhead press",
		"Desenvolvimento militar com barra em pé",
	),
	exerciseAsset("pull-up", "pull-up", "Bodyweight pull-up", "Barra fixa"),
	exerciseAsset(
		"lat-pulldown",
		"lat-pulldown",
		"Seated lat pulldown",
		"Puxada na frente em máquina",
	),
	exerciseAsset(
		"deadlift",
		"deadlift",
		"Conventional barbell deadlift setup",
		"Levantamento terra convencional com barra",
	),
	exerciseAsset("squat", "squat", "Barbell back squat", "Agachamento livre com barra"),
	exerciseAsset(
		"romanian-deadlift",
		"romanian-deadlift",
		"Romanian deadlift",
		"Levantamento terra romeno",
	),
	exerciseAsset("forward-lunge", "forward-lunge", "Forward lunge", "Afundo à frente"),
	exerciseAsset("reverse-lunge", "reverse-lunge", "Reverse lunge", "Afundo reverso"),
	exerciseAsset("split-squat", "split-squat", "Split squat", "Agachamento dividido"),
	exerciseAsset("chest-fly", "chest-fly", "Chest fly", "Crucifixo"),
	exerciseAsset("lateral-raise", "lateral-raise", "Lateral raise", "Elevação lateral"),
	exerciseAsset("biceps-curl", "biceps-curl", "Biceps curl", "Rosca bíceps"),
	exerciseAsset(
		"triceps-pushdown",
		"triceps-pushdown",
		"Cable triceps pushdown",
		"Tríceps na polia",
	),

	equipmentAsset(
		"suspension-trainer-trx",
		"suspension-trainer-trx",
		"Suspension trainer",
		"Treinador de suspensão",
	),
	equipmentAsset("ab-wheel", "ab-wheel", "Ab wheel", "Roda abdominal"),
	equipmentAsset(
		"medicine-ball",
		"medicine-ball",
		"Textured medicine ball",
		"Bola medicinal texturizada",
	),
	exerciseAsset(
		"leg-extension",
		"leg-extension",
		"Seated leg extension",
		"Extensão de pernas sentada",
	),
	exerciseAsset("leg-curl", "leg-curl", "Prone leg curl", "Flexão de pernas deitado"),
	exerciseAsset("plank", "plank", "High plank", "Prancha alta"),
	exerciseAsset(
		"kettlebell-swing",
		"kettlebell-swing",
		"Two-handed kettlebell swing",
		"Balanço com kettlebell usando as duas mãos",
	),
	exerciseAsset(
		"farmer-carry",
		"farmer-carry",
		"Farmer carry with two dumbbells",
		"Caminhada do fazendeiro com dois halteres",
	),
	exerciseAsset("walking", "walking", "Brisk walking", "Caminhada acelerada"),
	exerciseAsset(
		"cycling",
		"cycling",
		"Stationary cycling",
		"Ciclismo em bicicleta ergométrica",
	),
	exerciseAsset("jump-rope", "jump-rope", "Jump rope", "Pular corda"),
	exerciseAsset(
		"elliptical-training",
		"elliptical-training",
		"Elliptical training",
		"Treino em máquina elíptica",
	),
	exerciseAsset("rowing", "rowing", "Indoor rowing", "Remo indoor"),

	equipmentAsset(
		"smith-machine",
		"smith-machine",
		"Guided-bar Smith machine",
		"Máquina Smith com barra guiada",
	),
	equipmentAsset(
		"cable-machine",
		"cable-machine",
		"Dual-pulley cable machine",
		"Máquina de cabos com polias duplas",
	),
	equipmentAsset(
		"leg-press-machine",
		"leg-press-machine",
		"45-degree sled leg press",
		"Leg press com trenó a 45 graus",
	),
	equipmentAsset(
		"chest-press-machine",
		"chest-press-machine",
		"Seated selectorized chest press",
		"Máquina de supino sentado com pilha de pesos",
	),
	equipmentAsset(
		"hack-squat-machine",
		"hack-squat-machine",
		"Plate-loaded hack squat",
		"Hack squat com carga por anilhas",
	),
	equipmentAsset(
		"leg-extension-machine",
		"leg-extension-machine",
		"Seated leg extension machine",
		"Máquina de extensão de pernas sentada",
	),
	equipmentAsset(
		"leg-curl-machine",
		"leg-curl-machine",
		"Prone leg curl machine",
		"Máquina de flexão de pernas deitado",
	),
	equipmentAsset(
		"rear-delt-machine",
		"rear-delt-machine",
		"Reverse-pec-deck rear delt machine",
		"Máquina de deltoide posterior reversa",
	),
	equipmentAsset(
		"lat-pulldown-machine",
		"lat-pulldown-machine",
		"Seated lat pulldown machine",
		"Máquina de puxada na frente sentada",
	),
	equipmentAsset(
		"pull-up-bar",
		"pull-up-bar",
		"Freestanding pull-up bar station",
		"Estação de barra fixa independente",
	),
	equipmentAsset(
		"dip-bar",
		"dip-bar",
		"Freestanding parallel dip bar station",
		"Estação de barras paralelas",
	),
	equipmentAsset(
		"jump-rope",
		"jump-rope",
		"Adjustable jump rope",
		"Corda de pular ajustável",
	),
	equipmentAsset("treadmill", "treadmill", "Motorized treadmill", "Esteira motorizada"),
	equipmentAsset(
		"stationary-bike",
		"stationary-bike",
		"Upright stationary exercise bike",
		"Bicicleta ergométrica vertical",
	),
	equipmentAsset(
		"elliptical-trainer",
		"elliptical-trainer",
		"Elliptical trainer",
		"Treinador elíptico",
	),
	equipmentAsset(
		"rowing-machine",
		"rowing-machine",
		"Indoor rowing machine",
		"Máquina de remo indoor",
	),
	equipmentAsset(
		"flat-bench",
		"flat-bench",
		"Flat weight bench",
		"Banco reto de musculação",
	),
	equipmentAsset(
		"incline-bench",
		"incline-bench",
		"Adjustable incline weight bench",
		"Banco inclinado ajustável",
	),
	equipmentAsset(
		"decline-bench",
		"decline-bench",
		"Decline weight bench with ankle rollers",
		"Banco declinado com rolos para tornozelos",
	),
	equipmentAsset(
		"squat-rack",
		"squat-rack",
		"Open-front squat rack with safety arms",
		"Rack de agachamento aberto com braços de segurança",
	),
	equipmentAsset(
		"power-rack",
		"power-rack",
		"Four-post power rack with safety pins",
		"Power rack de quatro postes com pinos de segurança",
	),

	movementPatternAsset(
		"lunge",
		"lunge",
		"Lunge movement pattern",
		"Padrão de movimento de afundo",
	),
	movementPatternAsset(
		"carry",
		"carry",
		"Loaded carry movement pattern",
		"Padrão de movimento de transporte de carga",
	),
	movementPatternAsset(
		"rotation",
		"rotation",
		"Trunk rotation movement pattern",
		"Padrão de movimento de rotação do tronco",
	),
]);

const entitySections = Object.fromEntries(
	Object.values(catalogSection).map((section) => [section, {}]),
);
for (const entry of canonicalMediaManifest) {
	const section = catalogSection[entry.entityType];
	entitySections[section][entry.entityKey] = mediaAsset(
		entry.path,
		entry.alt,
		entry.entityType,
	);
}

const initialFallback = /** @type {MediaManifestEntry} */ ({
	src: null,
	alt: "Initial fallback",
	width: 960,
	height: 640,
	aspectRatio: 1.5,
	matchType: "placeholder",
	presentation: "initial",
	initial: "?",
});

/**
 * Presentation resolver manifest. Entity sections are derived from the same canonical source
 * used by the database seed; contextual environment/category artwork remains fallback-only.
 */
export const mediaManifest = Object.freeze({
	exerciseVariant: Object.freeze(entitySections.exerciseVariant),
	exercise: Object.freeze(entitySections.exercise),
	muscle: Object.freeze(entitySections.muscle),
	equipment: Object.freeze(entitySections.equipment),
	movementPattern: Object.freeze(entitySections.movementPattern),
	environment: Object.freeze({
		gym: mediaAsset(
			"/media/environment-gym.svg",
			"Gym environment illustration",
			"environment",
		),
	}),
	category: Object.freeze({
		strength: mediaAsset(
			"/media/category-strength.svg",
			"Strength training illustration",
			"category",
		),
		cardio: mediaAsset(
			"/media/category-cardio.svg",
			"Cardio and running illustration",
			"category",
		),
		warmup: mediaAsset(
			"/media/category-warm-up.svg",
			"Warm-up movement illustration",
			"category",
		),
		mobility: mediaAsset(
			"/media/category-mobility.svg",
			"Mobility movement illustration",
			"category",
		),
		stretching: mediaAsset(
			"/media/category-stretching.svg",
			"Stretching movement illustration",
			"category",
		),
		cooldown: mediaAsset(
			"/media/category-cooldown.svg",
			"Cooldown breathing illustration",
			"category",
		),
	}),
	placeholder: initialFallback,
});

/** @param {string} value @returns {string} */
export function toMediaKey(value) {
	return value
		.normalize("NFKD")
		.toLocaleLowerCase("en-US")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
