import { catalogManifest, catalogVocabulary } from "./catalogManifest.js";

const portugueseExercises = Object.freeze({
	"Push Up": "Flexão de braço",
	"Bench Press": "Supino reto",
	"Overhead Press": "Desenvolvimento",
	"Pull Up": "Barra fixa",
	"Lat Pulldown": "Puxada na frente",
	Row: "Remada",
	"Inverted Row": "Remada invertida",
	Squat: "Agachamento",
	"Box Squat": "Agachamento no caixote",
	"Leg Press": "Leg press",
	Deadlift: "Levantamento terra",
	"Romanian Deadlift": "Levantamento terra romeno",
	"Hip Extension": "Extensão de quadril",
	"Forward Lunge": "Afundo à frente",
	"Reverse Lunge": "Afundo reverso",
	"Split Squat": "Agachamento dividido",
	"Wood Chop": "Lenhador",
	"Anti-Rotation Press": "Pressão anti-rotação",
	"Incline Bench Press": "Supino inclinado",
	"Decline Bench Press": "Supino declinado",
	"Chest Fly": "Crucifixo",
	Dip: "Mergulho",
	"Close-Grip Bench Press": "Supino fechado",
	"Chest-Supported Row": "Remada com apoio no peito",
	"Seated Cable Row": "Remada sentada na polia",
	"Single-Arm Lat Pulldown": "Puxada unilateral",
	"Straight-Arm Pulldown": "Puxada com braços estendidos",
	"Face Pull": "Face pull",
	"Lateral Raise": "Elevação lateral",
	"Rear Delt Fly": "Crucifixo inverso",
	"Biceps Curl": "Rosca bíceps",
	"Hammer Curl": "Rosca martelo",
	"Triceps Pushdown": "Tríceps na polia",
	"Overhead Triceps Extension": "Extensão de tríceps acima da cabeça",
	"Front Squat": "Agachamento frontal",
	"Hack Squat": "Agachamento hack",
	"Leg Extension": "Cadeira extensora",
	"Leg Curl": "Mesa flexora",
	"Good Morning": "Good morning",
	"Nordic Curl": "Flexão nórdica",
	"Step Up": "Subida no caixote",
	"Cable Kickback": "Coice na polia",
	"Standing Calf Raise": "Elevação de panturrilha em pé",
	"Seated Calf Raise": "Elevação de panturrilha sentado",
	Plank: "Prancha",
	"Dead Bug": "Dead bug",
	"Hanging Knee Raise": "Elevação de joelhos suspenso",
	"Ab Rollout": "Rolamento abdominal",
	"Power Clean": "Power clean",
	"Kettlebell Swing": "Balanço com kettlebell",
	"Farmer Carry": "Caminhada do fazendeiro",
	"Push Press": "Push press",
	"Dynamic March": "Marcha dinâmica",
	"Jumping Jack": "Polichinelo",
	Inchworm: "Minhoca",
	"High Knees": "Joelhos altos",
	"Arm Circles": "Círculos com os braços",
	"World's Greatest Stretch": "Maior alongamento do mundo",
	"Cat-Cow": "Gato-vaca",
	"Thoracic Rotation": "Rotação torácica",
	"90/90 Hip Switch": "Alternância de quadril 90/90",
	"Ankle Rock": "Balanço de tornozelo",
	"Hamstring Stretch": "Alongamento dos posteriores de coxa",
	"Couch Stretch": "Alongamento no sofá",
	"Child's Pose": "Postura da criança",
	"Shoulder CAR": "CAR do ombro",
	"Cooldown Breathing": "Respiração de volta à calma",
	Running: "Corrida",
	Walking: "Caminhada",
	"Easy Jog": "Trote leve",
	"Recovery Walk": "Caminhada de recuperação",
	Cycling: "Ciclismo",
	"Jump Rope": "Pular corda",
	"Shuttle Run": "Corrida de ida e volta",
	"Elliptical Training": "Treino no elíptico",
	Rowing: "Remo",
	"Balance Reach": "Alcance em apoio unipodal",
	"Bear Crawl": "Engatinhar do urso",
});

