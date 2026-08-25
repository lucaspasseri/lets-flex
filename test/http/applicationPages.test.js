import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { Client } from "pg";
import { schemaSql } from "../../db/populatedb.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseIsSafe = (() => {
	if (!testDatabaseUrl) return false;
	try {
		return /(?:^|[_-])test(?:$|[_-])/.test(new URL(testDatabaseUrl).pathname.slice(1));
	} catch {
		return false;
	}
})();

const integration = databaseIsSafe ? describe : describe.skip;

integration("application pages and HTTP actions", { concurrency: false }, () => {
	let db;
	let server;
	let origin;

	before(async () => {
		process.env.DATABASE_URL = testDatabaseUrl;
		process.env.SESSION_SECRET = "http-integration-test-secret";
		db = new Client({ connectionString: testDatabaseUrl });
		await db.connect();
		const { createApp } = await import("../../app.js");
		server = createApp().listen(0, "127.0.0.1");
		await new Promise((resolve, reject) => {
			server.once("listening", resolve);
			server.once("error", reject);
		});
		origin = `http://127.0.0.1:${server.address().port}`;
	});

	beforeEach(async () => {
		await db.query(schemaSql);
	});

	after(async () => {
		await new Promise((resolve, reject) =>
			server.close((error) => (error ? reject(error) : resolve())),
		);
		await db.end();
		const { default: pool } = await import("../../db/pool.js");
		await pool.end();
	});

	function agent() {
		let cookie = "";
		return async (path, options = {}) => {
			const headers = new Headers(options.headers);
			if (cookie) headers.set("cookie", cookie);
			if (options.form) {
				headers.set("content-type", "application/x-www-form-urlencoded");
				options.body = new URLSearchParams(options.form);
			}
			const response = await fetch(origin + path, {
				...options,
				headers,
				redirect: "manual",
			});
			const setCookie = response.headers.get("set-cookie");
			if (setCookie) cookie = setCookie.split(";", 1)[0];
			return { response, text: await response.text() };
		};
	}

	async function fixture() {
		const { rows } = await db.query(`
			WITH new_user AS (
				INSERT INTO users (name, date_of_birth, anamnesis)
				VALUES ('Ada Athlete', '1990-01-02', 'Healthy') RETURNING id
			), new_program AS (
				INSERT INTO programs (user_id, goal_id, name, start_date)
				SELECT id, 1, 'Strength Base', CURRENT_DATE FROM new_user RETURNING id, user_id
			), new_cycle AS (
				INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
				SELECT id, 'Foundation', 2, 1 FROM new_program RETURNING id, program_id
			), new_day AS (
				INSERT INTO training_days (cycle_id, day_order, scheduled_date, label)
				SELECT id, 1, CURRENT_DATE, 'Upper Day' FROM new_cycle RETURNING id, cycle_id
			), new_exercise AS (
				INSERT INTO exercises (name, movement_pattern_id)
				VALUES ('Bench Press', 1) RETURNING id
			), new_variant AS (
				INSERT INTO exercise_variants (exercise_id, equipment_id, name)
				SELECT id, 1, 'Barbell Bench Press' FROM new_exercise RETURNING id, exercise_id
			), new_relation AS (
				INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id)
				SELECT exercise_id, 1, 1 FROM new_variant
			), new_session AS (
				INSERT INTO sessions (name, notes) VALUES ('Push Session', 'Controlled reps')
				RETURNING id
			), new_step AS (
				INSERT INTO session_steps
					(session_id, step_type_id, exercise_variant_id, name, step_order, sets, reps, load_value, load_unit)
				SELECT new_session.id, 1, new_variant.id, 'Bench sets', 1, 3, 8, 60, 'Kilograms'
				FROM new_session, new_variant RETURNING id, session_id
			), new_workout AS (
				INSERT INTO workout_sessions (training_day_id, session_id, workout_session_order, notes)
				SELECT new_day.id, new_session.id, 1, '' FROM new_day, new_session RETURNING id
			)
			SELECT new_user.id AS user_id, new_program.id AS program_id,
				new_cycle.id AS cycle_id, new_day.id AS day_id,
				new_exercise.id AS exercise_id, new_variant.id AS variant_id,
				new_session.id AS session_id, new_step.id AS step_id,
				new_workout.id AS workout_id
			FROM new_user, new_program, new_cycle, new_day, new_exercise,
				new_variant, new_session, new_step, new_workout
		`);
		return rows[0];
	}

	async function selectProfile(request, userId) {
		const result = await request(`/profile?userId=${userId}`);
		assert.equal(result.response.status, 200);
	}

	test("anonymous page rendering and malformed page queries", async () => {
		const request = agent();
		for (const [path, content] of [
			["/", "Let&#39;s Flex!"],
			["/profile", "Profiles"],
			["/library", "Library"],
			["/programs", "active profile"],
			["/programs/day", "Date outside the program"],
			["/playground", "Playground"],
			["/playground/button", "button"],
		]) {
			const result = await request(path);
			assert.equal(result.response.status, 200, path);
			assert.match(result.text, new RegExp(content, "i"), path);
		}

		let result = await request("/?daysDifference=not-a-number");
		assert.equal(result.response.status, 400);
		assert.match(result.text, /Invalid query parameters/);
		result = await request("/programs/day?dayId=0");
		assert.equal(result.response.status, 400);
		assert.match(result.text, /Choose a valid training day/);
		result = await request("/playground/does-not-exist");
		assert.equal(result.response.status, 500);
		assert.equal(result.text, "Something broke!");
	});

	test("profile creation, selection, clearing, validation, and missing selection", async () => {
		const request = agent();
		let result = await request("/users", {
			method: "POST",
			form: { name: "  Grace Hopper  ", dob: "1906-12-09", anamnesis: "" },
		});
		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/profile");
		const created = await db.query("SELECT * FROM users WHERE name = 'Grace Hopper'");
		assert.equal(created.rowCount, 1);

		result = await request("/profile");
		assert.match(result.text, /Grace Hopper/);
		result = await request("/profile/clear-selection", { method: "POST" });
		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/profile");

		result = await request("/users", {
			method: "POST",
			form: { name: "", dob: "2999-99-99", anamnesis: "kept value" },
		});
		assert.equal(result.response.status, 400);
		assert.match(result.text, /Enter a name/);
		assert.match(result.text, /Enter a valid date of birth/);
		assert.match(result.text, /kept value/);

		result = await request("/profile?userId=999999");
		assert.equal(result.response.status, 200);
		assert.doesNotMatch(result.text, /Grace Hopper.*selected/i);
	});

	test("program and cycle forms enforce session state, validate, persist, and delete", async () => {
		const ids = await fixture();
		const anonymous = agent();
		let result = await anonymous("/programs", {
			method: "POST",
			form: { name: "No Owner", goalId: "1", startDate: "2026-01-01" },
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /No active profile/);

		const request = agent();
		await selectProfile(request, ids.user_id);
		result = await request("/programs", {
			method: "POST",
			form: { name: "", goalId: "bad", startDate: "2026-02-31" },
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /Enter a program name/);

		result = await request("/programs", {
			method: "POST",
			form: { name: "Hypertrophy Block", goalId: "1", startDate: "2026-01-01" },
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM programs")).rows[0].count,
			2,
		);

		result = await request("/cycles", {
			method: "POST",
			form: { name: "Build", cycleSize: "3", cycleOrder: "1" },
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM training_days")).rows[0]
				.count,
			4,
		);

		result = await request("/cycles", {
			method: "POST",
			form: { name: "Bad", cycleSize: "0", cycleOrder: "99" },
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /Number of days must be at least 1/);
		result = await request("/cycles/not-an-id", { method: "DELETE" });
		assert.equal(result.response.status, 400);
		result = await request("/cycles/999999", { method: "DELETE" });
		assert.equal(result.response.status, 404);

		result = await request("/programs/not-an-id", { method: "DELETE" });
		assert.equal(result.response.status, 400);
		result = await request("/programs/999999", { method: "DELETE" });
		assert.equal(result.response.status, 404);
		result = await request(`/programs/${ids.program_id}`, { method: "DELETE" });
		assert.equal(result.response.status, 302);
		assert.equal(
			(await db.query("SELECT 1 FROM programs WHERE id = $1", [ids.program_id]))
				.rowCount,
			0,
		);
	});

	test("library renders fixtures and supports exercise/session create, update, archive, and errors", async () => {
		const ids = await fixture();
		const request = agent();
		await selectProfile(request, ids.user_id);
		let result = await request(`/library?sessionId=${ids.session_id}`);
		assert.equal(result.response.status, 200);
		assert.match(result.text, /Push Session/);
		assert.match(result.text, /Barbell Bench Press/);

		result = await request("/exerciseTemplates", {
			method: "POST",
			form: {
				name: "Goblet Squat",
				movementPatternId: "3",
				equipmentId: "2",
				"muscleGroup[0][muscleId]": "19",
				"muscleGroup[0][muscleRoleId]": "1",
			},
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(await db.query("SELECT 1 FROM exercises WHERE name = 'Goblet Squat'")).rowCount,
			1,
		);
		result = await request(
			`/exerciseTemplates/${ids.exercise_id}/variants/${ids.variant_id}`,
			{
				method: "PATCH",
				form: { name: "", movementPatternId: "bad", equipmentId: "", muscleGroup: "" },
			},
		);
		assert.equal(result.response.status, 422);
		assert.match(result.text, /Enter an exercise name/);
		result = await request("/exerciseTemplates/999999/variants/999999", {
			method: "PATCH",
			form: {
				name: "Missing Exercise",
				movementPatternId: "1",
				equipmentId: "1",
				"muscleGroup[0][muscleId]": "1",
				"muscleGroup[0][muscleRoleId]": "1",
			},
		});
		assert.equal(result.response.status, 404);

		result = await request("/sessions", {
			method: "POST",
			form: { name: "Empty Recovery", notes: "Easy day" },
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(await db.query("SELECT 1 FROM sessions WHERE name = 'Empty Recovery'")).rowCount,
			1,
		);

		result = await request(`/sessions/${ids.session_id}`, {
			method: "PATCH",
			form: { name: "", notes: "still here" },
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /Enter a session name/);

		result = await request(`/sessions/${ids.session_id}`, {
			method: "PATCH",
			form: { name: "Updated Push", notes: "Updated" },
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(await db.query("SELECT name FROM sessions WHERE id = $1", [ids.session_id]))
				.rows[0].name,
			"Updated Push",
		);

		result = await request(`/sessions/${ids.session_id}/archive`, { method: "PATCH" });
		assert.equal(result.response.status, 302);
		result = await request(`/sessions/${ids.session_id}/archive`, { method: "PATCH" });
		assert.equal(result.response.status, 404);
		result = await request("/sessions/999999", {
			method: "PATCH",
			form: { name: "Missing", notes: "" },
		});
		assert.equal(result.response.status, 404);
	});

	test("day and dashboard workout flow validates, redirects, and changes persisted state", async () => {
		const ids = await fixture();
		const request = agent();
		await selectProfile(request, ids.user_id);
		await request(`/programs?programId=${ids.program_id}&cycleId=${ids.cycle_id}`);

		let result = await request(`/programs/day?dayId=${ids.day_id}`);
		assert.equal(result.response.status, 200);
		assert.match(result.text, /Training day/);
		assert.match(result.text, /Push Session/);

		result = await request("/workout_sessions", {
			method: "POST",
			form: { sessionId: "bad", trainingDayId: ids.day_id },
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /Choose a valid session template/);
		result = await request(`/workout_sessions/${ids.workout_id}`, {
			method: "PATCH",
			form: { trainingDayId: "bad" },
		});
		assert.equal(result.response.status, 400);
		assert.match(result.text, /Choose a valid training day/);

		result = await request(`/workout_sessions/${ids.workout_id}/start`, {
			method: "POST",
			form: { daysDifference: "0" },
		});
		assert.equal(result.response.status, 302);
		assert.match(result.response.headers.get("location"), /workoutSessionId=/);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					ids.workout_id,
				])
			).rows[0].status,
			"in_progress",
		);
		const log = (
			await db.query("SELECT id FROM workout_step_logs WHERE workout_session_id = $1", [
				ids.workout_id,
			])
		).rows[0];

		result = await request(`/workout_step_logs/${log.id}/perform`, {
			method: "POST",
			form: { daysDifference: "0", workoutSessionId: ids.workout_id },
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /Add at least one set/);

		result = await request(`/workout_step_logs/${log.id}/perform`, {
			method: "POST",
			form: {
				daysDifference: "0",
				workoutSessionId: ids.workout_id,
				"logFormRows[0][performedReps]": "8",
				"logFormRows[0][performedLoadValue]": "62.5",
				"logFormRows[0][performedLoadUnit]": "Kilograms",
			},
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM workout_set_logs WHERE workout_step_log_id = $1",
					[log.id],
				)
			).rows[0].count,
			1,
		);

		result = await request(`/workout_sessions/${ids.workout_id}/finish`, {
			method: "POST",
			form: { daysDifference: "0" },
		});
		assert.equal(result.response.status, 302);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					ids.workout_id,
				])
			).rows[0].status,
			"finished",
		);

		result = await request("/workout_sessions/not-a-number/start", {
			method: "POST",
			form: { daysDifference: "0" },
		});
		assert.equal(result.response.status, 400);
	});
});

if (!databaseIsSafe) {
	test("HTTP integration database safety guard", { skip: true }, () => {});
}
