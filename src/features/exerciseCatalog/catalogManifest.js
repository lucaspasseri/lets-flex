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
	"Hack Squat Machine",
	"Leg Extension Machine",
	"Leg Curl Machine",
	"Rear Delt Machine",
	"Lat Pulldown Machine",
	"Pull-up Bar",
	"Dip Bar",
	"Resistance Band",
	"Suspension Trainer (TRX)",
	"Ab Wheel",
	"Medicine Ball",
	"Jump Rope",
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
	environments: Object.freeze([
		"gym",
		"home",
		"gym_or_home",
		"outdoors",
		"track",
		"beach",
		"treadmill",
	]),
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
	base("Incline Bench Press", "push", "Upper Chest", [
		variant(
			"Barbell Incline Bench Press",
			"Barbell",
			"Set the bar above the upper chest on an incline bench.",
			"gym",
		),
		variant(
			"Dumbbell Incline Bench Press",
			"Dumbbell",
			"Lie on an incline bench with dumbbells aligned over the upper chest.",
			"gym",
		),
		variant(
			"Smith Machine Incline Press",
			"Smith Machine",
			"Set the Smith bar over the upper chest on an incline bench.",
			"gym",
		),
	]),
	base("Decline Bench Press", "push", "Lower Chest", [
		variant(
			"Barbell Decline Bench Press",
			"Barbell",
			"Secure the legs on a decline bench and lower the bar toward the lower chest.",
			"gym",
		),
		variant(
			"Dumbbell Decline Bench Press",
			"Dumbbell",
			"Lie on a decline bench with dumbbells over the lower chest.",
			"gym",
		),
	]),
	base("Chest Fly", "push", "Chest", [
		variant(
			"Cable Chest Fly",
			"Cable Machine",
			"Set both pulleys at chest height and bring the handles together with a soft elbow bend.",
			"gym",
		),
		variant(
			"Dumbbell Chest Fly",
			"Dumbbell",
			"Lie on a flat bench with dumbbells above the chest and controlled arm arcs.",
			"gym",
		),
	]),
	base("Dip", "push", "Triceps", [
		variant(
			"Bodyweight Dip",
			"Dip Bar",
			"Support the body on parallel bars and lower with the shoulders controlled.",
			"gym",
		),
		variant(
			"Band-Assisted Dip",
			"Resistance Band",
			"Loop a resistance band over the dip bars to reduce the load during the descent.",
			"gym",
		),
	]),
	base("Close-Grip Bench Press", "push", "Triceps", [
		variant(
			"Barbell Close-Grip Bench Press",
			"Barbell",
			"Use a narrow, comfortable grip and lower the bar toward the mid-chest.",
			"gym",
		),
		variant(
			"Smith Machine Close-Grip Press",
			"Smith Machine",
			"Set the Smith bar above the mid-chest with a narrow, comfortable grip.",
			"gym",
		),
	]),
	base("Chest-Supported Row", "pull", "Mid Back", [
		variant(
			"Dumbbell Chest-Supported Row",
			"Dumbbell",
			"Lie chest-down on an incline bench and row the dumbbells toward the ribs.",
			"gym",
		),
		variant(
			"Machine Chest-Supported Row",
			"Chest Press Machine",
			"Set the chest pad and row the handles while keeping the torso supported.",
			"gym",
		),
	]),
	base("Seated Cable Row", "pull", "Mid Back", [
		variant(
			"Close-Grip Seated Cable Row",
			"Cable Machine",
			"Sit tall with feet braced and pull the close handle toward the lower ribs.",
			"gym",
		),
	]),
	base("Single-Arm Lat Pulldown", "pull", "Lats", [
		variant(
			"Single-Arm Cable Lat Pulldown",
			"Cable Machine",
			"Kneel or sit beside a high pulley and pull one handle toward the side of the ribs.",
			"gym",
		),
	]),
	base("Straight-Arm Pulldown", "pull", "Lats", [
		variant(
			"Cable Straight-Arm Pulldown",
			"Cable Machine",
			"Stand facing a high pulley and sweep the straight arms toward the thighs.",
			"gym",
		),
		variant(
			"Band Straight-Arm Pulldown",
			"Resistance Band",
			"Anchor a band overhead and sweep the straight arms down toward the thighs.",
		),
	]),
	base("Face Pull", "pull", "Rear Delts", [
		variant(
			"Cable Face Pull",
			"Cable Machine",
			"Set the rope at face height and pull toward the forehead with the elbows high.",
			"gym",
		),
		variant(
			"Band Face Pull",
			"Resistance Band",
			"Anchor a band at face height and pull the handles toward the forehead.",
		),
	]),
	base("Lateral Raise", "push", "Side Delts", [
		variant(
			"Dumbbell Lateral Raise",
			"Dumbbell",
			"Raise the dumbbells out to the sides with a slight elbow bend and controlled tempo.",
		),
		variant(
			"Cable Lateral Raise",
			"Cable Machine",
			"Stand side-on to a low pulley and raise one arm through the lateral plane.",
			"gym",
		),
	]),
	base("Rear Delt Fly", "pull", "Rear Delts", [
		variant(
			"Dumbbell Rear Delt Fly",
			"Dumbbell",
			"Hinge or sit supported and open the dumbbells out to shoulder height.",
		),
		variant(
			"Machine Rear Delt Fly",
			"Rear Delt Machine",
			"Face the machine pad and open the handles with the rear shoulders.",
			"gym",
		),
	]),
	base("Biceps Curl", "pull", "Biceps", [
		variant(
			"Barbell Biceps Curl",
			"Barbell",
			"Stand tall and curl the bar without swinging the trunk.",
			"gym",
		),
	]),
	base("Hammer Curl", "pull", "Biceps", [
		variant(
			"Dumbbell Hammer Curl",
			"Dumbbell",
			"Curl the dumbbells with neutral palms and the elbows close to the sides.",
		),
	]),
	base("Triceps Pushdown", "push", "Triceps", [
		variant(
			"Cable Triceps Pushdown",
			"Cable Machine",
			"Set the cable high and extend the elbows while keeping the upper arms still.",
			"gym",
		),
		variant(
			"Band Triceps Pushdown",
			"Resistance Band",
			"Anchor a band overhead and press the handles down by extending the elbows.",
		),
	]),
	base("Overhead Triceps Extension", "push", "Triceps", [
		variant(
			"Dumbbell Overhead Triceps Extension",
			"Dumbbell",
			"Hold one dumbbell overhead and lower it behind the head with the elbows steady.",
		),
		variant(
			"Cable Overhead Triceps Extension",
			"Cable Machine",
			"Face away from a low pulley and extend the handle overhead.",
			"gym",
		),
	]),
	base("Front Squat", "squat", "Quads", [
		variant(
			"Barbell Front Squat",
			"Barbell",
			"Rest the bar across the front shoulders and squat with an upright torso.",
			"gym",
		),
		variant(
			"Smith Machine Front Squat",
			"Smith Machine",
			"Set the Smith bar across the front shoulders and squat along its guided path.",
			"gym",
		),
	]),
	base("Hack Squat", "squat", "Quads", [
		variant(
			"Smith Machine Hack Squat",
			"Smith Machine",
			"Position the feet forward under the Smith bar and squat with the back supported by the setup.",
			"gym",
		),
		variant(
			"Machine Hack Squat",
			"Hack Squat Machine",
			"Set the shoulders into the machine pads and squat through a controlled range.",
			"gym",
		),
	]),
	base("Leg Extension", "squat", "Quads", [
		variant(
			"Machine Leg Extension",
			"Leg Extension Machine",
			"Adjust the pad above the ankles and extend the knees without lifting the hips.",
			"gym",
		),
	]),
	base("Leg Curl", "hinge", "Hamstrings", [
		variant(
			"Lying Leg Curl",
			"Leg Curl Machine",
			"Lie face-down with the pad above the ankles and curl the heels toward the hips.",
			"gym",
		),
		variant(
			"Seated Leg Curl",
			"Leg Curl Machine",
			"Set the thigh pad and curl the lower legs while keeping the hips supported.",
			"gym",
		),
	]),
	base("Good Morning", "hinge", "Hamstrings", [
		variant(
			"Barbell Good Morning",
			"Barbell",
			"Place a light bar across the upper back and hinge with a braced, neutral spine.",
			"gym",
		),
	]),
	base("Nordic Curl", "hinge", "Hamstrings", [
		variant(
			"Bodyweight Nordic Curl",
			null,
			"Anchor the ankles and lower the body slowly from a tall kneeling position.",
			"gym_or_home",
		),
	]),
	base("Step Up", "lunge", "Glutes", [
		variant(
			"Bodyweight Step Up",
			null,
			"Step onto a stable platform and stand tall through the working leg.",
		),
		variant(
			"Dumbbell Step Up",
			"Dumbbell",
			"Step onto a stable platform while holding dumbbells at the sides.",
		),
	]),
	base("Cable Kickback", "hinge", "Glutes", [
		variant(
			"Cable Glute Kickback",
			"Cable Machine",
			"Attach an ankle strap low and extend the leg back without arching the lower back.",
			"gym",
		),
		variant(
			"Band Glute Kickback",
			"Resistance Band",
			"Secure a band low and extend one leg back with the pelvis level.",
		),
	]),
	base("Standing Calf Raise", "hinge", "Calves", [
		variant(
			"Barbell Standing Calf Raise",
			"Barbell",
			"Stand securely with the bar supported and rise through the balls of both feet.",
			"gym",
		),
		variant(
			"Smith Machine Calf Raise",
			"Smith Machine",
			"Stand under the Smith bar and raise both heels through a controlled range.",
			"gym",
		),
	]),
	base("Seated Calf Raise", "hinge", "Soleus", [
		variant(
			"Dumbbell Seated Calf Raise",
			"Dumbbell",
			"Sit with a dumbbell across the thigh and raise the heel while keeping the forefoot planted.",
		),
	]),
	base("Plank", "carry", "Deep Core", [
		variant(
			"Bodyweight Forearm Plank",
			null,
			"Support the body on the forearms and toes while keeping the trunk braced.",
		),
		variant(
			"Suspension Trainer Plank",
			"Suspension Trainer (TRX)",
			"Place the feet in suspension straps and hold a straight, braced body.",
		),
	]),
	base("Dead Bug", "rotation", "Deep Core", [
		variant(
			"Bodyweight Dead Bug",
			null,
			"Lie on the back and alternate lowering opposite limbs while keeping the ribs controlled.",
		),
		variant(
			"Band-Resisted Dead Bug",
			"Resistance Band",
			"Anchor a band behind the shoulders and move opposite limbs without losing trunk position.",
		),
	]),
	base("Hanging Knee Raise", "rotation", "Abs", [
		variant(
			"Pull-up Bar Hanging Knee Raise",
			"Pull-up Bar",
			"Hang from a secure bar and raise the knees without swinging.",
			"gym",
		),
	]),
	base("Ab Rollout", "rotation", "Abs", [
		variant(
			"Ab Wheel Rollout",
			"Ab Wheel",
			"Kneel behind the wheel and roll forward only as far as the trunk stays braced.",
		),
		variant(
			"Barbell Rollout",
			"Barbell",
			"Kneel behind a lightly loaded barbell and roll forward with controlled trunk tension.",
			"gym",
		),
	]),
	base("Power Clean", "hinge", "Glutes", [
		variant(
			"Barbell Power Clean",
			"Barbell",
			"Start from the floor and drive the bar upward before receiving it in a partial squat.",
			"gym",
		),
	]),
	base("Kettlebell Swing", "hinge", "Glutes", [
		variant(
			"Two-Hand Kettlebell Swing",
			"Kettlebell",
			"Hike the kettlebell and drive the hips to swing it to chest height.",
		),
	]),
	base("Farmer Carry", "carry", "Forearms", [
		variant(
			"Dumbbell Farmer Carry",
			"Dumbbell",
			"Walk tall while carrying equal dumbbells with a steady, braced trunk.",
		),
		variant(
			"Kettlebell Farmer Carry",
			"Kettlebell",
			"Walk tall while carrying kettlebells at the sides with controlled steps.",
		),
	]),
	base("Push Press", "push", "Front Delts", [
		variant(
			"Barbell Push Press",
			"Barbell",
			"Dip and drive the bar overhead while keeping the trunk stacked.",
			"gym",
		),
		variant(
			"Dumbbell Push Press",
			"Dumbbell",
			"Use a shallow leg drive to press dumbbells overhead with control.",
		),
	]),
	base("Dynamic March", "gait", "Deep Core", [
		variant(
			"Bodyweight Dynamic March",
			null,
			"March in place with tall posture and deliberate arm and knee action.",
			"gym_or_home",
		),
	]),
	base("Jumping Jack", "gait", "Calves", [
		variant(
			"Bodyweight Jumping Jack",
			null,
			"Jump the feet apart and together while lifting and lowering the arms.",
			"gym_or_home",
		),
	]),
	base("Inchworm", "hinge", "Hamstrings", [
		variant(
			"Bodyweight Inchworm",
			null,
			"Hinge to the floor, walk the hands to a plank, then return to standing.",
			"gym_or_home",
		),
	]),
	base("High Knees", "gait", "Quads", [
		variant(
			"Bodyweight High Knees",
			null,
			"Run in place while lifting the knees comfortably and keeping the trunk tall.",
			"gym_or_home",
		),
	]),
	base("Arm Circles", "push", "Front Delts", [
		variant(
			"Bodyweight Arm Circles",
			null,
			"Stand tall and make controlled circles with the arms through a comfortable range.",
			"gym_or_home",
		),
	]),
	base("World's Greatest Stretch", "lunge", "Glute Med", [
		variant(
			"Bodyweight World's Greatest Stretch",
			null,
			"Step into a lunge, rotate toward the forward leg, and move through each side slowly.",
			"gym_or_home",
		),
	]),
	base("Cat-Cow", "rotation", "Lower Back", [
		variant(
			"Bodyweight Cat-Cow",
			null,
			"On hands and knees, alternate gentle spinal flexion and extension with the breath.",
			"gym_or_home",
		),
	]),
	base("Thoracic Rotation", "rotation", "Upper Back", [
		variant(
			"Quadruped Thoracic Rotation",
			null,
			"From hands and knees, rotate one arm toward the ceiling without shifting the hips.",
			"gym_or_home",
		),
	]),
	base("90/90 Hip Switch", "rotation", "Glute Med", [
		variant(
			"Bodyweight 90/90 Hip Switch",
			null,
			"Sit with both knees bent and rotate between sides while keeping the movement controlled.",
			"gym_or_home",
		),
	]),
	base("Ankle Rock", "lunge", "Calves", [
		variant(
			"Bodyweight Ankle Rock",
			null,
			"With the foot planted, glide the knee forward over the toes without lifting the heel.",
			"gym_or_home",
		),
	]),
	base("Hamstring Stretch", "hinge", "Hamstrings", [
		variant(
			"Standing Hamstring Stretch",
			null,
			"Place one heel forward and hinge gently until a comfortable hamstring stretch is felt.",
			"gym_or_home",
		),
	]),
	base("Couch Stretch", "lunge", "Quads", [
		variant(
			"Bodyweight Couch Stretch",
			null,
			"Place the shin near a wall or couch and settle into a controlled half-kneeling stretch.",
			"home",
		),
	]),
	base("Child's Pose", "hinge", "Lower Back", [
		variant(
			"Bodyweight Child's Pose",
			null,
			"Sit the hips toward the heels and reach the arms forward while breathing comfortably.",
			"gym_or_home",
		),
	]),
	base("Shoulder CAR", "rotation", "Front Delts", [
		variant(
			"Bodyweight Shoulder CAR",
			null,
			"Move one arm slowly through its largest comfortable circle while keeping the ribs controlled.",
			"gym_or_home",
		),
	]),
	base("Cooldown Breathing", "rotation", "Deep Core", [
		variant(
			"Bodyweight Cooldown Breathing",
			null,
			"Settle into a comfortable position and use slow, relaxed breaths to bring the session down gradually.",
			"gym_or_home",
		),
	]),
	base("Running", "gait", "Calves", [
		variant(
			"Outdoor Running",
			null,
			"Run on a clear outdoor route at a pace suited to the session.",
			"outdoors",
		),
		variant(
			"Treadmill Running",
			"Treadmill",
			"Run on a treadmill with a gradual warm-up and a pace suited to the session.",
			"treadmill",
		),
		variant(
			"Track Running",
			null,
			"Run on a marked track and adjust pace or laps to the session goal.",
			"track",
		),
		variant(
			"Beach Running",
			null,
			"Run on a safe, firm section of beach and adjust pace for the surface.",
			"beach",
		),
	]),
	base("Walking", "gait", "Calves", [
		variant(
			"Outdoor Walking",
			null,
			"Walk outdoors at a comfortable, steady pace.",
			"outdoors",
		),
		variant(
			"Treadmill Walking",
			"Treadmill",
			"Walk on a treadmill at a pace that allows controlled posture.",
			"treadmill",
		),
		variant(
			"Incline Treadmill Walking",
			"Treadmill",
			"Walk on a treadmill with a moderate incline and controlled, even steps.",
			"treadmill",
		),
	]),
	base("Easy Jog", "gait", "Calves", [
		variant(
			"Outdoor Easy Jog",
			null,
			"Jog outdoors at an easy conversational pace.",
			"outdoors",
		),
		variant(
			"Track Easy Jog",
			null,
			"Jog on a track at an easy conversational pace.",
			"track",
		),
	]),
	base("Recovery Walk", "gait", "Calves", [
		variant(
			"Outdoor Recovery Walk",
			null,
			"Walk outdoors at an easy pace that supports active recovery.",
			"outdoors",
		),
		variant(
			"Treadmill Recovery Walk",
			"Treadmill",
			"Walk on a treadmill at an easy pace with relaxed, controlled steps.",
			"treadmill",
		),
	]),
	base("Cycling", "gait", "Quads", [
		variant(
			"Stationary Bike Cycling",
			"Stationary Bike",
			"Adjust the saddle and pedal smoothly at a sustainable effort.",
			"gym",
		),
		variant(
			"Outdoor Cycling",
			null,
			"Cycle on a clear outdoor route with a sustainable effort.",
			"outdoors",
		),
	]),
	base("Jump Rope", "gait", "Calves", [
		variant(
			"Jump Rope",
			"Jump Rope",
			"Use small, elastic hops and turn the rope at a steady rhythm.",
			"gym_or_home",
		),
	]),
	base("Shuttle Run", "gait", "Quads", [
		variant(
			"Track Shuttle Run",
			null,
			"Run between marked points on a track with controlled turns.",
			"track",
		),
		variant(
			"Outdoor Shuttle Run",
			null,
			"Run between safe outdoor markers with controlled accelerations and turns.",
			"outdoors",
		),
	]),
	base("Elliptical Training", "gait", "Quads", [
		variant(
			"Machine Elliptical Training",
			"Elliptical Trainer",
			"Set a sustainable resistance and move smoothly through the elliptical stride.",
			"gym",
		),
	]),
	base("Rowing", "pull", "Quads", [
		variant(
			"Indoor Rowing Machine",
			"Rowing Machine",
			"Drive with the legs, then open the hips and finish with the arms on each stroke.",
			"gym",
		),
	]),
	base("Balance Reach", "lunge", "Glute Med", [
		variant(
			"Single-Leg Balance Reach",
			null,
			"Balance on one leg and reach the free leg or hands while keeping the pelvis level.",
			"gym_or_home",
		),
	]),
	base("Bear Crawl", "carry", "Deep Core", [
		variant(
			"Bodyweight Bear Crawl",
			null,
			"Move on hands and feet with the knees hovering low and the trunk steady.",
			"gym_or_home",
		),
	]),
]);

export const catalogReviewNotes = Object.freeze([
	"The managed catalog keeps resistance-training families as the majority while adding complementary session building blocks that use the existing step types.",
	"Running, walking, and easy jogging include distinct outdoor, treadmill, track, and beach applications where the environment changes the training setup.",
	"Warm-up, mobility, stretching, recovery, balance, and conditioning entries remain ordinary catalog exercises so users can assign the existing warm_up, mobility, stretching, cooldown, or cardio step types without a schema special case.",
	"Squat, Box Squat, and Leg Press are distinct bilateral knee-dominant families with different constraints and setup.",
	"Forward Lunge, Reverse Lunge, and Split Squat remain distinct because stepping direction and fixed versus moving stance materially change setup.",
	"Pull Up and Lat Pulldown remain distinct closed-chain and open-chain vertical-pull families.",
	"Wood Chop trains trunk rotation, while Anti-Rotation Press resists rotation; their intent is deliberately different.",
	"Hip Extension groups the floor bridge and bench-supported thrust as setup variants of the same hip-extension family.",
]);
