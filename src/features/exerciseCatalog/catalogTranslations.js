import { catalogManifest, catalogVocabulary } from "./catalogManifest.js";

const portugueseExercises = Object.freeze({
	"push-up": "Flexão de braço",
	"bench-press": "Supino reto",
	"overhead-press": "Desenvolvimento",
	"pull-up": "Barra fixa",
	"lat-pulldown": "Puxada na frente",
	row: "Remada",
	"inverted-row": "Remada invertida",
	squat: "Agachamento",
	"box-squat": "Agachamento no caixote",
	"leg-press": "Leg press",
	deadlift: "Levantamento terra",
	"romanian-deadlift": "Levantamento terra romeno",
	"hip-extension": "Extensão de quadril",
	"forward-lunge": "Afundo à frente",
	"reverse-lunge": "Afundo reverso",
	"split-squat": "Agachamento dividido",
	"wood-chop": "Lenhador",
	"anti-rotation-press": "Pressão anti-rotação",
	"incline-bench-press": "Supino inclinado",
	"decline-bench-press": "Supino declinado",
	"chest-fly": "Crucifixo",
	dip: "Mergulho",
	"close-grip-bench-press": "Supino fechado",
	"chest-supported-row": "Remada com apoio no peito",
	"seated-cable-row": "Remada sentada na polia",
	"single-arm-lat-pulldown": "Puxada unilateral",
	"straight-arm-pulldown": "Puxada com braços estendidos",
	"face-pull": "Face pull",
	"lateral-raise": "Elevação lateral",
	"rear-delt-fly": "Crucifixo inverso",
	"biceps-curl": "Rosca bíceps",
	"hammer-curl": "Rosca martelo",
	"triceps-pushdown": "Tríceps na polia",
	"overhead-triceps-extension": "Extensão de tríceps acima da cabeça",
	"front-squat": "Agachamento frontal",
	"hack-squat": "Agachamento hack",
	"leg-extension": "Cadeira extensora",
	"leg-curl": "Mesa flexora",
	"good-morning": "Good morning",
	"nordic-curl": "Flexão nórdica",
	"step-up": "Subida no caixote",
	"cable-kickback": "Coice na polia",
	"standing-calf-raise": "Elevação de panturrilha em pé",
	"seated-calf-raise": "Elevação de panturrilha sentado",
	plank: "Prancha",
	"dead-bug": "Dead bug",
	"hanging-knee-raise": "Elevação de joelhos suspenso",
	"ab-rollout": "Rolamento abdominal",
	"power-clean": "Power clean",
	"kettlebell-swing": "Balanço com kettlebell",
	"farmer-carry": "Caminhada do fazendeiro",
	"push-press": "Push press",
	"dynamic-march": "Marcha dinâmica",
	"jumping-jack": "Polichinelo",
	inchworm: "Minhoca",
	"high-knees": "Joelhos altos",
	"arm-circles": "Círculos com os braços",
	"world-s-greatest-stretch": "Maior alongamento do mundo",
	"cat-cow": "Gato-vaca",
	"thoracic-rotation": "Rotação torácica",
	"90-90-hip-switch": "Alternância de quadril 90/90",
	"ankle-rock": "Balanço de tornozelo",
	"hamstring-stretch": "Alongamento dos posteriores de coxa",
	"couch-stretch": "Alongamento no sofá",
	"child-s-pose": "Postura da criança",
	"shoulder-car": "CAR do ombro",
	"cooldown-breathing": "Respiração de volta à calma",
	running: "Corrida",
	walking: "Caminhada",
	"easy-jog": "Trote leve",
	"recovery-walk": "Caminhada de recuperação",
	cycling: "Ciclismo",
	"jump-rope": "Pular corda",
	"shuttle-run": "Corrida de ida e volta",
	"elliptical-training": "Treino no elíptico",
	rowing: "Remo",
	"balance-reach": "Alcance em apoio unipodal",
	"bear-crawl": "Engatinhar do urso",
});

