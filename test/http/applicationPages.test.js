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
			`WITH accounts AS (
				INSERT INTO users (email, role, name) VALUES
				 ('admin@example.com', 'admin', 'Admin'),
				 ('user-one@example.com', 'user', 'User One'),
				 ('user-two@example.com', 'user', 'User Two')
				RETURNING id, email
			)
			INSERT INTO auth_identities (user_id, provider, provider_subject, password_hash)
			SELECT id, 'local', email, $1 FROM accounts`,
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
		assert.match(result.text, /Your training workspace/);
		assert.match(result.text, /action="\/auth\/login"/);
		assert.match(result.text, /action="\/auth\/register"/);
		assert.match(result.text, /action="\/auth\/guest"/);
		assert.match(result.text, /role="tablist"/);

		result = await client.request("/auth/guest", { method: "POST", form: {} });
		assert.equal(result.response.status, 403);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM users WHERE role = 'guest'"))
				.rows[0].count,
			0,
		);
	});

	test("public registration validates, creates a regular user, and starts a session", async () => {
		const client = agent();
		let page = await client.request("/auth/login?returnTo=/library&tab=signup");
		let result = await client.request("/auth/register", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				email: "  NEW.MEMBER@EXAMPLE.COM ",
				password: "correct horse battery staple",
				role: "admin",
				returnTo: "/library",
			},
		});
		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/library");
		assert.notEqual(client.cookie(), "", "registration must establish a session");
		const account = (
			await db.query(
				`SELECT u.email, u.role, ai.provider, ai.provider_subject, ai.password_hash
				 FROM users u
				 JOIN auth_identities ai ON ai.user_id = u.id
				 WHERE u.email = 'new.member@example.com'`,
			)
		).rows[0];
		assert.equal(account.email, "new.member@example.com");
		assert.equal(account.role, "user");
		assert.equal(account.provider, "local");
		assert.equal(account.provider_subject, "new.member@example.com");
		assert.notEqual(account.password_hash, "correct horse battery staple");
		assert.equal((await client.request("/library")).response.status, 200);

		const invalid = agent();
		page = await invalid.request("/auth/login?tab=signup");
		result = await invalid.request("/auth/register", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				email: "not-an-email",
				password: "short",
			},
		});
		assert.equal(result.response.status, 422);
		assert.match(
			result.text,
			/id="auth-signup-tab"[\s\S]*?aria-selected="true"[\s\S]*?>Sign up/,
		);
		assert.match(result.text, /Enter a valid email address/);
		assert.match(result.text, /at least 12 characters/);
		assert.doesNotMatch(result.text, /value="short"/);
	});

	test("local login rejects an invalid password without authenticating", async () => {
		const client = agent();
		const page = await client.request("/auth/login");
		const result = await client.request("/auth/login", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				email: "user-one@example.com",
				password: "this password is incorrect",
			},
		});
		assert.equal(result.response.status, 401);
		assert.match(result.text, /Invalid email or password/);
		assert.equal((await client.request("/profile")).response.status, 302);
	});

	test("registration handles case-insensitive duplicate emails without changing roles", async () => {
		const client = agent();
		const page = await client.request("/auth/login?tab=signup");
		const result = await client.request("/auth/register", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				email: " USER-ONE@EXAMPLE.COM ",
				password: "correct horse battery staple",
				role: "admin",
			},
		});
		assert.equal(result.response.status, 409);
		assert.match(result.text, /already exists/);
		assert.doesNotMatch(result.text, /correct horse battery staple/);
		assert.equal(
			(await db.query("SELECT role FROM users WHERE email = 'user-one@example.com'"))
				.rows[0].role,
			"user",
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
			assert.equal(guest.date_of_birth, null);
			assert.equal(guest.anamnesis, null);
			const lifetime = new Date(guest.guest_expires_at) - new Date(guest.created_at);
			assert.ok(lifetime >= 14.99 * 24 * 60 * 60 * 1000);
		}
		const profile = await first.request("/profile");
		assert.match(profile.text, /temporary/i);
		assert.match(profile.text, /data-profile-role="guest"/);
		assert.doesNotMatch(profile.text, /Manage exercise catalog/);
		const library = await first.request("/library");
		assert.match(library.text, /data-library-mode="personal"/);
		assert.match(library.text, /removed when the workspace expires/);
		assert.doesNotMatch(library.text, /\/admin\/library\/exercises/);

		const exercise = (await db.query("SELECT id FROM exercises WHERE name = 'Squat'"))
			.rows[0];
		for (const client of [first, second]) {
			const guestLibrary = await client.request("/library");
			const created = await client.request(`/exercises/${exercise.id}/variants`, {
				method: "POST",
				form: {
					_csrf: csrfFrom(guestLibrary.text),
					name: "Guest Tempo Squat",
					equipmentId: "1",
				},
			});
			assert.equal(created.response.status, 302);
		}
		const privateVariants = await db.query(
			"SELECT owner_user_id FROM exercise_variants WHERE name = 'Guest Tempo Squat' ORDER BY owner_user_id",
		);
		assert.equal(privateVariants.rowCount, 2);
		assert.notEqual(
			privateVariants.rows[0].owner_user_id,
			privateVariants.rows[1].owner_user_id,
		);
	});

	test("an active guest converts in place and retains owned data", async () => {
		const client = agent();
		await enterGuest(client);
		const guest = (
			await db.query(
				"SELECT id FROM users WHERE role = 'guest' ORDER BY id DESC LIMIT 1",
			)
		).rows[0];
		const owned = (
			await db.query(
				"INSERT INTO programs (user_id, name) VALUES ($1, 'Guest plan') RETURNING id",
				[guest.id],
			)
		).rows[0];
		const variant = (
			await db.query(
				`INSERT INTO exercise_variants (exercise_id, owner_user_id, name)
				 SELECT id, $1, 'Guest-owned variant' FROM exercises WHERE name = 'Squat'
				 RETURNING id`,
				[guest.id],
			)
		).rows[0];

		const profile = await client.request("/profile");
		assert.match(profile.text, /Create a permanent account/);
		const signup = await client.request("/auth/login?tab=signup&returnTo=/profile");
		assert.equal(signup.response.status, 200);
		const oldCookie = client.cookie();
		const result = await client.request("/auth/register", {
			method: "POST",
			form: {
				_csrf: csrfFrom(signup.text),
				email: " Converted.Guest@Example.com ",
				password: "correct horse battery staple",
				returnTo: "/profile",
			},
		});

		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/profile");
		assert.notEqual(
			client.cookie(),
			oldCookie,
			"conversion must rotate the session ID",
		);
		const converted = (
			await db.query(
				`SELECT u.id, u.email, u.role, u.guest_expires_at,
				        ai.provider, ai.provider_subject, ai.password_hash
				 FROM users u JOIN auth_identities ai ON ai.user_id = u.id
				 WHERE u.id = $1`,
				[guest.id],
			)
		).rows[0];
		assert.equal(converted.id, guest.id);
		assert.equal(converted.email, "converted.guest@example.com");
		assert.equal(converted.role, "user");
		assert.equal(converted.guest_expires_at, null);
		assert.equal(converted.provider, "local");
		assert.equal(converted.provider_subject, "converted.guest@example.com");
		assert.notEqual(converted.password_hash, "correct horse battery staple");
		assert.equal(
			(await db.query("SELECT user_id FROM programs WHERE id = $1", [owned.id])).rows[0]
				.user_id,
			guest.id,
		);
		assert.equal(
			(
				await db.query("SELECT owner_user_id FROM exercise_variants WHERE id = $1", [
					variant.id,
				])
			).rows[0].owner_user_id,
			guest.id,
		);
		const convertedProfile = await client.request("/profile");
		assert.equal(convertedProfile.response.status, 200);
		assert.match(convertedProfile.text, /converted\.guest@example\.com/);
		assert.doesNotMatch(convertedProfile.text, /Temporary workspace/);
	});

	test("duplicate email leaves a guest and its data unchanged", async () => {
		const client = agent();
		await enterGuest(client);
		const guest = (
			await db.query(
				"SELECT id FROM users WHERE role = 'guest' ORDER BY id DESC LIMIT 1",
			)
		).rows[0];
		await db.query("INSERT INTO programs (user_id, name) VALUES ($1, 'Keep me')", [
			guest.id,
		]);
		const signup = await client.request("/auth/login?tab=signup");
		const result = await client.request("/auth/register", {
			method: "POST",
			form: {
				_csrf: csrfFrom(signup.text),
				email: " USER-ONE@EXAMPLE.COM ",
				password: "correct horse battery staple",
			},
		});

		assert.equal(result.response.status, 409);
		assert.match(result.text, /already exists/);
		const unchanged = (
			await db.query(
				`SELECT u.role, u.email, u.guest_expires_at,
				        COUNT(ai.id)::int AS identity_count,
				        COUNT(p.id)::int AS program_count
				 FROM users u
				 LEFT JOIN auth_identities ai ON ai.user_id = u.id
				 LEFT JOIN programs p ON p.user_id = u.id
				 WHERE u.id = $1
				 GROUP BY u.id`,
				[guest.id],
			)
		).rows[0];
		assert.equal(unchanged.role, "guest");
		assert.equal(unchanged.email, null);
		assert.ok(unchanged.guest_expires_at);
		assert.equal(unchanged.identity_count, 0);
		assert.equal(unchanged.program_count, 1);
		assert.equal((await client.request("/profile")).response.status, 200);
	});

	test("expired guests stop deserializing from their existing session", async () => {
		const client = agent();
		await enterGuest(client);
		await db.query(
			"UPDATE users SET guest_expires_at = NOW() - INTERVAL '1 minute' WHERE role = 'guest'",
		);
		const result = await client.request("/");
		assert.equal(result.response.status, 302);
		assert.match(result.response.headers.get("location"), /^\/auth\/login/);
	});

	test("identity subjects are unique and passwordless users are valid principals", async () => {
		assert.equal(
			(
				await db.query(
					`SELECT count(*)::int AS count FROM information_schema.columns
					 WHERE table_schema = 'public' AND table_name = 'users'
					   AND column_name = 'password_hash'`,
				)
			).rows[0].count,
			0,
		);
		const passwordless = (
			await db.query(
				"INSERT INTO users (email, role, name) VALUES ('google-only@example.com', 'user', 'Google User') RETURNING id",
			)
		).rows[0];
		const second = (
			await db.query(
				"INSERT INTO users (email, role, name) VALUES ('second-google@example.com', 'user', 'Second Google User') RETURNING id",
			)
		).rows[0];
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM auth_identities WHERE user_id = $1",
					[passwordless.id],
				)
			).rows[0].count,
			0,
		);
		const { findPrincipalById } =
			await import("../../src/features/users/repository.js");
		const { findPrincipalByProviderSubject } =
			await import("../../src/features/auth/authIdentitiesRepository.js");
		const { isUsablePrincipal } = await import("../../src/config/passport.js");
		const principal = await findPrincipalById({ userId: passwordless.id }, db);
		assert.equal(principal.email, "google-only@example.com");
		assert.equal(isUsablePrincipal(principal), true);

		await db.query(
			"INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, 'google', 'google-sub-123')",
			[passwordless.id],
		);
		const googlePrincipal = await findPrincipalByProviderSubject(
			{ provider: "google", providerSubject: "google-sub-123" },
			db,
		);
		assert.equal(googlePrincipal.id, passwordless.id);
		assert.equal(googlePrincipal.email, "google-only@example.com");
		await assert.rejects(
			db.query(
				"INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, 'google', 'google-sub-123')",
				[second.id],
			),
			(error) => error?.code === "23505",
		);
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
		assert.match(page.text, /data-library-mode="admin"/);
		assert.match(page.text, /Global catalog access/);
		assert.match(
			page.text,
			/href="\/admin\/library\/exercises"[\s\S]*?aria-current="page"/,
		);
		assert.doesNotMatch(page.text, /data-create-session-form/);
		assert.doesNotMatch(page.text, /Create your variant/);
		const adminProfile = await admin.request("/profile");
		assert.match(adminProfile.text, /Manage exercise catalog/);
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
			assert.match(library.text, /data-library-mode="personal"/);
			assert.match(library.text, /Create your variant/);
			assert.doesNotMatch(library.text, /Global catalog access/);
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
