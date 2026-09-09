const muscleRoleNames = [
	"prime_mover",
	"synergist",
	"stabilizer",
	"antagonist",
	"fixator",
	"dynamic_stabilizer",
	"secondary_mover",
];

const movementPatternNames = [
	"push",
	"pull",
	"squat",
	"hinge",
	"lunge",
	"carry",
	"rotation",
	"gait",
];

const muscleNames = [
	"Chest",
	"Upper Chest",
	"Lower Chest",
	"Upper Back",
	"Lats",
	"Mid Back",
	"Lower Back",
	"Front Delts",
	"Side Delts",
	"Rear Delts",
	"Biceps",
	"Triceps",
	"Forearms",
	"Abs",
	"Obliques",
	"Deep Core",
	"Glutes",
	"Glute Med",
	"Quads",
	"Hamstrings",
	"Adductors",
	"Abductors",
	"Calves",
	"Soleus",
];

const equipmentNames = [
	"Barbell",
	"Dumbbell",
	"Kettlebell",
	"Smith Machine",
	"Cable Machine",
	"Leg Press Machine",
	"Chest Press Machine",
	"Lat Pulldown Machine",
	"Pull-up Bar",
	"Dip Bar",
	"Resistance Band",
	"Suspension Trainer (TRX)",
	"Ab Wheel",
	"Medicine Ball",
	"Treadmill",
	"Stationary Bike",
	"Elliptical Trainer",
	"Rowing Machine",
	"Flat Bench",
	"Incline Bench",
	"Decline Bench",
	"Squat Rack",
	"Power Rack",
];

export const catalogVocabulary = Object.freeze({
	movementPatterns: Object.freeze(movementPatternNames),
	muscles: Object.freeze(muscleNames),
	muscleRoles: Object.freeze(muscleRoleNames),
	equipment: Object.freeze(equipmentNames),
	environments: Object.freeze(["gym", "home", "gym_or_home"]),
});

const variant = (name, equipment, setupDescription, environment = "gym_or_home") => ({
	name,
	equipment,
	setupDescription,
	environment,
});

const base = (name, movementPattern, primeMover, variants) => ({
	name,
	movementPattern,
	muscles: [{ name: primeMover, role: "prime_mover" }],
	variants,
});