const portugueseExerciseVariants = Object.freeze({
	"bodyweight-push-up": "Flexão de braço com peso corporal",
	"resistance-band-push-up": "Flexão de braço com faixa elástica",
	"barbell-bench-press": "Supino reto com barra",
	"dumbbell-bench-press": "Supino reto com halteres",
	"barbell-overhead-press": "Desenvolvimento com barra",
	"dumbbell-overhead-press": "Desenvolvimento com halteres",
	"bodyweight-pull-up": "Barra fixa com peso corporal",
	"band-assisted-pull-up": "Barra fixa assistida com faixa elástica",
	"machine-lat-pulldown": "Puxada na máquina",
	"resistance-band-lat-pulldown": "Puxada com faixa elástica",
	"barbell-bent-over-row": "Remada curvada com barra",
	"one-arm-dumbbell-row": "Remada unilateral com halter",
	"suspension-trainer-inverted-row": "Remada invertida no TRX",
	"bar-inverted-row": "Remada invertida com barra",
	"barbell-back-squat": "Agachamento livre com barra",
	"goblet-squat": "Agachamento goblet",
	"bodyweight-box-squat": "Agachamento no caixote com peso corporal",
	"dumbbell-box-squat": "Agachamento no caixote com halteres",
	"bilateral-leg-press": "Leg press bilateral",
	"single-leg-press": "Leg press unilateral",
	"barbell-deadlift": "Levantamento terra com barra",
	"kettlebell-deadlift": "Levantamento terra com kettlebell",
	"barbell-romanian-deadlift": "Levantamento terra romeno com barra",
	"dumbbell-romanian-deadlift": "Levantamento terra romeno com halteres",
	"bodyweight-glute-bridge": "Ponte de glúteos com peso corporal",
	"barbell-hip-thrust": "Elevação pélvica com barra",
	"bodyweight-forward-lunge": "Afundo à frente com peso corporal",
	"dumbbell-forward-lunge": "Afundo à frente com halteres",
	"bodyweight-reverse-lunge": "Afundo reverso com peso corporal",
	"dumbbell-reverse-lunge": "Afundo reverso com halteres",
	"bodyweight-split-squat": "Agachamento dividido com peso corporal",
	"dumbbell-split-squat": "Agachamento dividido com halteres",
	"cable-wood-chop": "Lenhador na polia",
	"resistance-band-wood-chop": "Lenhador com faixa elástica",
	"cable-anti-rotation-press": "Pressão anti-rotação na polia",
	"resistance-band-anti-rotation-press": "Pressão anti-rotação com faixa elástica",
	"barbell-incline-bench-press": "Supino inclinado com barra",
	"dumbbell-incline-bench-press": "Supino inclinado com halteres",
	"smith-machine-incline-press": "Supino inclinado no Smith",
	"barbell-decline-bench-press": "Supino declinado com barra",
	"dumbbell-decline-bench-press": "Supino declinado com halteres",
	"cable-chest-fly": "Crucifixo na polia",
	"dumbbell-chest-fly": "Crucifixo com halteres",
	"bodyweight-dip": "Mergulho com peso corporal",
	"band-assisted-dip": "Mergulho assistido com faixa elástica",
	"barbell-close-grip-bench-press": "Supino fechado com barra",
	"smith-machine-close-grip-press": "Supino fechado no Smith",
	"dumbbell-chest-supported-row": "Remada com apoio no peito e halteres",
	"machine-chest-supported-row": "Remada com apoio no peito na máquina",
	"close-grip-seated-cable-row": "Remada sentada fechada na polia",
	"single-arm-cable-lat-pulldown": "Puxada unilateral na polia",
	"cable-straight-arm-pulldown": "Puxada com braços estendidos na polia",
	"band-straight-arm-pulldown": "Puxada com braços estendidos e faixa elástica",
	"cable-face-pull": "Face pull na polia",
	"band-face-pull": "Face pull com faixa elástica",
	"dumbbell-lateral-raise": "Elevação lateral com halteres",
	"cable-lateral-raise": "Elevação lateral na polia",
	"dumbbell-rear-delt-fly": "Crucifixo inverso com halteres",
	"machine-rear-delt-fly": "Crucifixo inverso na máquina",
	"barbell-biceps-curl": "Rosca bíceps com barra",
	"dumbbell-hammer-curl": "Rosca martelo com halteres",
	"cable-triceps-pushdown": "Tríceps na polia",
	"band-triceps-pushdown": "Tríceps com faixa elástica",
	"dumbbell-overhead-triceps-extension":
		"Extensão de tríceps acima da cabeça com halter",
	"cable-overhead-triceps-extension": "Extensão de tríceps acima da cabeça na polia",
	"barbell-front-squat": "Agachamento frontal com barra",
	"smith-machine-front-squat": "Agachamento frontal no Smith",
	"smith-machine-hack-squat": "Agachamento hack no Smith",
	"machine-hack-squat": "Agachamento hack na máquina",
	"machine-leg-extension": "Cadeira extensora",
	"lying-leg-curl": "Mesa flexora deitada",
	"seated-leg-curl": "Mesa flexora sentada",
	"barbell-good-morning": "Good morning com barra",
	"bodyweight-nordic-curl": "Flexão nórdica com peso corporal",
	"bodyweight-step-up": "Subida no caixote com peso corporal",
	"dumbbell-step-up": "Subida no caixote com halteres",
	"cable-glute-kickback": "Coice de glúteos na polia",
	"band-glute-kickback": "Coice de glúteos com faixa elástica",
	"barbell-standing-calf-raise": "Elevação de panturrilha em pé com barra",
	"smith-machine-calf-raise": "Elevação de panturrilha em pé no Smith",
	"dumbbell-seated-calf-raise": "Elevação de panturrilha sentado com halteres",
	"bodyweight-forearm-plank": "Prancha de antebraços com peso corporal",
	"suspension-trainer-plank": "Prancha no TRX",
	"bodyweight-dead-bug": "Dead bug com peso corporal",
	"band-resisted-dead-bug": "Dead bug resistido com faixa elástica",
	"pull-up-bar-hanging-knee-raise": "Elevação de joelhos suspenso na barra fixa",
	"ab-wheel-rollout": "Rolamento abdominal com roda",
	"barbell-rollout": "Rolamento abdominal com barra",
	"barbell-power-clean": "Power clean com barra",
	"two-hand-kettlebell-swing": "Balanço com kettlebell usando as duas mãos",
	"dumbbell-farmer-carry": "Caminhada do fazendeiro com halteres",
	"kettlebell-farmer-carry": "Caminhada do fazendeiro com kettlebell",
	"barbell-push-press": "Push press com barra",
	"dumbbell-push-press": "Push press com halteres",
	"bodyweight-dynamic-march": "Marcha dinâmica com peso corporal",
	"bodyweight-jumping-jack": "Polichinelo com peso corporal",
	"bodyweight-inchworm": "Minhoca com peso corporal",
	"bodyweight-high-knees": "Joelhos altos com peso corporal",
	"bodyweight-arm-circles": "Círculos com os braços",
	"bodyweight-world-s-greatest-stretch": "Maior alongamento do mundo com peso corporal",
	"bodyweight-cat-cow": "Gato-vaca com peso corporal",
	"quadruped-thoracic-rotation": "Rotação torácica em quatro apoios",
	"bodyweight-90-90-hip-switch": "Alternância de quadril 90/90 com peso corporal",
	"bodyweight-ankle-rock": "Balanço de tornozelo com peso corporal",
	"standing-hamstring-stretch": "Alongamento dos posteriores de coxa em pé",
	"bodyweight-couch-stretch": "Alongamento no sofá com peso corporal",
	"bodyweight-child-s-pose": "Postura da criança com peso corporal",
	"bodyweight-shoulder-car": "CAR do ombro com peso corporal",
	"bodyweight-cooldown-breathing": "Respiração de volta à calma",
	"outdoor-running": "Corrida ao ar livre",
	"treadmill-running": "Corrida na esteira",
	"track-running": "Corrida na pista",
	"beach-running": "Corrida na praia",
	"outdoor-walking": "Caminhada ao ar livre",
	"treadmill-walking": "Caminhada na esteira",
	"incline-treadmill-walking": "Caminhada inclinada na esteira",
	"outdoor-easy-jog": "Trote leve ao ar livre",
	"track-easy-jog": "Trote leve na pista",
	"outdoor-recovery-walk": "Caminhada de recuperação ao ar livre",
	"treadmill-recovery-walk": "Caminhada de recuperação na esteira",
	"stationary-bike-cycling": "Ciclismo na bicicleta ergométrica",
	"outdoor-cycling": "Ciclismo ao ar livre",
	"jump-rope": "Pular corda",
	"track-shuttle-run": "Corrida de ida e volta na pista",
	"outdoor-shuttle-run": "Corrida de ida e volta ao ar livre",
	"machine-elliptical-training": "Treino no elíptico",
	"indoor-rowing-machine": "Remo na máquina indoor",
	"single-leg-balance-reach": "Alcance em apoio unipodal",
	"bodyweight-bear-crawl": "Engatinhar do urso com peso corporal",
});

