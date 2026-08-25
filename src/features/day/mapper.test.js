import test from "node:test";
import assert from "node:assert/strict";
import { toTrainingDay } from "../trainingDays/mapper.js";
import { toSessionMapperSeed } from "../sessions/mapper.js";
import { toWorkoutSession } from "../workoutSessions/mapper.js";

const stepRow = {
	id: 8,
	name: "Bench press",
	sets: 3,
	reps: 8,
	load_value: 60,
	load_unit: "Kilograms",
	step_order: 1,
	step_type_name: "strength",
	exercise_variant_name: "Barbell",
	exercise_variant_setup_description: "Set the rack",
	exercise_variant_environment: "Gym",
	exercise_variant_notes: "",
	exercise_name: "Bench press",
	movement_pattern_name: "push",
	equipment_name: "Barbell",
	equipment_category: "free_weight",
	muscles: [
		{
			id: 9,
			common_name: "Chest",
			scientific_name: "Pectoralis major",
			body_region: "torso",
			reference_url: "",
		},
	],
};

test("day mappers isolate database field names and preserve nested entities", () => {
	assert.deepEqual(
		toTrainingDay({
			id: 3,
			cycle_id: 2,
			program_id: 1,
			cycle_order: 1,
			day_order: 2,
			scheduled_date: "2026-08-20",
			label: "Push",
		}),
		{
			id: 3,
			cycleId: 2,
			programId: 1,
			cycleOrder: 1,
			dayOrder: 2,
			scheduledDate: "2026-08-20",
			label: "Push",
		},
	);

	const session = toSessionMapperSeed({
		id: 4,
		name: "Upper",
		notes: "Controlled reps",
		is_archived: false,
		steps: [stepRow],
	});
	assert.equal(session.isArchived, false);
	assert.equal(session.steps[0].exercise.variantName, "Barbell");
	assert.equal(session.steps[0].equipment.category, "Free weight");
	assert.equal(session.steps[0].muscles[0].commonName, "Chest");
});

test("workout mapper maps lifecycle fields and nullable step logs", () => {
	const workout = toWorkoutSession({
		id: 10,
		training_day_id: 3,
		session_id: 4,
		workout_session_order: 1,
		status: "planned",
		started_at: null,
		finished_at: null,
		notes: "",
		name: "Upper",
		is_archived: false,
		session_notes: "Template notes",
		steps: [{ ...stepRow, step_log: null }],
	});

	assert.equal(workout.trainingDayId, 3);
	assert.equal(workout.order, 1);
	assert.equal(workout.sessionNotes, "Template notes");
	assert.equal(workout.steps[0].stepLog, null);
});