export const catalogManifest = Object.freeze([
	base("Push Up", "push", "Chest", [
		variant("Bodyweight Push Up", null, "Hands beneath shoulders with a braced trunk."),
		variant(
			"Resistance Band Push Up",
			"Resistance Band",
			"Loop a band across the upper back and anchor each end beneath the hands.",
		),
	]),
	base("Bench Press", "push", "Chest", [
		variant(
			"Barbell Bench Press",
			"Barbell",
			"Lie on a flat bench with the bar over the mid-chest.",
			"gym",
		),
		variant(
			"Dumbbell Bench Press",
			"Dumbbell",
			"Lie on a flat bench with one dumbbell in each hand.",
			"gym",
		),
	]),
	base("Overhead Press", "push", "Front Delts", [
		variant(
			"Barbell Overhead Press",
			"Barbell",
			"Stand with the bar at upper-chest height and brace the trunk.",
			"gym",
		),
		variant(
			"Dumbbell Overhead Press",
			"Dumbbell",
			"Stand or sit with dumbbells held at shoulder height.",
		),
	]),
	base("Pull Up", "pull", "Lats", [
		variant(
			"Bodyweight Pull Up",
			"Pull-up Bar",
			"Hang from a pull-up bar with a secure overhand grip.",
		),
		variant(
			"Band-Assisted Pull Up",
			"Resistance Band",
			"Secure a band to a pull-up bar and place a foot or knee in the loop.",
		),
	]),
	base("Lat Pulldown", "pull", "Lats", [
		variant(
			"Machine Lat Pulldown",
			"Lat Pulldown Machine",
			"Sit with thighs secured and take an overhand grip on the bar.",
			"gym",
		),
		variant(
			"Resistance Band Lat Pulldown",
			"Resistance Band",
			"Anchor the band overhead and kneel or sit beneath the anchor.",
		),
	]),
	base("Row", "pull", "Mid Back", [
		variant(
			"Barbell Bent-Over Row",
			"Barbell",
			"Hinge to a stable torso angle and hold the bar below the shoulders.",
			"gym",
		),
		variant(
			"One-Arm Dumbbell Row",
			"Dumbbell",
			"Support one hand on a stable surface and hold the dumbbell below the shoulder.",
		),
	]),
	base("Inverted Row", "pull", "Mid Back", [
		variant(
			"Suspension Trainer Inverted Row",
			"Suspension Trainer (TRX)",
			"Set the handles around waist height and lean back with a rigid body.",
		),
		variant(
			"Bar Inverted Row",
			"Power Rack",
			"Set a secured bar around waist height and position the chest beneath it.",
			"gym",
		),
	]),
	base("Squat", "squat", "Quads", [
		variant(
			"Barbell Back Squat",
			"Barbell",
			"Barbell supported across the upper back.",
			"gym",
		),
		variant(
			"Goblet Squat",
			"Kettlebell",
			"Hold the kettlebell close to the chest and stand with a comfortable stance.",
		),
	]),
	base("Box Squat", "squat", "Quads", [
		variant(
			"Bodyweight Box Squat",
			null,
			"Stand in front of a stable seat set to a comfortable depth.",
			"home",
		),
		variant(
			"Dumbbell Box Squat",
			"Dumbbell",
			"Stand in front of a stable box while holding dumbbells at the sides.",
		),
	]),
	base("Leg Press", "squat", "Quads", [
		variant(
			"Bilateral Leg Press",
			"Leg Press Machine",
			"Place both feet securely on the platform at a comfortable width.",
			"gym",
		),
		variant(
			"Single-Leg Press",
			"Leg Press Machine",
			"Place one foot securely on the platform and keep the pelvis supported.",
			"gym",
		),
	]),
	base("Deadlift", "hinge", "Glutes", [
		variant(
			"Barbell Deadlift",
			"Barbell",
			"Set the bar over the mid-foot and take a balanced grip outside the legs.",
			"gym",
		),
		variant(
			"Kettlebell Deadlift",
			"Kettlebell",
			"Place the kettlebell between the feet and hinge to reach the handle.",
		),
	]),
	base("Romanian Deadlift", "hinge", "Hamstrings", [
		variant(
			"Barbell Romanian Deadlift",
			"Barbell",
			"Hold the bar at hip height and begin from a tall, braced stance.",
			"gym",
		),
		variant(
			"Dumbbell Romanian Deadlift",
			"Dumbbell",
			"Hold dumbbells in front of the thighs and begin from a tall stance.",
		),
	]),
	base("Hip Extension", "hinge", "Glutes", [
		variant(
			"Bodyweight Glute Bridge",
			null,
			"Lie on the back with knees bent and feet planted near the hips.",
			"home",
		),
		variant(
			"Barbell Hip Thrust",
			"Barbell",
			"Support the upper back on a stable bench and position the padded bar across the hips.",
			"gym",
		),
	]),
	base("Forward Lunge", "lunge", "Quads", [
		variant(
			"Bodyweight Forward Lunge",
			null,
			"Stand tall with clear space to step forward.",
		),
		variant(
			"Dumbbell Forward Lunge",
			"Dumbbell",
			"Stand tall holding dumbbells at the sides with clear space ahead.",
		),
	]),
	base("Reverse Lunge", "lunge", "Glutes", [
		variant(
			"Bodyweight Reverse Lunge",
			null,
			"Stand tall with clear space to step backward.",
		),
		variant(
			"Dumbbell Reverse Lunge",
			"Dumbbell",
			"Stand tall holding dumbbells at the sides with clear space behind.",
		),
	]),
	base("Split Squat", "lunge", "Quads", [
		variant(
			"Bodyweight Split Squat",
			null,
			"Take a stable staggered stance with both feet remaining planted.",
		),
		variant(
			"Dumbbell Split Squat",
			"Dumbbell",
			"Take a stable staggered stance while holding dumbbells at the sides.",
		),
	]),
	base("Wood Chop", "rotation", "Obliques", [
		variant(
			"Cable Wood Chop",
			"Cable Machine",
			"Set the cable above shoulder height and stand side-on to the machine.",
			"gym",
		),
		variant(
			"Resistance Band Wood Chop",
			"Resistance Band",
			"Anchor the band above shoulder height and stand side-on to the anchor.",
		),
	]),
	base("Anti-Rotation Press", "rotation", "Obliques", [
		variant(
			"Cable Anti-Rotation Press",
			"Cable Machine",
			"Set the cable at chest height and stand side-on with a stable stance.",
			"gym",
		),
		variant(
			"Resistance Band Anti-Rotation Press",
			"Resistance Band",
			"Anchor the band at chest height and stand side-on with a stable stance.",
		),
	]),
]);

export const catalogReviewNotes = Object.freeze([
	"Squat, Box Squat, and Leg Press are distinct bilateral knee-dominant families with different constraints and setup.",
	"Forward Lunge, Reverse Lunge, and Split Squat remain distinct because stepping direction and fixed versus moving stance materially change setup.",
	"Pull Up and Lat Pulldown remain distinct closed-chain and open-chain vertical-pull families.",
	"Wood Chop trains trunk rotation, while Anti-Rotation Press resists rotation; their intent is deliberately different.",
	"Hip Extension groups the floor bridge and bench-supported thrust as setup variants of the same hip-extension family.",
]);
