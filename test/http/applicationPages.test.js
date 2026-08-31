import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { Client } from "pg";
import { schemaSql } from "../../db/schema.js";
import { hashPassword } from "../../src/features/auth/passwordService.js";

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

integration("authentication and authorization", { concurrency: false }, () => {
	let db;
	let server;
	let origin;
	let passwordHash;

	before(async () => {
		process.env.DATABASE_URL = testDatabaseUrl;
		process.env.SESSION_SECRET = "http-integration-test-secret";
		process.env.GUEST_TTL_DAYS = "15";
		passwordHash = await hashPassword("correct horse battery staple");
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
		await db.query(
			`INSERT INTO users (email, password_hash, role, name) VALUES
			 ('admin@example.com', $1, 'admin', 'Admin'),
			 ('user-one@example.com', $1, 'user', 'User One'),
			 ('user-two@example.com', $1, 'user', 'User Two')`,
			[passwordHash],
		);
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
		const request = async (path, options = {}) => {
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
		return { request, cookie: () => cookie };
	}

	function csrfFrom(html) {
		const match = html.match(/name="_csrf" value="([^"]+)"/);
		assert.ok(match, "response should contain a CSRF token");
		return match[1];
	}

	async function login(client, email = "user-one@example.com") {
		const page = await client.request("/auth/login");
		const oldCookie = client.cookie();
		const result = await client.request("/auth/login", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				email,
				password: "correct horse battery staple",
				returnTo: "/",
			},
		});
		assert.equal(result.response.status, 302);
		assert.notEqual(client.cookie(), oldCookie, "login must rotate the session ID");
		return result;
	}

	async function enterGuest(client) {
		const page = await client.request("/auth/login");
		const result = await client.request("/auth/guest", {
			method: "POST",
			form: { _csrf: csrfFrom(page.text) },
		});
		assert.equal(result.response.status, 302);
	}

	test("authentication is the entry point and CSRF protects mutations", async () => {
		const client = agent();
		let result = await client.request("/");
		assert.equal(result.response.status, 302);
		assert.match(result.response.headers.get("location"), /^\/auth\/login/);

		result = await client.request("/auth/login");
		assert.equal(result.response.status, 200);
		assert.match(result.text, /Sign in/);

		result = await client.request("/auth/guest", { method: "POST", form: {} });
		assert.equal(result.response.status, 403);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM users WHERE role = 'guest'"))
				.rows[0].count,
			0,
		);
	});

	test("local login normalizes email, rotates the session, and logout destroys it", async () => {
		const client = agent();
		const page = await client.request("/auth/login");
		const result = await client.request("/auth/login", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				email: "  USER-ONE@EXAMPLE.COM ",
				password: "correct horse battery staple",
				returnTo: "//evil.example",
			},
		});
		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/");

		const profile = await client.request("/profile");
		assert.equal(profile.response.status, 200);
		assert.match(profile.text, /User One/);
		const oldCookie = client.cookie();
		const logout = await client.request("/auth/logout", {
			method: "POST",
			form: { _csrf: csrfFrom(profile.text) },
		});
		assert.equal(logout.response.status, 302);
		assert.notEqual(client.cookie(), oldCookie);
		assert.equal((await client.request("/")).response.status, 302);
	});

	test("generated guests are distinct, minimal, private, and expire in fifteen days", async () => {
		const first = agent();
		const second = agent();
		await enterGuest(first);
		await enterGuest(second);
		const { rows } = await db.query(
			"SELECT * FROM users WHERE role = 'guest' ORDER BY id",
		);
		assert.equal(rows.length, 2);
		assert.notEqual(rows[0].id, rows[1].id);
		for (const guest of rows) {
			assert.equal(guest.email, null);
			assert.equal(guest.password_hash, null);
			assert.equal(guest.date_of_birth, null);
			assert.equal(guest.anamnesis, null);
			const lifetime = new Date(guest.guest_expires_at) - new Date(guest.created_at);
			assert.ok(lifetime >= 14.99 * 24 * 60 * 60 * 1000);
		}
		const profile = await first.request("/profile");
		assert.match(profile.text, /temporary/i);
	});

	test("canonical exercise management requires admin role", async () => {
		const standard = agent();
		await login(standard);
		assert.equal(
			(await standard.request("/admin/library/exercises")).response.status,
			403,
		);

		const admin = agent();
		await login(admin, "admin@example.com");
		const page = await admin.request("/admin/library/exercises");
		assert.equal(page.response.status, 200);
		const created = await admin.request("/admin/library/exercises", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				name: "Deadlift",
				movementPatternId: "4",
				equipmentId: "1",
				"muscleGroup[0][muscleId]": "20",
				"muscleGroup[0][muscleRoleId]": "1",
			},
		});
		assert.equal(created.response.status, 302);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM exercises WHERE name = 'Deadlift'",
				)
			).rows[0].count,
			1,
		);
		const exercise = (
			await db.query("SELECT id FROM exercises WHERE name = 'Deadlift'")
		).rows[0];
		const globalVariant = await admin.request(
			`/admin/library/exercises/${exercise.id}/variants`,
			{
				method: "POST",
				form: {
					_csrf: csrfFrom(page.text),
					name: "Trap Bar Deadlift",
					equipmentId: "1",
				},
			},
		);
		assert.equal(globalVariant.response.status, 302);
		assert.equal(
			(
				await db.query(
					"SELECT owner_user_id FROM exercise_variants WHERE name = 'Trap Bar Deadlift'",
				)
			).rows[0].owner_user_id,
			null,
		);
		const archived = await admin.request(
			`/admin/library/exercises/${exercise.id}/archive`,
			{ method: "POST", form: { _csrf: csrfFrom(page.text) } },
		);
		assert.equal(archived.response.status, 302);
		assert.equal(
			(await db.query("SELECT is_archived FROM exercises WHERE id = $1", [exercise.id]))
				.rows[0].is_archived,
			true,
		);
	});

	test("private variants are owner-scoped and uniqueness is scoped per owner", async () => {
		const first = agent();
		const second = agent();
		await login(first, "user-one@example.com");
		await login(second, "user-two@example.com");
		const exercise = (await db.query("SELECT id FROM exercises WHERE name = 'Squat'"))
			.rows[0];

		for (const client of [first, second]) {
			const library = await client.request("/library");
			const result = await client.request(`/exercises/${exercise.id}/variants`, {
				method: "POST",
				form: {
					_csrf: csrfFrom(library.text),
					name: "  Tempo Squat  ",
					equipmentId: "1",
				},
			});
			assert.equal(result.response.status, 302);
		}

		const variants = await db.query(
			"SELECT id, owner_user_id, name FROM exercise_variants WHERE name = 'Tempo Squat' ORDER BY id",
		);
		assert.equal(variants.rowCount, 2);
		assert.notEqual(variants.rows[0].owner_user_id, variants.rows[1].owner_user_id);

		let library = await first.request("/library");
		let result = await first.request(`/exercises/${exercise.id}/variants`, {
			method: "POST",
			form: { _csrf: csrfFrom(library.text), name: "tempo squat", equipmentId: "1" },
		});
		assert.equal(result.response.status, 409);

		library = await second.request("/library");
		result = await second.request(
			`/exercise-variants/${variants.rows[0].id}?_method=PATCH`,
			{
				method: "POST",
				form: {
					_csrf: csrfFrom(library.text),
					name: "Stolen",
					equipmentId: "1",
				},
			},
		);
		assert.equal(result.response.status, 404);
		assert.equal(
			(
				await db.query("SELECT name FROM exercise_variants WHERE id = $1", [
					variants.rows[0].id,
				])
			).rows[0].name,
			"Tempo Squat",
		);

		const admin = agent();
		await login(admin, "admin@example.com");
		const adminProfile = await admin.request("/profile");
		result = await admin.request(
			`/exercise-variants/${variants.rows[0].id}?_method=PATCH`,
			{
				method: "POST",
				form: {
					_csrf: csrfFrom(adminProfile.text),
					name: "Admin override",
					equipmentId: "1",
				},
			},
		);
		assert.equal(result.response.status, 404);
	});

	test("workout actions cannot cross the owning program boundary", async () => {
		const { rows } = await db.query(`
			WITH owner AS (
				SELECT id FROM users WHERE email = 'user-one@example.com'
			), program AS (
				INSERT INTO programs (user_id, name) SELECT id, 'Private' FROM owner RETURNING id
			), cycle AS (
				INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
				SELECT id, 'Cycle', 1, 1 FROM program RETURNING id
			), day AS (
				INSERT INTO training_days (cycle_id, day_order, scheduled_date)
				SELECT id, 1, CURRENT_DATE FROM cycle RETURNING id
			), template AS (
				SELECT id FROM sessions WHERE owner_user_id IS NULL LIMIT 1
			)
			INSERT INTO workout_sessions (training_day_id, session_id, workout_session_order)
			SELECT day.id, template.id, 1 FROM day, template RETURNING id
		`);
		const attacker = agent();
		await login(attacker, "user-two@example.com");
		const profile = await attacker.request("/profile");
		const result = await attacker.request(`/workout_sessions/${rows[0].id}/start`, {
			method: "POST",
			form: { _csrf: csrfFrom(profile.text), daysDifference: "0" },
		});
		assert.equal(result.response.status, 404);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					rows[0].id,
				])
			).rows[0].status,
			"planned",
		);
	});

	test("expired guest cleanup is bounded and never deletes registered users", async () => {
		const { rows } = await db.query(
			`INSERT INTO users (name, role, guest_expires_at) VALUES
			 ('Expired A', 'guest', NOW() - INTERVAL '1 day'),
			 ('Expired B', 'guest', NOW() - INTERVAL '1 day'),
			 ('Active', 'guest', NOW() + INTERVAL '1 day') RETURNING id`,
		);
		await db.query(
			"INSERT INTO exercise_variants (exercise_id, owner_user_id, name) SELECT id, $1, 'Temporary' FROM exercises LIMIT 1",
			[rows[0].id],
		);
		const { default: cleanupExpiredGuests } =
			await import("../../src/features/guests/cleanupExpiredGuests.js");
		const result = await cleanupExpiredGuests({ batchSize: 1 }, db);
		assert.equal(result.deletedCount, 1);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM users WHERE role IN ('user', 'admin')",
				)
			).rows[0].count,
			3,
		);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM users WHERE role = 'guest'"))
				.rows[0].count,
			2,
		);
	});
});

if (!databaseIsSafe) {
	test("HTTP integration database safety guard", { skip: true }, () => {});
}