const portugueseMuscles = Object.freeze({
	chest: "Peito",
	"upper-chest": "Peito superior",
	"lower-chest": "Peito inferior",
	"upper-back": "Parte superior das costas",
	lats: "Grande dorsal",
	"mid-back": "Parte média das costas",
	"lower-back": "Lombar",
	"front-delts": "Deltoides anteriores",
	"side-delts": "Deltoides laterais",
	"rear-delts": "Deltoides posteriores",
	biceps: "Bíceps",
	triceps: "Tríceps",
	forearms: "Antebraços",
	abs: "Abdômen",
	obliques: "Oblíquos",
	"deep-core": "Core profundo",
	glutes: "Glúteos",
	"glute-med": "Glúteo médio",
	quads: "Quadríceps",
	hamstrings: "Isquiotibiais",
	adductors: "Adutores",
	abductors: "Abdutores",
	calves: "Panturrilhas",
	soleus: "Sóleo",
});

const portugueseEquipment = Object.freeze({
	barbell: "Barra",
	dumbbell: "Halteres",
	kettlebell: "Kettlebell",
	"smith-machine": "Máquina Smith",
	"cable-machine": "Polia",
	"leg-press-machine": "Máquina de leg press",
	"chest-press-machine": "Máquina de supino",
	"hack-squat-machine": "Máquina de agachamento hack",
	"leg-extension-machine": "Cadeira extensora",
	"leg-curl-machine": "Mesa flexora",
	"rear-delt-machine": "Máquina para deltoide posterior",
	"lat-pulldown-machine": "Máquina de puxada",
	"pull-up-bar": "Barra fixa",
	"dip-bar": "Barras paralelas",
	"resistance-band": "Faixa elástica",
	"suspension-trainer-trx": "Treinador de suspensão (TRX)",
	"ab-wheel": "Roda abdominal",
	"medicine-ball": "Bola medicinal",
	"jump-rope": "Corda de pular",
	treadmill: "Esteira",
	"stationary-bike": "Bicicleta ergométrica",
	"elliptical-trainer": "Elíptico",
	"rowing-machine": "Máquina de remo",
	"flat-bench": "Banco reto",
	"incline-bench": "Banco inclinado",
	"decline-bench": "Banco declinado",
	"squat-rack": "Rack de agachamento",
	"power-rack": "Power rack",
});