const portugueseExerciseVariants = Object.freeze({
	"Bodyweight Push Up": "Flexão de braço com peso corporal",
	"Resistance Band Push Up": "Flexão de braço com faixa elástica",
	"Barbell Bench Press": "Supino reto com barra",
	"Dumbbell Bench Press": "Supino reto com halteres",
	"Barbell Overhead Press": "Desenvolvimento com barra",
	"Dumbbell Overhead Press": "Desenvolvimento com halteres",
	"Bodyweight Pull Up": "Barra fixa com peso corporal",
	"Band-Assisted Pull Up": "Barra fixa assistida com faixa elástica",
	"Machine Lat Pulldown": "Puxada na máquina",
	"Resistance Band Lat Pulldown": "Puxada com faixa elástica",
	"Barbell Bent-Over Row": "Remada curvada com barra",
	"One-Arm Dumbbell Row": "Remada unilateral com halter",
	"Suspension Trainer Inverted Row": "Remada invertida no TRX",
	"Bar Inverted Row": "Remada invertida com barra",
	"Barbell Back Squat": "Agachamento livre com barra",
	"Goblet Squat": "Agachamento goblet",
	"Bodyweight Box Squat": "Agachamento no caixote com peso corporal",
	"Dumbbell Box Squat": "Agachamento no caixote com halteres",
	"Bilateral Leg Press": "Leg press bilateral",
	"Single-Leg Press": "Leg press unilateral",
	"Barbell Deadlift": "Levantamento terra com barra",
	"Kettlebell Deadlift": "Levantamento terra com kettlebell",
	"Barbell Romanian Deadlift": "Levantamento terra romeno com barra",
	"Dumbbell Romanian Deadlift": "Levantamento terra romeno com halteres",
	"Bodyweight Glute Bridge": "Ponte de glúteos com peso corporal",
	"Barbell Hip Thrust": "Elevação pélvica com barra",
	"Bodyweight Forward Lunge": "Afundo à frente com peso corporal",
	"Dumbbell Forward Lunge": "Afundo à frente com halteres",
	"Bodyweight Reverse Lunge": "Afundo reverso com peso corporal",
	"Dumbbell Reverse Lunge": "Afundo reverso com halteres",
	"Bodyweight Split Squat": "Agachamento dividido com peso corporal",
	"Dumbbell Split Squat": "Agachamento dividido com halteres",
	"Cable Wood Chop": "Lenhador na polia",
	"Resistance Band Wood Chop": "Lenhador com faixa elástica",
	"Cable Anti-Rotation Press": "Pressão anti-rotação na polia",
	"Resistance Band Anti-Rotation Press": "Pressão anti-rotação com faixa elástica",
	"Barbell Incline Bench Press": "Supino inclinado com barra",
	"Dumbbell Incline Bench Press": "Supino inclinado com halteres",
	"Smith Machine Incline Press": "Supino inclinado no Smith",
	"Barbell Decline Bench Press": "Supino declinado com barra",
	"Dumbbell Decline Bench Press": "Supino declinado com halteres",
	"Cable Chest Fly": "Crucifixo na polia",
	"Dumbbell Chest Fly": "Crucifixo com halteres",
	"Bodyweight Dip": "Mergulho com peso corporal",
	"Band-Assisted Dip": "Mergulho assistido com faixa elástica",
	"Barbell Close-Grip Bench Press": "Supino fechado com barra",
	"Smith Machine Close-Grip Press": "Supino fechado no Smith",
	"Dumbbell Chest-Supported Row": "Remada com apoio no peito e halteres",
	"Machine Chest-Supported Row": "Remada com apoio no peito na máquina",
	"Close-Grip Seated Cable Row": "Remada sentada fechada na polia",
	"Single-Arm Cable Lat Pulldown": "Puxada unilateral na polia",
	"Cable Straight-Arm Pulldown": "Puxada com braços estendidos na polia",
	"Band Straight-Arm Pulldown": "Puxada com braços estendidos e faixa elástica",
	"Cable Face Pull": "Face pull na polia",
	"Band Face Pull": "Face pull com faixa elástica",
	"Dumbbell Lateral Raise": "Elevação lateral com halteres",
	"Cable Lateral Raise": "Elevação lateral na polia",
	"Dumbbell Rear Delt Fly": "Crucifixo inverso com halteres",
	"Machine Rear Delt Fly": "Crucifixo inverso na máquina",
	"Barbell Biceps Curl": "Rosca bíceps com barra",
	"Dumbbell Hammer Curl": "Rosca martelo com halteres",
	"Cable Triceps Pushdown": "Tríceps na polia",
	"Band Triceps Pushdown": "Tríceps com faixa elástica",
	"Dumbbell Overhead Triceps Extension":
		"Extensão de tríceps acima da cabeça com halter",
	"Cable Overhead Triceps Extension": "Extensão de tríceps acima da cabeça na polia",
	"Barbell Front Squat": "Agachamento frontal com barra",
	"Smith Machine Front Squat": "Agachamento frontal no Smith",
	"Smith Machine Hack Squat": "Agachamento hack no Smith",
	"Machine Hack Squat": "Agachamento hack na máquina",
	"Machine Leg Extension": "Cadeira extensora",
	"Lying Leg Curl": "Mesa flexora deitada",
	"Seated Leg Curl": "Mesa flexora sentada",
	"Barbell Good Morning": "Good morning com barra",
	"Bodyweight Nordic Curl": "Flexão nórdica com peso corporal",
	"Bodyweight Step Up": "Subida no caixote com peso corporal",
	"Dumbbell Step Up": "Subida no caixote com halteres",
	"Cable Glute Kickback": "Coice de glúteos na polia",
	"Band Glute Kickback": "Coice de glúteos com faixa elástica",
	"Barbell Standing Calf Raise": "Elevação de panturrilha em pé com barra",
	"Smith Machine Calf Raise": "Elevação de panturrilha em pé no Smith",
	"Dumbbell Seated Calf Raise": "Elevação de panturrilha sentado com halteres",
	"Bodyweight Forearm Plank": "Prancha de antebraços com peso corporal",
	"Suspension Trainer Plank": "Prancha no TRX",
	"Bodyweight Dead Bug": "Dead bug com peso corporal",
	"Band-Resisted Dead Bug": "Dead bug resistido com faixa elástica",
	"Pull-up Bar Hanging Knee Raise": "Elevação de joelhos suspenso na barra fixa",
	"Ab Wheel Rollout": "Rolamento abdominal com roda",
	"Barbell Rollout": "Rolamento abdominal com barra",
	"Barbell Power Clean": "Power clean com barra",
	"Two-Hand Kettlebell Swing": "Balanço com kettlebell usando as duas mãos",
	"Dumbbell Farmer Carry": "Caminhada do fazendeiro com halteres",
	"Kettlebell Farmer Carry": "Caminhada do fazendeiro com kettlebell",
	"Barbell Push Press": "Push press com barra",
	"Dumbbell Push Press": "Push press com halteres",
	"Bodyweight Dynamic March": "Marcha dinâmica com peso corporal",
	"Bodyweight Jumping Jack": "Polichinelo com peso corporal",
	"Bodyweight Inchworm": "Minhoca com peso corporal",
	"Bodyweight High Knees": "Joelhos altos com peso corporal",
	"Bodyweight Arm Circles": "Círculos com os braços",
	"Bodyweight World's Greatest Stretch": "Maior alongamento do mundo com peso corporal",
	"Bodyweight Cat-Cow": "Gato-vaca com peso corporal",
	"Quadruped Thoracic Rotation": "Rotação torácica em quatro apoios",
	"Bodyweight 90/90 Hip Switch": "Alternância de quadril 90/90 com peso corporal",
	"Bodyweight Ankle Rock": "Balanço de tornozelo com peso corporal",
	"Standing Hamstring Stretch": "Alongamento dos posteriores de coxa em pé",
	"Bodyweight Couch Stretch": "Alongamento no sofá com peso corporal",
	"Bodyweight Child's Pose": "Postura da criança com peso corporal",
	"Bodyweight Shoulder CAR": "CAR do ombro com peso corporal",
	"Bodyweight Cooldown Breathing": "Respiração de volta à calma",
	"Outdoor Running": "Corrida ao ar livre",
	"Treadmill Running": "Corrida na esteira",
	"Track Running": "Corrida na pista",
	"Beach Running": "Corrida na praia",
	"Outdoor Walking": "Caminhada ao ar livre",
	"Treadmill Walking": "Caminhada na esteira",
	"Incline Treadmill Walking": "Caminhada inclinada na esteira",
	"Outdoor Easy Jog": "Trote leve ao ar livre",
	"Track Easy Jog": "Trote leve na pista",
	"Outdoor Recovery Walk": "Caminhada de recuperação ao ar livre",
	"Treadmill Recovery Walk": "Caminhada de recuperação na esteira",
	"Stationary Bike Cycling": "Ciclismo na bicicleta ergométrica",
	"Outdoor Cycling": "Ciclismo ao ar livre",
	"Jump Rope": "Pular corda",
	"Track Shuttle Run": "Corrida de ida e volta na pista",
	"Outdoor Shuttle Run": "Corrida de ida e volta ao ar livre",
	"Machine Elliptical Training": "Treino no elíptico",
	"Indoor Rowing Machine": "Remo na máquina indoor",
	"Single-Leg Balance Reach": "Alcance em apoio unipodal",
	"Bodyweight Bear Crawl": "Engatinhar do urso com peso corporal",
});