const portugueseMovementPatterns = Object.freeze({
	push: "Empurrar",
	pull: "Puxar",
	squat: "Agachamento",
	hinge: "Dobradiça de quadril",
	lunge: "Afundo",
	carry: "Carregar",
	rotation: "Rotação",
	gait: "Locomoção",
});

export const portugueseCatalogTranslations = Object.freeze({
	exercises: portugueseExercises,
	exerciseVariants: portugueseExerciseVariants,
	muscles: portugueseMuscles,
	equipment: portugueseEquipment,
	movementPatterns: portugueseMovementPatterns,
});

function missingKeys(expectedKeys, values) {
	return expectedKeys.filter((key) => !values[key]);
}

function extraKeys(expectedKeys, values) {
	const expected = new Set(expectedKeys);
	return Object.keys(values).filter((key) => !expected.has(key));
}

export function validatePortugueseCatalogTranslations(
	translations = portugueseCatalogTranslations,
	manifest = catalogManifest,
	vocabulary = catalogVocabulary,
) {
	const expectedExercises = manifest.map((exercise) => exercise.catalogKey);
	const expectedVariants = manifest.flatMap((exercise) =>
		exercise.variants.map((variant) => variant.catalogKey),
	);
	const expected = {
		exercises: expectedExercises,
		exerciseVariants: expectedVariants,
		muscles: vocabulary.catalogEntries.muscles.map((entry) => entry.catalogKey),
		equipment: vocabulary.catalogEntries.equipment.map((entry) => entry.catalogKey),
		movementPatterns: vocabulary.catalogEntries.movementPatterns.map(
			(entry) => entry.catalogKey,
		),
	};

	for (const [type, keys] of Object.entries(expected)) {
		const values = translations[type];
		const missing = missingKeys(keys, values);
		const extra = extraKeys(keys, values);
		if (missing.length || extra.length) {
			throw new Error(
				`Portuguese ${type} translations are incomplete. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`,
			);
		}
		for (const key of keys) {
			if (typeof values[key] !== "string" || values[key].trim() === "") {
				throw new Error(`Portuguese ${type} translation for ${key} must be non-empty.`);
			}
		}
	}

	return true;
}

function sqlString(value) {
	return `'${value.replaceAll("'", "''")}'`;
}

function valuesSql(rows) {
	return rows.map((row) => `(${row.map(sqlString).join(", ")})`).join(",\n");
}

export function createPortugueseCatalogTranslationSeedSql(
	translations = portugueseCatalogTranslations,
) {
	validatePortugueseCatalogTranslations(translations);

	const rows = (values) =>
		Object.entries(values).map(([source, name]) => [source, name]);

	return `
INSERT INTO exercise_translations (exercise_id, locale, name)
SELECT exercises.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.exercises))}
) AS translations(catalog_key, name)
JOIN exercises ON exercises.catalog_key = translations.catalog_key
ON CONFLICT (exercise_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO exercise_variant_translations (exercise_variant_id, locale, name)
SELECT exercise_variants.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.exerciseVariants))}
) AS translations(catalog_key, name)
JOIN exercise_variants
	ON exercise_variants.catalog_key = translations.catalog_key
	AND exercise_variants.owner_user_id IS NULL
ON CONFLICT (exercise_variant_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO muscle_translations (muscle_id, locale, name)
SELECT muscles.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.muscles))}
) AS translations(catalog_key, name)
JOIN muscles ON muscles.catalog_key = translations.catalog_key
ON CONFLICT (muscle_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO equipment_translations (equipment_id, locale, name)
SELECT equipments.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.equipment))}
) AS translations(catalog_key, name)
JOIN equipments ON equipments.catalog_key = translations.catalog_key
ON CONFLICT (equipment_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO movement_pattern_translations (movement_pattern_id, locale, name)
SELECT movement_patterns.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.movementPatterns))}
) AS translations(catalog_key, name)
JOIN movement_patterns ON movement_patterns.catalog_key = translations.catalog_key
ON CONFLICT (movement_pattern_id, locale) DO UPDATE SET name = EXCLUDED.name;
`;
}

export const portugueseCatalogTranslationSeedSql =
	createPortugueseCatalogTranslationSeedSql();