const portugueseMuscles = Object.freeze({
	Chest: "Peito",
	"Upper Chest": "Peito superior",
	"Lower Chest": "Peito inferior",
	"Upper Back": "Parte superior das costas",
	Lats: "Grande dorsal",
	"Mid Back": "Parte média das costas",
	"Lower Back": "Lombar",
	"Front Delts": "Deltoides anteriores",
	"Side Delts": "Deltoides laterais",
	"Rear Delts": "Deltoides posteriores",
	Biceps: "Bíceps",
	Triceps: "Tríceps",
	Forearms: "Antebraços",
	Abs: "Abdômen",
	Obliques: "Oblíquos",
	"Deep Core": "Core profundo",
	Glutes: "Glúteos",
	"Glute Med": "Glúteo médio",
	Quads: "Quadríceps",
	Hamstrings: "Isquiotibiais",
	Adductors: "Adutores",
	Abductors: "Abdutores",
	Calves: "Panturrilhas",
	Soleus: "Sóleo",
});

const portugueseEquipment = Object.freeze({
	Barbell: "Barra",
	Dumbbell: "Halteres",
	Kettlebell: "Kettlebell",
	"Smith Machine": "Máquina Smith",
	"Cable Machine": "Polia",
	"Leg Press Machine": "Máquina de leg press",
	"Chest Press Machine": "Máquina de supino",
	"Hack Squat Machine": "Máquina de agachamento hack",
	"Leg Extension Machine": "Cadeira extensora",
	"Leg Curl Machine": "Mesa flexora",
	"Rear Delt Machine": "Máquina para deltoide posterior",
	"Lat Pulldown Machine": "Máquina de puxada",
	"Pull-up Bar": "Barra fixa",
	"Dip Bar": "Barras paralelas",
	"Resistance Band": "Faixa elástica",
	"Suspension Trainer (TRX)": "Treinador de suspensão (TRX)",
	"Ab Wheel": "Roda abdominal",
	"Medicine Ball": "Bola medicinal",
	"Jump Rope": "Corda de pular",
	Treadmill: "Esteira",
	"Stationary Bike": "Bicicleta ergométrica",
	"Elliptical Trainer": "Elíptico",
	"Rowing Machine": "Máquina de remo",
	"Flat Bench": "Banco reto",
	"Incline Bench": "Banco inclinado",
	"Decline Bench": "Banco declinado",
	"Squat Rack": "Rack de agachamento",
	"Power Rack": "Power rack",
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
	const expectedExercises = manifest.map((exercise) => exercise.name);
	const expectedVariants = manifest.flatMap((exercise) =>
		exercise.variants.map((variant) => variant.name),
	);
	const expected = {
		exercises: expectedExercises,
		exerciseVariants: expectedVariants,
		muscles: vocabulary.muscles,
		equipment: vocabulary.equipment,
		movementPatterns: vocabulary.movementPatterns,
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
) AS translations(source_name, name)
JOIN exercises ON exercises.name = translations.source_name
ON CONFLICT (exercise_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO exercise_variant_translations (exercise_variant_id, locale, name)
SELECT exercise_variants.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.exerciseVariants))}
) AS translations(source_name, name)
JOIN exercise_variants
	ON exercise_variants.name = translations.source_name
	AND exercise_variants.owner_user_id IS NULL
ON CONFLICT (exercise_variant_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO muscle_translations (muscle_id, locale, name)
SELECT muscles.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.muscles))}
) AS translations(source_name, name)
JOIN muscles ON muscles.common_name = translations.source_name
ON CONFLICT (muscle_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO equipment_translations (equipment_id, locale, name)
SELECT equipments.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.equipment))}
) AS translations(source_name, name)
JOIN equipments ON equipments.name = translations.source_name
ON CONFLICT (equipment_id, locale) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO movement_pattern_translations (movement_pattern_id, locale, name)
SELECT movement_patterns.id, 'pt-BR', translations.name
FROM (VALUES
${valuesSql(rows(translations.movementPatterns))}
) AS translations(source_name, name)
JOIN movement_patterns ON movement_patterns.name = translations.source_name
ON CONFLICT (movement_pattern_id, locale) DO UPDATE SET name = EXCLUDED.name;
`;
}

export const portugueseCatalogTranslationSeedSql =
	createPortugueseCatalogTranslationSeedSql();
