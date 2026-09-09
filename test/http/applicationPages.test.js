import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { Client } from "pg";
import { schemaSql } from "../../db/schema.js";
import { seedSql } from "../../db/seed.js";
import { hashPassword } from "../../src/features/auth/passwordService.js";
import FakeEmailService from "../../src/infrastructure/email/FakeEmailService.js";

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
	let oauthServer;
	let oauthOrigin;
	let passwordHash;
	let passwordResetDeliveries;
	let emailService;

	before(async () => {
		process.env.DATABASE_URL = testDatabaseUrl;
		process.env.SESSION_SECRET = "http-integration-test-secret";
		process.env.GUEST_TTL_DAYS = "15";
		process.env.GOOGLE_CLIENT_ID = "google-test-client-id";
		process.env.GOOGLE_CLIENT_SECRET = "google-test-client-secret";
		process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/auth/google/callback";
		process.env.APP_BASE_URL = "http://localhost:3000";
		process.env.PASSWORD_RESET_TTL_MS = "1800000";
		emailService = new FakeEmailService();
		passwordResetDeliveries = emailService.deliveries;
		passwordHash = await hashPassword("correct horse battery staple");
		db = new Client({ connectionString: testDatabaseUrl });
		await db.connect();
		const { createApp } = await import("../../app.js");
		server = createApp({ emailService }).listen(0, "127.0.0.1");
		await new Promise((resolve, reject) => {
			server.once("listening", resolve);
			server.once("error", reject);
		});
		origin = `http://127.0.0.1:${server.address().port}`;

		const { createPassport, isUsablePrincipal, toPrincipal } =
			await import("../../src/config/passport.js");
		const { default: authenticateGoogleUser } =
			await import("../../src/features/auth/authenticateGoogleUser.js");
		const { default: linkGoogleIdentity } =
			await import("../../src/features/auth/linkGoogleIdentity.js");
		const fakePassport = createPassport();
		fakePassport.unuse("google");
		fakePassport.use("google", {
			name: "google",
			authenticate(req, options = {}) {
				if (typeof options.state === "string") {
					const prompt =
						typeof options.prompt === "string"
							? `&prompt=${encodeURIComponent(options.prompt)}`
							: "";
					this.redirect(
						`/auth/google/callback?code=fake-code&state=${encodeURIComponent(options.state)}${prompt}`,
					);
					return;
				}
				if (req.query?.providerError === "true") {
					const error = new Error("Simulated provider exchange failure");
					error.name = "InternalOAuthError";
					this.error(error);
					return;
				}
				const email = typeof req.query?.email === "string" ? req.query.email : null;
				const profile = {
					id: req.query?.sub,
					displayName: req.query?.name,
					emails: email
						? [{ value: email, verified: req.query?.verified === "true" }]
						: [],
				};
				const principal = req.user;
				const authentication = req.googleOAuthContext?.userId
					? linkGoogleIdentity({
							userId: req.googleOAuthContext.userId,
							profile,
							intent: req.googleOAuthContext.intent,
						})
					: authenticateGoogleUser({
							profile,
							guestUserId:
								principal?.role === "guest" && Number.isInteger(principal.id)
									? principal.id
									: null,
						});
				authentication.then(
					(account) => {
						if (account.role === "guest" || !isUsablePrincipal(account)) {
							this.fail({ message: "This account is not available." });
							return;
						}
						this.success(toPrincipal(account));
					},
					(error) => this.error(error),
				);
			},
		});
		oauthServer = createApp({ passport: fakePassport, emailService }).listen(
			0,
			"127.0.0.1",
		);
		await new Promise((resolve, reject) => {
			oauthServer.once("listening", resolve);
			oauthServer.once("error", reject);
		});
		oauthOrigin = `http://127.0.0.1:${oauthServer.address().port}`;
	});

	beforeEach(async () => {
		emailService.clear();
		await db.query(schemaSql);
		await db.query(seedSql);
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
		await Promise.all(
			[server, oauthServer].map(
				(activeServer) =>
					new Promise((resolve, reject) =>
						activeServer.close((error) => (error ? reject(error) : resolve())),
					),
			),
		);
		await db.end();
		const { default: pool } = await import("../../db/pool.js");
		await pool.end();
	});

	function agent(baseOrigin = origin) {
		let cookie = "";
		const request = async (path, options = {}) => {
			const headers = new Headers(options.headers);
			if (cookie) headers.set("cookie", cookie);
			if (options.form) {
				headers.set("content-type", "application/x-www-form-urlencoded");
				options.body = new URLSearchParams(options.form);
			}
			const response = await fetch(baseOrigin + path, {
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

	async function createPlanningFixture() {
		return (
			await db.query(`
				WITH owners AS (
					SELECT id, email FROM users
					WHERE email IN ('user-one@example.com', 'user-two@example.com')
				), owned_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'Direct access plan', DATE '2026-09-01' FROM owners
					WHERE email = 'user-one@example.com' RETURNING id, user_id
				), owned_cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Foundation block', 2, 1 FROM owned_program RETURNING id
				), owned_day AS (
					INSERT INTO training_days (cycle_id, day_order, label, scheduled_date)
					SELECT id, 1, 'Lower body day', DATE '2026-09-01' FROM owned_cycle
					RETURNING id
				), foreign_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'Private foreign plan', DATE '2026-09-01' FROM owners
					WHERE email = 'user-two@example.com' RETURNING id
				), foreign_cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Private foreign block', 1, 1 FROM foreign_program RETURNING id
				), foreign_day AS (
					INSERT INTO training_days (cycle_id, day_order, label, scheduled_date)
					SELECT id, 1, 'Private foreign day', DATE '2026-09-01' FROM foreign_cycle
					RETURNING id
				)
				SELECT owned_program.id AS program_id, owned_cycle.id AS cycle_id,
				       owned_day.id AS day_id, foreign_day.id AS foreign_day_id
				FROM owned_program, owned_cycle, owned_day, foreign_day
			`)
		).rows[0];
	}

	async function createWorkoutLifecycleFixture({
		email = "user-one@example.com",
		stepCount = 1,
		workoutCount = 1,
	} = {}) {
		const context = (
			await db.query(
				`WITH clock_dates AS (
				   SELECT CURRENT_DATE AS local_date,
				          (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date AS utc_date
				 ), selected_user AS (
				   SELECT id FROM users WHERE email = $1
				 ), program AS (
				   INSERT INTO programs (user_id, name, start_date)
				   SELECT id, 'Lifecycle program', LEAST(local_date, utc_date)
				   FROM selected_user CROSS JOIN clock_dates RETURNING id
				 ), cycle AS (
				   INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
				   SELECT id, 'Lifecycle cycle', 1 + ABS(local_date - utc_date), 1
				   FROM program CROSS JOIN clock_dates RETURNING id
				 ), training_day AS (
				   INSERT INTO training_days (cycle_id, day_order, scheduled_date)
				   SELECT id, 1, local_date FROM cycle CROSS JOIN clock_dates RETURNING id
				 ), template AS (
				   INSERT INTO sessions (owner_user_id, name)
				   SELECT id, 'Lifecycle session' FROM selected_user RETURNING id
				 )
				 SELECT selected_user.id AS user_id, program.id AS program_id,
				        training_day.id AS training_day_id, template.id AS session_id
				 FROM selected_user, program, training_day, template`,
				[email],
			)
		).rows[0];

		for (let index = 0; index < stepCount; index += 1) {
			await db.query(
				`INSERT INTO session_steps
				 (session_id, step_type_id, exercise_variant_id, name, sets, reps, step_order)
				 SELECT $1, st.id, ev.id, $2, 2, 8, $3
				 FROM step_types st
				 CROSS JOIN LATERAL (
				   SELECT id FROM exercise_variants
				   WHERE name = 'Bodyweight Push Up' AND owner_user_id IS NULL AND is_archived = FALSE
				 ) ev
				 WHERE st.name = 'exercise'`,
				[context.session_id, `Lifecycle step ${index + 1}`, index + 1],
			);
		}

		const workoutSessionIds = [];
		for (let index = 0; index < workoutCount; index += 1) {
			const workoutSession = (
				await db.query(
					`INSERT INTO workout_sessions
					 (training_day_id, session_id, workout_session_order)
					 VALUES ($1, $2, $3) RETURNING id`,
					[context.training_day_id, context.session_id, index + 1],
				)
			).rows[0];
			workoutSessionIds.push(workoutSession.id);
		}

		return { ...context, workoutSessionIds };
	}

	async function startFixtureWorkout(fixture, index = 0) {
		const { default: startWorkoutSession } =
			await import("../../src/features/workoutSessions/startWorkoutSession.js");
		const workoutSessionId = fixture.workoutSessionIds[index];
		await startWorkoutSession({
			workoutSessionId,
			userId: fixture.user_id,
		});
		return (
			await db.query(
				`SELECT * FROM workout_step_logs
				 WHERE workout_session_id = $1 ORDER BY step_order`,
				[workoutSessionId],
			)
		).rows;
	}

	async function enterGuest(client) {
		const page = await client.request("/auth/login");
		const result = await client.request("/auth/guest", {
			method: "POST",
			form: { _csrf: csrfFrom(page.text) },
		});
		assert.equal(result.response.status, 302);
	}

	async function beginGoogle(client, returnTo = "/") {
		const result = await client.request(
			`/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
		);
		assert.equal(result.response.status, 302);
		const location = result.response.headers.get("location");
		assert.ok(location);
		return {
			callback: new URL(location, oauthOrigin),
			stateSessionCookie: client.cookie(),
		};
	}

	async function completeGoogle(client, flow, profile = {}) {
		for (const [key, value] of Object.entries(profile)) {
			if (value !== undefined && value !== null) {
				flow.callback.searchParams.set(key, String(value));
			}
		}
		return client.request(flow.callback.pathname + flow.callback.search);
	}

	async function requestPasswordReset(client, email) {
		const page = await client.request("/auth/password-reset/request");
		return client.request("/auth/password-reset/request", {
			method: "POST",
			form: { _csrf: csrfFrom(page.text), email },
		});
	}

	test("a linked account securely resets its password without changing Google identity", async () => {
		await db.query(
			`INSERT INTO auth_identities (user_id, provider, provider_subject)
			 SELECT id, 'google', 'password-reset-google-sub' FROM users
			 WHERE email = 'user-one@example.com'`,
		);
		const client = agent();
		const response = await requestPasswordReset(client, "  USER-ONE@EXAMPLE.COM ");
		assert.equal(response.response.status, 200);
		assert.match(response.text, /If that email can use password sign-in/);
		assert.equal(passwordResetDeliveries.length, 1);
		const token = new URL(passwordResetDeliveries[0].resetUrl).searchParams.get(
			"token",
		);
		assert.ok(token);
		const stored = (
			await db.query("SELECT token_hash, consumed_at FROM password_reset_tokens")
		).rows[0];
		assert.notEqual(stored.token_hash, token);
		assert.equal(stored.consumed_at, null);

		const resetPage = await client.request(
			`/auth/password-reset?token=${encodeURIComponent(token)}`,
		);
		assert.equal(resetPage.response.status, 200);
		const completed = await client.request("/auth/password-reset", {
			method: "POST",
			form: {
				_csrf: csrfFrom(resetPage.text),
				token,
				password: "a brand new secure password",
				confirmPassword: "a brand new secure password",
			},
		});
		assert.equal(completed.response.status, 302);
		assert.equal(
			completed.response.headers.get("location"),
			"/auth/login?passwordReset=success",
		);
		assert.equal(
			(await client.request(`/auth/password-reset?token=${encodeURIComponent(token)}`))
				.response.status,
			400,
		);

		const loginPage = await client.request("/auth/login");
		const oldLogin = await client.request("/auth/login", {
			method: "POST",
			form: {
				_csrf: csrfFrom(loginPage.text),
				email: "user-one@example.com",
				password: "correct horse battery staple",
			},
		});
		assert.equal(oldLogin.response.status, 401);
		const fresh = agent();
		const freshPage = await fresh.request("/auth/login");
		const newLogin = await fresh.request("/auth/login", {
			method: "POST",
			form: {
				_csrf: csrfFrom(freshPage.text),
				email: "user-one@example.com",
				password: "a brand new secure password",
			},
		});
		assert.equal(newLogin.response.status, 302);

		const googleClient = agent(oauthOrigin);
		const flow = await beginGoogle(googleClient, "/profile");
		const googleLogin = await completeGoogle(googleClient, flow, {
			sub: "password-reset-google-sub",
		});
		assert.equal(googleLogin.response.status, 302);
		assert.equal(googleLogin.response.headers.get("location"), "/profile");
		const profile = await googleClient.request("/profile");
		assert.equal(profile.response.status, 200);
		assert.match(profile.text, /User One/);
		assert.equal(
			(
				await db.query(
					"SELECT COUNT(*)::int AS count FROM auth_identities WHERE provider = 'google' AND provider_subject = 'password-reset-google-sub'",
				)
			).rows[0].count,
			1,
		);
	});

	test("reset requests do not disclose unknown or Google-only accounts", async () => {
		await db.query(
			`INSERT INTO users (email, name) VALUES ('google-only@example.com', 'Google')`,
		);
		await db.query(`INSERT INTO auth_identities (user_id, provider, provider_subject, provider_email)
		 SELECT id, 'google', 'google-only-sub', email FROM users WHERE email = 'google-only@example.com'`);
		const responses = [];
		for (const email of ["unknown@example.com", "google-only@example.com"]) {
			const result = await requestPasswordReset(agent(), email);
			responses.push({ status: result.response.status, text: result.text });
		}
		assert.equal(responses[0].status, responses[1].status);
		assert.equal(
			responses[0].text.replace(/name="_csrf" value="[^"]+"/, "name=csrf"),
			responses[1].text.replace(/name="_csrf" value="[^"]+"/, "name=csrf"),
		);
		assert.equal(passwordResetDeliveries.length, 0);
		assert.equal(
			(await db.query("SELECT COUNT(*)::int AS count FROM password_reset_tokens"))
				.rows[0].count,
			0,
		);
	});

	test("reset delivery failures retain the neutral public response", async () => {
		const sendPasswordReset = emailService.sendPasswordReset;
		const originalConsoleError = console.error;
		const diagnostics = [];
		emailService.sendPasswordReset = async () => {
			throw Object.assign(
				new Error(
					`Rejected user-one@example.com /auth/password-reset?token=secret-token`,
				),
				{ category: "provider_rejected", providerRequestId: "request_123" },
			);
		};
		console.error = (...values) => diagnostics.push(values.join(" "));
		try {
			const failed = await requestPasswordReset(agent(), "user-one@example.com");
			const unknown = await requestPasswordReset(agent(), "unknown@example.com");
			assert.equal(failed.response.status, unknown.response.status);
			assert.equal(
				failed.text.replace(/name="_csrf" value="[^"]+"/, "name=csrf"),
				unknown.text.replace(/name="_csrf" value="[^"]+"/, "name=csrf"),
			);
			assert.equal(diagnostics.length, 1);
			assert.match(diagnostics[0], /provider_rejected/);
			assert.match(diagnostics[0], /provider_rejected request_123/);
			assert.doesNotMatch(
				diagnostics[0],
				/user-one|password-reset\?token|secret-token/,
			);
		} finally {
			emailService.sendPasswordReset = sendPasswordReset;
			console.error = originalConsoleError;
		}
	});

	test("reset requests are limited per IP without sending additional email", async () => {
		const client = agent();
		for (let attempt = 0; attempt < 5; attempt += 1) {
			const result = await requestPasswordReset(client, "user-one@example.com");
			assert.equal(result.response.status, 200);
		}
		const limited = await requestPasswordReset(client, "user-one@example.com");
		assert.equal(limited.response.status, 429);
		assert.match(limited.text, /Too many reset requests/);
		assert.equal(passwordResetDeliveries.length, 5);
	});

	test("new requests invalidate old tokens and expired, malformed, and unknown tokens fail safely", async () => {
		await requestPasswordReset(agent(), "user-one@example.com");
		const first = new URL(passwordResetDeliveries[0].resetUrl).searchParams.get(
			"token",
		);
		await requestPasswordReset(agent(), "user-one@example.com");
		const second = new URL(passwordResetDeliveries[1].resetUrl).searchParams.get(
			"token",
		);
		const client = agent();
		assert.equal(
			(await client.request(`/auth/password-reset?token=${first}`)).response.status,
			400,
		);
		await db.query(
			"UPDATE password_reset_tokens SET created_at = NOW() - INTERVAL '2 seconds', expires_at = NOW() - INTERVAL '1 second' WHERE consumed_at IS NULL",
		);
		assert.equal(
			(await client.request(`/auth/password-reset?token=${second}`)).response.status,
			400,
		);
		assert.equal(
			(await client.request("/auth/password-reset?token=bad")).response.status,
			400,
		);
		assert.equal(
			(await client.request(`/auth/password-reset?token=${"A".repeat(43)}`)).response
				.status,
			400,
		);
	});

	test("reset validation enforces password policy and confirmation", async () => {
		await requestPasswordReset(agent(), "user-one@example.com");
		const token = new URL(passwordResetDeliveries[0].resetUrl).searchParams.get(
			"token",
		);
		const client = agent();
		const page = await client.request(`/auth/password-reset?token=${token}`);
		for (const [password, confirmPassword, message] of [
			["short", "short", /at least 12/],
			["a sufficiently long password", "a different long password", /must match/],
		]) {
			const result = await client.request("/auth/password-reset", {
				method: "POST",
				form: { _csrf: csrfFrom(page.text), token, password, confirmPassword },
			});
			assert.equal(result.response.status, 422);
			assert.match(result.text, message);
		}
		assert.equal(
			(await db.query("SELECT consumed_at FROM password_reset_tokens")).rows[0]
				.consumed_at,
			null,
		);
	});

	test("concurrent reset submissions consume once and invalidate existing sessions", async () => {
		const existingSession = agent();
		await login(existingSession);
		await requestPasswordReset(agent(), "user-one@example.com");
		const token = new URL(passwordResetDeliveries[0].resetUrl).searchParams.get(
			"token",
		);
		const clients = [agent(), agent()];
		const pages = await Promise.all(
			clients.map((client) => client.request(`/auth/password-reset?token=${token}`)),
		);
		const results = await Promise.all(
			clients.map((client, index) =>
				client.request("/auth/password-reset", {
					method: "POST",
					form: {
						_csrf: csrfFrom(pages[index].text),
						token,
						password: "one concurrent replacement",
						confirmPassword: "one concurrent replacement",
					},
				}),
			),
		);
		assert.deepEqual(
			results.map((result) => result.response.status).sort(),
			[302, 400],
		);
		assert.equal((await existingSession.request("/")).response.status, 302);
	});

	test("a failed password update rolls back token consumption", async () => {
		await requestPasswordReset(agent(), "user-one@example.com");
		const token = new URL(passwordResetDeliveries[0].resetUrl).searchParams.get(
			"token",
		);
		await db.query(`CREATE FUNCTION fail_password_reset_update() RETURNS trigger LANGUAGE plpgsql AS $$
		 BEGIN RAISE EXCEPTION 'simulated password update failure'; END $$`);
		await db.query(`CREATE TRIGGER fail_password_reset_update BEFORE UPDATE OF password_hash ON auth_identities
		 FOR EACH ROW EXECUTE FUNCTION fail_password_reset_update()`);
		try {
			const client = agent();
			const page = await client.request(`/auth/password-reset?token=${token}`);
			const result = await client.request("/auth/password-reset", {
				method: "POST",
				form: {
					_csrf: csrfFrom(page.text),
					token,
					password: "valid replacement password",
					confirmPassword: "valid replacement password",
				},
			});
			assert.equal(result.response.status, 500);
			assert.equal(
				(await db.query("SELECT consumed_at FROM password_reset_tokens")).rows[0]
					.consumed_at,
				null,
			);
		} finally {
			await db.query("DROP FUNCTION fail_password_reset_update() CASCADE");
		}
	});

	async function beginGoogleLink(client) {
		const profile = await client.request("/profile");
		const result = await client.request("/auth/google/link", {
			method: "POST",
			form: { _csrf: csrfFrom(profile.text) },
		});
		assert.equal(result.response.status, 302);
		const location = result.response.headers.get("location");
		assert.ok(location);
		const authorizationUrl = new URL(location, oauthOrigin);
		return {
			callback: authorizationUrl,
			authorizationUrl,
			stateSessionCookie: client.cookie(),
		};
	}

	async function beginGoogleReplace(client) {
		const profile = await client.request("/profile");
		const result = await client.request("/auth/google/replace", {
			method: "POST",
			form: { _csrf: csrfFrom(profile.text) },
		});
		assert.equal(result.response.status, 302);
		const location = result.response.headers.get("location");
		assert.ok(location);
		return {
			callback: new URL(location, oauthOrigin),
			stateSessionCookie: client.cookie(),
		};
	}

	async function assertGoogleStateCleared() {
		const { rows } = await db.query(`SELECT sess FROM "session"`);
		assert.equal(
			rows.some((row) => JSON.stringify(row.sess).includes("googleOAuth")),
			false,
		);
	}

	test("PostgreSQL session store persists and reloads Express sessions", async () => {
		const client = agent();
		const firstPage = await client.request("/auth/login");
		assert.equal(firstPage.response.status, 200);
		assert.notEqual(client.cookie(), "");

		const csrfToken = csrfFrom(firstPage.text);
		const storedSessions = (await db.query(`SELECT sess FROM "session" ORDER BY "sid"`))
			.rows;
		assert.equal(storedSessions.length, 1);
		assert.equal(storedSessions[0].sess.csrfToken, csrfToken);

		const secondPage = await client.request("/auth/login");
		assert.equal(secondPage.response.status, 200);
		assert.equal(csrfFrom(secondPage.text), csrfToken);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM sessions")).rows[0].count,
			1,
		);
	});

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
		assert.match(result.text, /Continue with Google/);
		assert.match(result.text, /role="tablist"/);

		const google = await client.request("/auth/google?returnTo=/library");
		assert.equal(google.response.status, 302);
		const googleLocation = new URL(google.response.headers.get("location"));
		assert.equal(googleLocation.hostname, "accounts.google.com");
		assert.ok(googleLocation.searchParams.get("state"));
		assert.deepEqual(
			new Set(googleLocation.searchParams.get("scope").split(" ")),
			new Set(["profile", "email"]),
		);

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

	test("an existing Google subject resolves the same provider-neutral user", async () => {
		await db.query(
			`INSERT INTO auth_identities (user_id, provider, provider_subject)
			 SELECT id, 'google', 'existing-google-sub' FROM users
			 WHERE email = 'user-one@example.com'`,
		);
		const client = agent(oauthOrigin);
		const flow = await beginGoogle(client, "/profile");
		const result = await completeGoogle(client, flow, {
			sub: "existing-google-sub",
		});

		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/profile");
		assert.notEqual(client.cookie(), flow.stateSessionCookie);
		const profile = await client.request("/profile");
		assert.equal(profile.response.status, 200);
		assert.match(profile.text, /User One/);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM auth_identities WHERE provider = 'google' AND provider_subject = 'existing-google-sub'",
				)
			).rows[0].count,
			1,
		);
		await assertGoogleStateCleared();
	});

	test("an authenticated local user explicitly links Google without changing ownership or creating a user", async () => {
		const client = agent(oauthOrigin);
		await login(client);
		const user = (
			await db.query("SELECT id FROM users WHERE email = 'user-one@example.com'")
		).rows[0];
		const program = (
			await db.query(
				"INSERT INTO programs (user_id, name) VALUES ($1, 'Linked plan') RETURNING id",
				[user.id],
			)
		).rows[0];
		const variant = (
			await db.query(
				`INSERT INTO exercise_variants (exercise_id, owner_user_id, name)
				 SELECT id, $1, 'Linked private variant' FROM exercises WHERE name = 'Squat'
				 RETURNING id`,
				[user.id],
			)
		).rows[0];
		const sessionTemplate = (
			await db.query(
				"INSERT INTO sessions (owner_user_id, name) VALUES ($1, 'Linked session') RETURNING id",
				[user.id],
			)
		).rows[0];
		const cycle = (
			await db.query(
				"INSERT INTO cycles (program_id, name, cycle_order) VALUES ($1, 'Linked cycle', 1) RETURNING id",
				[program.id],
			)
		).rows[0];
		const trainingDay = (
			await db.query(
				"INSERT INTO training_days (cycle_id, day_order) VALUES ($1, 1) RETURNING id",
				[cycle.id],
			)
		).rows[0];
		const workout = (
			await db.query(
				`INSERT INTO workout_sessions
				 (training_day_id, session_id, workout_session_order)
				 VALUES ($1, $2, 1) RETURNING id`,
				[trainingDay.id, sessionTemplate.id],
			)
		).rows[0];
		const usersBefore = (await db.query("SELECT count(*)::int AS count FROM users"))
			.rows[0].count;
		const profileBefore = await client.request("/profile");
		assert.match(profileBefore.text, /Password[\s\S]*Connected/);
		assert.match(profileBefore.text, /Google[\s\S]*Link Google account/);

		const flow = await beginGoogleLink(client);
		const result = await completeGoogle(client, flow, {
			sub: "linked-google-sub",
			email: "user-two@example.com",
			verified: true,
			name: "Must Not Replace",
		});

		assert.equal(result.response.status, 302);
		assert.equal(
			result.response.headers.get("location"),
			"/profile?googleLink=connected",
		);
		assert.notEqual(
			client.cookie(),
			flow.stateSessionCookie,
			"linking must rotate the session ID",
		);
		const identity = (
			await db.query(
				"SELECT user_id, provider_email FROM auth_identities WHERE provider = 'google' AND provider_subject = 'linked-google-sub'",
			)
		).rows[0];
		assert.equal(identity.user_id, user.id);
		assert.equal(identity.provider_email, "user-two@example.com");
		assert.equal(
			(await db.query("SELECT email FROM users WHERE id = $1", [user.id])).rows[0]
				.email,
			"user-one@example.com",
		);
		assert.equal(
			(await db.query("SELECT user_id FROM programs WHERE id = $1", [program.id]))
				.rows[0].user_id,
			user.id,
		);
		assert.equal(
			(
				await db.query("SELECT owner_user_id FROM exercise_variants WHERE id = $1", [
					variant.id,
				])
			).rows[0].owner_user_id,
			user.id,
		);
		assert.equal(
			(
				await db.query("SELECT owner_user_id FROM sessions WHERE id = $1", [
					sessionTemplate.id,
				])
			).rows[0].owner_user_id,
			user.id,
		);
		assert.equal(
			(
				await db.query(
					`SELECT p.user_id FROM workout_sessions ws
					 JOIN training_days td ON td.id = ws.training_day_id
					 JOIN cycles c ON c.id = td.cycle_id
					 JOIN programs p ON p.id = c.program_id
					 WHERE ws.id = $1`,
					[workout.id],
				)
			).rows[0].user_id,
			user.id,
		);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM users")).rows[0].count,
			usersBefore,
		);
		assert.match(
			(await client.request("/profile?googleLink=connected")).text,
			/Google is now connected/,
		);
		await assertGoogleStateCleared();
	});

	test("a newly registered password account can immediately link a new Google subject", async () => {
		const client = agent(oauthOrigin);
		const signup = await client.request("/auth/login?tab=signup&returnTo=/profile");
		const registration = await client.request("/auth/register", {
			method: "POST",
			form: {
				_csrf: csrfFrom(signup.text),
				email: "fresh-link@example.com",
				password: "correct horse battery staple",
				returnTo: "/profile",
			},
		});
		assert.equal(registration.response.status, 302);
		assert.equal(registration.response.headers.get("location"), "/profile");
		const registered = (
			await db.query("SELECT id FROM users WHERE email = 'fresh-link@example.com'")
		).rows[0];
		const passwordOnlyProfile = await client.request("/profile");
		assert.match(
			passwordOnlyProfile.text,
			/<form method="POST" action="\/auth\/google\/link">[\s\S]*data-google-action>Link Google account<\/button>/,
		);
		assert.match(passwordOnlyProfile.text, /Password[\s\S]*Connected/);
		assert.match(passwordOnlyProfile.text, /Google[\s\S]*Not linked/);

		const flow = await beginGoogleLink(client);
		assert.equal(flow.authorizationUrl.searchParams.get("prompt"), "select_account");
		const linked = await completeGoogle(client, flow, {
			sub: "freshly-linked-google-sub",
			email: "fresh-link@example.com",
			verified: true,
		});

		assert.equal(linked.response.status, 302);
		assert.equal(
			linked.response.headers.get("location"),
			"/profile?googleLink=connected",
		);
		assert.deepEqual(
			(
				await db.query(
					"SELECT provider, user_id FROM auth_identities WHERE user_id = $1 ORDER BY provider",
					[registered.id],
				)
			).rows,
			[
				{ provider: "google", user_id: registered.id },
				{ provider: "local", user_id: registered.id },
			],
		);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM users WHERE email = 'fresh-link@example.com'",
				)
			).rows[0].count,
			1,
		);
		const linkedProfile = await client.request("/profile");
		assert.match(linkedProfile.text, /Google[\s\S]*Connected/);
		assert.match(
			linkedProfile.text,
			/<form method="POST" action="\/auth\/google\/replace">[\s\S]*data-google-action>Change Google account<\/button>/,
		);
		assert.doesNotMatch(
			linkedProfile.text,
			/<form method="POST" action="\/auth\/google\/link">/,
		);
	});

	test("Google linking rejects another user's subject and leaves both accounts unchanged", async () => {
		const owner = (
			await db.query("SELECT id FROM users WHERE email = 'user-two@example.com'")
		).rows[0];
		await db.query(
			"INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, 'google', 'owned-google-sub')",
			[owner.id],
		);
		const client = agent(oauthOrigin);
		await login(client);
		const before = await db.query(
			"SELECT user_id, provider, provider_subject FROM auth_identities ORDER BY id",
		);

		const flow = await beginGoogleLink(client);
		const result = await completeGoogle(client, flow, { sub: "owned-google-sub" });
		assert.equal(result.response.status, 302);
		assert.equal(
			result.response.headers.get("location"),
			"/profile?googleLink=conflict",
		);
		assert.deepEqual(
			(
				await db.query(
					"SELECT user_id, provider, provider_subject FROM auth_identities ORDER BY id",
				)
			).rows,
			before.rows,
		);
		assert.match(
			(await client.request("/profile?googleLink=conflict")).text,
			/already connected to another Let&#39;s Flex account/,
		);
	});

	test("replacing Google with the same subject is idempotent", async () => {
		const user = (
			await db.query("SELECT id FROM users WHERE email = 'user-one@example.com'")
		).rows[0];
		await db.query(
			"INSERT INTO auth_identities (user_id, provider, provider_subject, provider_email) VALUES ($1, 'google', 'same-google-sub', 'same-google@example.com')",
			[user.id],
		);
		const client = agent(oauthOrigin);
		await login(client);
		const before = (
			await db.query(
				"SELECT id, created_at, updated_at FROM auth_identities WHERE provider = 'google' AND provider_subject = 'same-google-sub'",
			)
		).rows[0];
		const flow = await beginGoogleReplace(client);
		const result = await completeGoogle(client, flow, { sub: "same-google-sub" });
		assert.equal(
			result.response.headers.get("location"),
			"/profile?googleLink=replaced",
		);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM auth_identities WHERE provider = 'google' AND provider_subject = 'same-google-sub'",
				)
			).rows[0].count,
			1,
		);
		assert.deepEqual(
			(
				await db.query(
					"SELECT id, created_at, updated_at FROM auth_identities WHERE provider = 'google' AND provider_subject = 'same-google-sub'",
				)
			).rows[0],
			before,
		);
	});

	test("unauthenticated users cannot initiate explicit Google linking", async () => {
		const client = agent(oauthOrigin);
		const loginPage = await client.request("/auth/login");
		const result = await client.request("/auth/google/link", {
			method: "POST",
			form: { _csrf: csrfFrom(loginPage.text) },
		});
		assert.equal(result.response.status, 302);
		assert.match(result.response.headers.get("location"), /^\/auth\/login/);
	});

	test("a new verified Google profile creates one user keyed by sub, not email", async () => {
		const client = agent(oauthOrigin);
		const flow = await beginGoogle(client, "//evil.example/phish");
		const result = await completeGoogle(client, flow, {
			sub: "stable-google-sub-101",
			email: " New.Google@Example.COM ",
			verified: true,
			name: "Google Member",
		});

		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/");
		assert.notEqual(client.cookie(), flow.stateSessionCookie);
		const created = (
			await db.query(
				`SELECT u.id, u.email, u.name, u.role, ai.provider_subject, ai.password_hash
				 FROM users u JOIN auth_identities ai ON ai.user_id = u.id
				 WHERE ai.provider = 'google' AND ai.provider_subject = 'stable-google-sub-101'`,
			)
		).rows[0];
		assert.equal(created.email, "new.google@example.com");
		assert.equal(created.name, "Google Member");
		assert.equal(created.role, "user");
		assert.equal(created.provider_subject, "stable-google-sub-101");
		assert.notEqual(created.provider_subject, created.email);
		assert.equal(created.password_hash, null);
		const googleOnlyProfile = await client.request("/profile");
		assert.match(googleOnlyProfile.text, /Password[\s\S]*Not set/);
		assert.match(googleOnlyProfile.text, /Google[\s\S]*Connected/);
		assert.match(googleOnlyProfile.text, /new\.google@example\.com/);
		assert.match(googleOnlyProfile.text, /Add a password/);
		assert.doesNotMatch(
			googleOnlyProfile.text,
			/action="\/auth\/google\/(?:link|replace)"/,
		);

		const repeat = agent(oauthOrigin);
		const repeatFlow = await beginGoogle(repeat, "/profile");
		const repeated = await completeGoogle(repeat, repeatFlow, {
			sub: "stable-google-sub-101",
		});
		assert.equal(repeated.response.status, 302);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM users WHERE email = 'new.google@example.com'",
				)
			).rows[0].count,
			1,
		);
		assert.match((await repeat.request("/profile")).text, /Google Member/);
		await assertGoogleStateCleared();
	});

	test("a Google-created user adds a password and later authenticates both ways as the same user", async () => {
		const googleClient = agent(oauthOrigin);
		const googleFlow = await beginGoogle(googleClient, "/profile");
		const googleRegistration = await completeGoogle(googleClient, googleFlow, {
			sub: "lifecycle-google-sub",
			email: "lifecycle.google@example.com",
			verified: true,
			name: "Lifecycle Member",
		});
		assert.equal(googleRegistration.response.status, 302);
		const originalUser = (
			await db.query(
				`SELECT u.id, u.email FROM users u
				 JOIN auth_identities ai ON ai.user_id = u.id
				 WHERE ai.provider = 'google' AND ai.provider_subject = 'lifecycle-google-sub'`,
			)
		).rows[0];
		const beforePassword = await googleClient.request("/profile");
		assert.match(beforePassword.text, /Password[\s\S]*Not set/);
		assert.match(beforePassword.text, /Add a password/);

		let result = await googleClient.request("/profile/password", {
			method: "POST",
			form: {
				_csrf: csrfFrom(beforePassword.text),
				password: "short",
				confirmPassword: "different",
			},
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /at least 12 characters/);
		assert.match(result.text, /Passwords must match/);
		assert.doesNotMatch(result.text, /value="short"/);

		const oldCookie = googleClient.cookie();
		result = await googleClient.request("/profile/password", {
			method: "POST",
			form: {
				_csrf: csrfFrom(result.text),
				password: "a newly added secure password",
				confirmPassword: "a newly added secure password",
			},
		});
		assert.equal(result.response.status, 302);
		assert.equal(result.response.headers.get("location"), "/profile?password=added");
		assert.notEqual(
			googleClient.cookie(),
			oldCookie,
			"adding a password must rotate the session",
		);
		const identities = (
			await db.query(
				`SELECT provider, provider_subject, provider_email, password_hash
				 FROM auth_identities WHERE user_id = $1 ORDER BY provider`,
				[originalUser.id],
			)
		).rows;
		assert.equal(identities.length, 2);
		assert.equal(identities[0].provider, "google");
		assert.equal(identities[0].provider_email, "lifecycle.google@example.com");
		assert.equal(identities[1].provider, "local");
		assert.notEqual(identities[1].password_hash, "a newly added secure password");

		const combinedProfile = await googleClient.request("/profile");
		result = await googleClient.request("/profile/password", {
			method: "POST",
			form: {
				_csrf: csrfFrom(combinedProfile.text),
				password: "another secure password",
				confirmPassword: "another secure password",
			},
		});
		assert.equal(result.response.status, 409);
		assert.match(result.text, /password is already set/i);

		const logoutPage = await googleClient.request("/profile");
		await googleClient.request("/auth/logout", {
			method: "POST",
			form: { _csrf: csrfFrom(logoutPage.text) },
		});
		const loginPage = await googleClient.request("/auth/login");
		const localLogin = await googleClient.request("/auth/login", {
			method: "POST",
			form: {
				_csrf: csrfFrom(loginPage.text),
				email: originalUser.email,
				password: "a newly added secure password",
				returnTo: "/profile",
			},
		});
		assert.equal(localLogin.response.status, 302);
		assert.match((await googleClient.request("/profile")).text, /Lifecycle Member/);

		const secondLogoutPage = await googleClient.request("/profile");
		await googleClient.request("/auth/logout", {
			method: "POST",
			form: { _csrf: csrfFrom(secondLogoutPage.text) },
		});
		const secondGoogleFlow = await beginGoogle(googleClient, "/profile");
		const secondGoogleLogin = await completeGoogle(googleClient, secondGoogleFlow, {
			sub: "lifecycle-google-sub",
		});
		assert.equal(secondGoogleLogin.response.status, 302);
		assert.match((await googleClient.request("/profile")).text, /Lifecycle Member/);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM users WHERE email = 'lifecycle.google@example.com'",
				)
			).rows[0].count,
			1,
		);
		assert.deepEqual(
			(
				await db.query(
					"SELECT DISTINCT user_id FROM auth_identities WHERE provider_subject IN ('lifecycle-google-sub', 'lifecycle.google@example.com')",
				)
			).rows,
			[{ user_id: originalUser.id }],
		);
	});

	test("a password and Google user atomically replaces Google without changing account ownership", async () => {
		const client = agent(oauthOrigin);
		await login(client);
		const user = (
			await db.query("SELECT id, email FROM users WHERE email = 'user-one@example.com'")
		).rows[0];
		const oldIdentity = (
			await db.query(
				`INSERT INTO auth_identities
				 (user_id, provider, provider_subject, provider_email)
				 VALUES ($1, 'google', 'old-google-sub', 'old.google@example.com')
				 RETURNING id`,
				[user.id],
			)
		).rows[0];
		const program = (
			await db.query(
				"INSERT INTO programs (user_id, name) VALUES ($1, 'Replacement plan') RETURNING id",
				[user.id],
			)
		).rows[0];
		const profile = await client.request("/profile");
		assert.match(profile.text, /old\.google@example\.com/);
		assert.match(profile.text, /Change Google account/);

		const flow = await beginGoogleReplace(client);
		assert.deepEqual(
			(
				await db.query(
					"SELECT provider_subject, provider_email FROM auth_identities WHERE id = $1",
					[oldIdentity.id],
				)
			).rows[0],
			{ provider_subject: "old-google-sub", provider_email: "old.google@example.com" },
		);
		const replaced = await completeGoogle(client, flow, {
			sub: "new-google-sub",
			email: "new.work@example.com",
			verified: true,
		});
		assert.equal(replaced.response.status, 302);
		assert.equal(
			replaced.response.headers.get("location"),
			"/profile?googleLink=replaced",
		);
		assert.notEqual(client.cookie(), flow.stateSessionCookie);
		assert.deepEqual(
			(
				await db.query(
					"SELECT id, user_id, provider_subject, provider_email FROM auth_identities WHERE id = $1",
					[oldIdentity.id],
				)
			).rows[0],
			{
				id: oldIdentity.id,
				user_id: user.id,
				provider_subject: "new-google-sub",
				provider_email: "new.work@example.com",
			},
		);
		assert.equal(
			(await db.query("SELECT email FROM users WHERE id = $1", [user.id])).rows[0]
				.email,
			user.email,
		);
		assert.equal(
			(await db.query("SELECT user_id FROM programs WHERE id = $1", [program.id]))
				.rows[0].user_id,
			user.id,
		);
	});

	test("Google replacement conflict preserves the old identity and authenticated user", async () => {
		const users = (
			await db.query(
				"SELECT id, email FROM users WHERE email IN ('user-one@example.com', 'user-two@example.com') ORDER BY email",
			)
		).rows;
		await db.query(
			`INSERT INTO auth_identities (user_id, provider, provider_subject, provider_email)
			 VALUES ($1, 'google', 'user-a-google-sub', 'a.google@example.com'),
			        ($2, 'google', 'user-b-google-sub', 'b.google@example.com')`,
			[users[0].id, users[1].id],
		);
		const client = agent(oauthOrigin);
		await login(client, "user-one@example.com");
		const before = (
			await db.query(
				"SELECT user_id, provider_subject, provider_email FROM auth_identities WHERE provider = 'google' ORDER BY user_id",
			)
		).rows;
		const flow = await beginGoogleReplace(client);
		const conflict = await completeGoogle(client, flow, { sub: "user-b-google-sub" });
		assert.equal(
			conflict.response.headers.get("location"),
			"/profile?googleLink=conflict",
		);
		assert.deepEqual(
			(
				await db.query(
					"SELECT user_id, provider_subject, provider_email FROM auth_identities WHERE provider = 'google' ORDER BY user_id",
				)
			).rows,
			before,
		);
		assert.match((await client.request("/profile")).text, /User One/);
	});

	test("unauthenticated users cannot add a password or replace Google", async () => {
		const client = agent(oauthOrigin);
		const loginPage = await client.request("/auth/login");
		for (const path of ["/profile/password", "/auth/google/replace"]) {
			const result = await client.request(path, {
				method: "POST",
				form: {
					_csrf: csrfFrom(loginPage.text),
					password: "a valid password value",
					confirmPassword: "a valid password value",
				},
			});
			assert.equal(result.response.status, 302);
			assert.match(result.response.headers.get("location"), /^\/auth\/login/);
		}
	});

	test("Google converts an active guest in place and retains owned data", async () => {
		const client = agent(oauthOrigin);
		await enterGuest(client);
		const guest = (
			await db.query(
				"SELECT id FROM users WHERE role = 'guest' ORDER BY id DESC LIMIT 1",
			)
		).rows[0];
		const program = (
			await db.query(
				"INSERT INTO programs (user_id, name) VALUES ($1, 'Google guest plan') RETURNING id",
				[guest.id],
			)
		).rows[0];
		const variant = (
			await db.query(
				`INSERT INTO exercise_variants (exercise_id, owner_user_id, name)
				 SELECT id, $1, 'Google guest variant' FROM exercises WHERE name = 'Squat'
				 RETURNING id`,
				[guest.id],
			)
		).rows[0];

		const flow = await beginGoogle(client, "/profile");
		const result = await completeGoogle(client, flow, {
			sub: "converted-guest-google-sub",
			email: "google.converted@example.com",
			verified: true,
			name: "Converted with Google",
		});

		assert.equal(result.response.status, 302);
		const converted = (
			await db.query(
				`SELECT u.id, u.email, u.role, u.guest_expires_at, ai.provider_subject
				 FROM users u JOIN auth_identities ai ON ai.user_id = u.id
				 WHERE u.id = $1 AND ai.provider = 'google'`,
				[guest.id],
			)
		).rows[0];
		assert.equal(converted.id, guest.id);
		assert.equal(converted.email, "google.converted@example.com");
		assert.equal(converted.role, "user");
		assert.equal(converted.guest_expires_at, null);
		assert.equal(converted.provider_subject, "converted-guest-google-sub");
		assert.equal(
			(await db.query("SELECT user_id FROM programs WHERE id = $1", [program.id]))
				.rows[0].user_id,
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
		assert.match((await client.request("/profile")).text, /Converted with Google/);
		await assertGoogleStateCleared();
	});

	test("Google email collision does not link and rolls guest conversion back", async () => {
		const client = agent(oauthOrigin);
		await enterGuest(client);
		const guest = (
			await db.query(
				"SELECT id FROM users WHERE role = 'guest' ORDER BY id DESC LIMIT 1",
			)
		).rows[0];
		await db.query(
			"INSERT INTO programs (user_id, name) VALUES ($1, 'Rollback Google plan')",
			[guest.id],
		);
		const flow = await beginGoogle(client, "/profile");
		const result = await completeGoogle(client, flow, {
			sub: "unlinked-google-sub",
			email: "USER-ONE@EXAMPLE.COM",
			verified: true,
			name: "Must Not Link",
		});

		assert.equal(result.response.status, 409);
		assert.match(result.text, /Sign in using its existing authentication method/);
		const unchanged = (
			await db.query(
				`SELECT u.role, u.email, u.guest_expires_at,
				        COUNT(ai.id)::int AS identity_count,
				        COUNT(p.id)::int AS program_count
				 FROM users u
				 LEFT JOIN auth_identities ai ON ai.user_id = u.id
				 LEFT JOIN programs p ON p.user_id = u.id
				 WHERE u.id = $1 GROUP BY u.id`,
				[guest.id],
			)
		).rows[0];
		assert.equal(unchanged.role, "guest");
		assert.equal(unchanged.email, null);
		assert.ok(unchanged.guest_expires_at);
		assert.equal(unchanged.identity_count, 0);
		assert.equal(unchanged.program_count, 2);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM auth_identities WHERE provider = 'google' AND provider_subject = 'unlinked-google-sub'",
				)
			).rows[0].count,
			0,
		);
		assert.equal((await client.request("/profile")).response.status, 200);
		await assertGoogleStateCleared();
	});

	test("invalid Google profiles and OAuth callbacks create no partial data", async () => {
		const client = agent(oauthOrigin);
		let flow = await beginGoogle(client, "/library");
		let result = await completeGoogle(client, flow, {
			sub: "unverified-google-sub",
			email: "unverified@example.com",
			verified: false,
		});
		assert.equal(result.response.status, 422);
		assert.match(result.text, /usable verified email address/);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM users WHERE email = 'unverified@example.com'",
				)
			).rows[0].count,
			0,
		);
		await assertGoogleStateCleared();

		flow = await beginGoogle(client, "/library");
		flow.callback.searchParams.set("state", "invalid-state");
		result = await completeGoogle(client, flow, {
			sub: "invalid-state-sub",
			email: "invalid-state@example.com",
			verified: true,
		});
		assert.equal(result.response.status, 403);
		assert.match(result.text, /could not be verified/);
		await assertGoogleStateCleared();

		flow = await beginGoogle(client, "/library");
		result = await completeGoogle(client, flow, { providerError: true });
		assert.equal(result.response.status, 401);
		assert.match(result.text, /could not be completed/);
		assert.doesNotMatch(result.text, /Simulated provider exchange failure/);
		await assertGoogleStateCleared();

		flow = await beginGoogle(client, "/library");
		flow.callback.searchParams.delete("code");
		flow.callback.searchParams.set("error", "access_denied");
		result = await completeGoogle(client, flow);
		assert.equal(result.response.status, 401);
		assert.match(result.text, /cancelled or could not be completed/);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM auth_identities WHERE provider = 'google'",
				)
			).rows[0].count,
			0,
		);
		await assertGoogleStateCleared();
	});

	test("generated guests are distinct, starter-ready, private, and expire in fifteen days", async () => {
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

		const starterWorkspaces = (
			await db.query(
				`SELECT program.user_id, program.name AS program_name,
				        program.start_date::text, goal.name AS goal_name,
				        cycle.id AS cycle_id, cycle.name AS cycle_name,
				        cycle.cycle_size, day.id AS training_day_id,
				        day.scheduled_date::text, day.label AS day_label,
				        workout.id AS workout_session_id, workout.status,
				        session.id AS session_id, session.name AS session_name,
				        session.owner_user_id AS session_owner_user_id
				 FROM programs AS program
				 JOIN goals AS goal ON goal.id = program.goal_id
				 JOIN cycles AS cycle ON cycle.program_id = program.id
				 JOIN training_days AS day ON day.cycle_id = cycle.id
				 JOIN workout_sessions AS workout ON workout.training_day_id = day.id
				 JOIN sessions AS session ON session.id = workout.session_id
				 WHERE program.user_id = ANY($1::int[])
				 ORDER BY program.user_id`,
				[rows.map((guest) => guest.id)],
			)
		).rows;
		assert.equal(starterWorkspaces.length, 2);
		assert.equal(
			new Set(starterWorkspaces.map((workspace) => workspace.user_id)).size,
			2,
		);
		assert.equal(
			new Set(starterWorkspaces.map((workspace) => workspace.session_id)).size,
			1,
		);
		for (const workspace of starterWorkspaces) {
			assert.equal(workspace.program_name, "Guest Starter Program");
			assert.equal(workspace.goal_name, "general_fitness");
			assert.equal(workspace.cycle_name, "Getting Started");
			assert.equal(workspace.cycle_size, 1);
			assert.equal(workspace.start_date, workspace.scheduled_date);
			assert.equal(workspace.day_label, "Full Body");
			assert.equal(workspace.status, "planned");
			assert.equal(workspace.session_name, "Sample Full Body Session");
			assert.equal(workspace.session_owner_user_id, null);
		}

		const dashboard = await first.request("/");
		assert.equal(dashboard.response.status, 200);
		assert.match(dashboard.text, /Sample Full Body Session/);
		assert.match(dashboard.text, /Start session/);
		assert.doesNotMatch(dashboard.text, /NO ACTIVE PROGRAM/);
		const profile = await first.request("/profile");
		assert.match(profile.text, /temporary/i);
		assert.match(profile.text, /data-profile-role="guest"/);
		assert.doesNotMatch(profile.text, /Manage exercise catalog/);
		const library = await first.request("/library");
		assert.match(library.text, /data-library-mode="personal"/);
		assert.match(library.text, /removed when the workspace expires/);
		assert.match(library.text, /Sample Full Body Session/);
		assert.match(library.text, /4 exercises/);
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

	test("a guest can complete the starter workout through existing lifecycle and reporting boundaries", async () => {
		const client = agent();
		await enterGuest(client);

		const starter = (
			await db.query(
				`SELECT guest.id AS user_id, program.id AS program_id,
				        workout.id AS workout_session_id
				 FROM users AS guest
				 JOIN programs AS program ON program.user_id = guest.id
				 JOIN cycles AS cycle ON cycle.program_id = program.id
				 JOIN training_days AS day ON day.cycle_id = cycle.id
				 JOIN workout_sessions AS workout ON workout.training_day_id = day.id
				 WHERE guest.role = 'guest'
				 ORDER BY guest.id DESC LIMIT 1`,
			)
		).rows[0];
		const dashboard = await client.request("/");
		const csrf = csrfFrom(dashboard.text);

		const started = await client.request(
			`/workout_sessions/${starter.workout_session_id}/start`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(started.response.status, 302);

		const stepLogs = (
			await db.query(
				`SELECT log.id, log.step_order, log.name, log.exercise_variant_name,
				        log.planned_sets, log.planned_reps, log.status
				 FROM workout_step_logs AS log
				 WHERE log.workout_session_id = $1
				 ORDER BY log.step_order`,
				[starter.workout_session_id],
			)
		).rows;
		assert.deepEqual(
			stepLogs.map((log) => ({
				order: log.step_order,
				name: log.name,
				variant: log.exercise_variant_name,
				sets: log.planned_sets,
				reps: log.planned_reps,
				status: log.status,
			})),
			[
				{
					order: 1,
					name: "Box squats",
					variant: "Bodyweight Box Squat",
					sets: 3,
					reps: 10,
					status: "planned",
				},
				{
					order: 2,
					name: "Push ups",
					variant: "Bodyweight Push Up",
					sets: 3,
					reps: 10,
					status: "planned",
				},
				{
					order: 3,
					name: "One-arm rows",
					variant: "One-Arm Dumbbell Row",
					sets: 3,
					reps: 10,
					status: "planned",
				},
				{
					order: 4,
					name: "Glute bridges",
					variant: "Bodyweight Glute Bridge",
					sets: 3,
					reps: 12,
					status: "planned",
				},
			],
		);

		const performed = await client.request(
			`/workout_step_logs/${stepLogs[0].id}/perform`,
			{
				method: "POST",
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: starter.workout_session_id,
					"logFormRows[0][performedReps]": "10",
					"logFormRows[0][performedLoadValue]": "0",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
					"logFormRows[1][performedReps]": "10",
					"logFormRows[1][performedLoadValue]": "0",
					"logFormRows[1][performedLoadUnit]": "Kilograms",
					"logFormRows[2][performedReps]": "10",
					"logFormRows[2][performedLoadValue]": "0",
					"logFormRows[2][performedLoadUnit]": "Kilograms",
				},
			},
		);
		assert.equal(performed.response.status, 302);

		for (const step of stepLogs.slice(1)) {
			const skipped = await client.request(`/workout_step_logs/${step.id}/skip`, {
				method: "POST",
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: starter.workout_session_id,
				},
			});
			assert.equal(skipped.response.status, 302);
		}

		const finished = await client.request(
			`/workout_sessions/${starter.workout_session_id}/finish`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(finished.response.status, 302);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					starter.workout_session_id,
				])
			).rows[0].status,
			"finished",
		);

		const completedDashboard = await client.request(
			`/?workoutSessionId=${starter.workout_session_id}`,
		);
		assert.match(completedDashboard.text, /Workout complete/);
		assert.match(completedDashboard.text, /1 completed · 3 skipped · 0 remaining/);

		const history = await client.request(`/history?programId=${starter.program_id}`);
		assert.equal(history.response.status, 200);
		assert.match(history.text, /Sample Full Body Session/);
		assert.match(history.text, /Finished/);

		const progress = await client.request(`/progress?programId=${starter.program_id}`);
		assert.equal(progress.response.status, 200);
		assert.match(progress.text, /Bodyweight Box Squat/);
	});

	test("guest starter provisioning rolls back when its canonical session is unavailable", async () => {
		await db.query(
			"UPDATE sessions SET is_archived = TRUE WHERE name = 'Sample Full Body Session'",
		);
		const client = agent();
		const page = await client.request("/auth/login");
		const result = await client.request("/auth/guest", {
			method: "POST",
			form: { _csrf: csrfFrom(page.text) },
		});

		assert.equal(result.response.status, 500);
		assert.equal(
			(await db.query("SELECT count(*)::int AS count FROM users WHERE role = 'guest'"))
				.rows[0].count,
			0,
		);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM programs WHERE name = 'Guest Starter Program'",
				)
			).rows[0].count,
			0,
		);
	});

	test("guest starter provisioning leaves no partial principal after a hierarchy write failure", async () => {
		await db.query(`
			CREATE OR REPLACE FUNCTION fail_guest_starter_program_insert() RETURNS trigger AS $$
			BEGIN
				IF NEW.name = 'Guest Starter Program' THEN
					RAISE EXCEPTION 'simulated guest starter program failure';
				END IF;
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql;
			CREATE TRIGGER fail_guest_starter_program_insert
			BEFORE INSERT ON programs
			FOR EACH ROW EXECUTE FUNCTION fail_guest_starter_program_insert();
		`);

		try {
			const client = agent();
			const page = await client.request("/auth/login");
			const result = await client.request("/auth/guest", {
				method: "POST",
				form: { _csrf: csrfFrom(page.text) },
			});

			assert.equal(result.response.status, 500);
			assert.equal(
				(
					await db.query(
						"SELECT count(*)::int AS count FROM users WHERE role = 'guest'",
					)
				).rows[0].count,
				0,
			);
			assert.equal(
				(
					await db.query(
						"SELECT count(*)::int AS count FROM programs WHERE name = 'Guest Starter Program'",
					)
				).rows[0].count,
				0,
			);
		} finally {
			await db.query(
				"DROP TRIGGER IF EXISTS fail_guest_starter_program_insert ON programs",
			);
			await db.query("DROP FUNCTION IF EXISTS fail_guest_starter_program_insert()");
		}
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
		assert.equal(unchanged.program_count, 2);
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
		await assert.rejects(
			db.query(
				"INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, 'google', 'different-google-sub')",
				[passwordless.id],
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
		assert.doesNotMatch(page.text, /aria-label="Library content"/);
		assert.match(page.text, /id="exercise-discovery-query"/);
		assert.match(page.text, /data-library-filter="equipment"/);
		assert.match(page.text, /No exercises match these filters/);
		assert.match(page.text, /18 exercises · 36 variants/);
		assert.equal((page.text.match(/data-search-exercise-item/g) ?? []).length, 18);
		assert.equal((page.text.match(/data-exercise-variant-id=/g) ?? []).length, 36);
		const adminProfile = await admin.request("/profile");
		assert.match(adminProfile.text, /Manage exercise catalog/);
		const created = await admin.request("/admin/library/exercises", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				name: "Admin Bodyweight Hinge",
				movementPatternId: "4",
				equipmentId: "",
				"muscleGroup[0][muscleId]": "20",
				"muscleGroup[0][muscleRoleId]": "1",
			},
		});
		assert.equal(created.response.status, 302);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM exercises WHERE name = 'Admin Bodyweight Hinge'",
				)
			).rows[0].count,
			1,
		);
		const exerciseVariant = (
			await db.query(`
				SELECT exercise.id, variant.id AS variant_id, variant.equipment_id
				FROM exercises exercise
				JOIN exercise_variants variant ON variant.exercise_id = exercise.id
				WHERE exercise.name = 'Admin Bodyweight Hinge'
			`)
		).rows[0];
		assert.equal(exerciseVariant.equipment_id, null);
		const updated = await admin.request(
			`/admin/library/exercises/${exerciseVariant.id}/variants/${exerciseVariant.variant_id}?_method=PATCH`,
			{
				method: "POST",
				form: {
					_csrf: csrfFrom(page.text),
					name: "Admin Bodyweight Hinge Updated",
					movementPatternId: "4",
					equipmentId: "",
					"muscleGroup[0][muscleId]": "20",
					"muscleGroup[0][muscleRoleId]": "1",
				},
			},
		);
		assert.equal(updated.response.status, 302);
		assert.deepEqual(
			(
				await db.query(
					"SELECT name, equipment_id FROM exercise_variants WHERE id = $1",
					[exerciseVariant.variant_id],
				)
			).rows[0],
			{ name: "Admin Bodyweight Hinge Updated", equipment_id: null },
		);
		const exercise = { id: exerciseVariant.id };
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

	test("regular users can browse and select expanded global catalog variants", async () => {
		const client = agent();
		await login(client, "user-one@example.com");
		const library = await client.request("/library");

		assert.equal(library.response.status, 200);
		assert.match(library.text, /role="tablist" aria-label="Library content"/);
		assert.match(library.text, /id="library-sessions-tab"[\s\S]*aria-selected="true"/);
		assert.match(library.text, /id="session-discovery-query"/);
		assert.match(library.text, /id="exercise-discovery-query"/);
		assert.equal((library.text.match(/data-library-query/g) ?? []).length, 2);
		assert.match(library.text, /18 exercises · 36 variants/);
		assert.equal((library.text.match(/data-search-exercise-item/g) ?? []).length, 18);
		assert.equal((library.text.match(/data-exercise-variant-id=/g) ?? []).length, 36);
		assert.match(library.text, /Cable Wood Chop/);
		assert.match(library.text, /Bodyweight Glute Bridge/);
		assert.match(library.text, /Single-Leg Press/);

		const references = (
			await db.query(`
				SELECT
					(SELECT id FROM step_types WHERE name = 'exercise') AS step_type_id,
					(SELECT id FROM exercise_variants
					 WHERE name = 'Cable Wood Chop' AND owner_user_id IS NULL) AS variant_id
			`)
		).rows[0];
		const created = await client.request("/sessions", {
			method: "POST",
			form: {
				_csrf: csrfFrom(library.text),
				name: "Expanded catalog session",
				notes: "Catalog selection coverage",
				"stepRow[0][stepTypeId]": String(references.step_type_id),
				"stepRow[0][exerciseVariantId]": String(references.variant_id),
				"stepRow[0][sets]": "3",
				"stepRow[0][reps]": "8",
				"stepRow[0][loadValue]": "20",
				"stepRow[0][loadUnit]": "Kilograms",
			},
		});

		assert.equal(created.response.status, 302);
		assert.deepEqual(
			(
				await db.query(`
					SELECT session.owner_user_id, variant.name AS variant_name
					FROM sessions session
					JOIN session_steps step ON step.session_id = session.id
					JOIN exercise_variants variant ON variant.id = step.exercise_variant_id
					WHERE session.name = 'Expanded catalog session'
				`)
			).rows[0],
			{
				owner_user_id: (
					await db.query("SELECT id FROM users WHERE email = 'user-one@example.com'")
				).rows[0].id,
				variant_name: "Cable Wood Chop",
			},
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
		assert.match(library.text, /18 exercises · 37 variants/);
		assert.match(library.text, /Tempo Squat[\s\S]*Private/);
		assert.equal(
			(
				library.text.match(
					new RegExp(`id="exercise-template-${exercise.id}-trigger"`, "g"),
				) ?? []
			).length,
			1,
		);
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

	test("program goal labels are readable while creation persists the existing goal ID", async () => {
		const client = agent();
		await login(client, "user-one@example.com");
		const goals = (await db.query("SELECT id, name FROM goals ORDER BY id")).rows;
		const weightLoss = goals.find((goal) => goal.name === "weight_loss");
		assert.ok(weightLoss);

		const page = await client.request("/programs");
		assert.equal(page.response.status, 200);
		assert.match(page.text, />\s*Hypertrophy\s*<\/option>/);
		assert.match(page.text, />\s*Weight Loss\s*<\/option>/);
		assert.match(page.text, />\s*General Fitness\s*<\/option>/);
		assert.doesNotMatch(page.text, /weight_loss|general_fitness/);

		const invalid = await client.request("/programs", {
			method: "POST",
			form: {
				_csrf: csrfFrom(page.text),
				name: " ",
				goalId: String(weightLoss.id),
				startDate: "",
			},
		});
		assert.equal(invalid.response.status, 422);
		assert.match(
			invalid.text,
			new RegExp(
				`<option\\s+value="${weightLoss.id}"[\\s\\S]{0,120}?selected[\\s\\S]{0,120}?>\\s*Weight Loss\\s*</option>`,
			),
		);

		const created = await client.request("/programs", {
			method: "POST",
			form: {
				_csrf: csrfFrom(invalid.text),
				name: "Readable goal plan",
				goalId: String(weightLoss.id),
				startDate: "",
			},
		});
		assert.equal(created.response.status, 302);
		assert.equal(created.response.headers.get("location"), "/programs");

		const stored = (
			await db.query(
				`SELECT program.goal_id, goal.name AS goal_name
				 FROM programs AS program
				 JOIN users AS owner ON owner.id = program.user_id
				 JOIN goals AS goal ON goal.id = program.goal_id
				 WHERE owner.email = 'user-one@example.com'
				   AND program.name = 'Readable goal plan'`,
			)
		).rows[0];
		assert.deepEqual(stored, {
			goal_id: weightLoss.id,
			goal_name: "weight_loss",
		});

		const refreshed = await client.request("/programs");
		assert.equal(refreshed.response.status, 200);
		assert.match(refreshed.text, /Readable goal plan/);
		assert.match(refreshed.text, /Weight Loss/);
		assert.doesNotMatch(refreshed.text, /weight_loss/);
	});

	test("an owned day resolves its hierarchy directly while foreign and missing days expose none", async () => {
		const context = await createPlanningFixture();
		const client = agent();
		await login(client, "user-one@example.com");

		const direct = await client.request(`/programs/day?dayId=${context.day_id}`);
		assert.equal(direct.response.status, 200);
		assert.match(direct.text, /Direct access plan/);
		assert.match(direct.text, /Foundation block/);
		assert.match(direct.text, /Lower body day/);
		assert.match(
			direct.text,
			new RegExp(
				`href="/programs\\?programId=${context.program_id}&amp;cycleId=${context.cycle_id}"`,
			),
		);
		assert.match(direct.text, /Assign to this day/);
		assert.match(
			direct.text,
			new RegExp(`href="/library\\?createSessionForDay=${context.day_id}"`),
		);

		const synchronized = await client.request("/programs");
		assert.match(synchronized.text, /Direct access plan, selected program/);
		assert.match(synchronized.text, /Foundation block, selected cycle/);

		for (const inaccessibleDayId of [context.foreign_day_id, 999999]) {
			const inaccessible = await client.request(
				`/programs/day?dayId=${inaccessibleDayId}`,
			);
			assert.equal(inaccessible.response.status, 200);
			assert.match(inaccessible.text, /Training day unavailable/);
			assert.doesNotMatch(inaccessible.text, /Private foreign/);
			assert.doesNotMatch(inaccessible.text, /aria-label="Program hierarchy"/);
		}
	});

	test("contextual Library creation returns the selected template for explicit assignment", async () => {
		const context = await createPlanningFixture();
		const client = agent();
		await login(client, "user-one@example.com");

		const library = await client.request(
			`/library?createSessionForDay=${context.day_id}`,
		);
		assert.equal(library.response.status, 200);
		assert.match(library.text, /Training day context/);
		assert.match(
			library.text,
			/Direct access plan · Foundation block · Lower body day/,
		);
		assert.match(library.text, /name="contextDayId" value="\d+"/);
		assert.match(library.text, /data-modal-open-on-load/);

		const invalid = await client.request("/sessions", {
			method: "POST",
			form: {
				_csrf: csrfFrom(library.text),
				name: " ",
				notes: "Keep this context",
				contextDayId: String(context.day_id),
			},
		});
		assert.equal(invalid.response.status, 422);
		assert.match(invalid.text, /Enter a session name/);
		assert.match(invalid.text, /Training day context/);
		assert.match(
			invalid.text,
			new RegExp(`name="contextDayId" value="${context.day_id}"`),
		);
		assert.match(invalid.text, /Keep this context/);

		const created = await client.request("/sessions", {
			method: "POST",
			form: {
				_csrf: csrfFrom(invalid.text),
				name: "Contextual strength",
				notes: "Return before assigning",
				contextDayId: String(context.day_id),
				returnTo: "https://evil.example/steal",
			},
		});
		assert.equal(created.response.status, 302);
		const session = (
			await db.query(
				"SELECT id, owner_user_id FROM sessions WHERE name = 'Contextual strength'",
			)
		).rows[0];
		assert.equal(
			created.response.headers.get("location"),
			`/programs/day?dayId=${context.day_id}&sessionId=${session.id}`,
		);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM workout_sessions WHERE training_day_id = $1",
					[context.day_id],
				)
			).rows[0].count,
			0,
		);

		const returned = await client.request(created.response.headers.get("location"));
		assert.match(returned.text, /Session template created/);
		assert.match(
			returned.text,
			new RegExp(`<option[^>]*value="${session.id}"[^>]*selected`),
		);

		const assigned = await client.request("/workout_sessions", {
			method: "POST",
			form: {
				_csrf: csrfFrom(returned.text),
				sessionId: String(session.id),
				trainingDayId: String(context.day_id),
			},
		});
		assert.equal(assigned.response.status, 302);
		assert.equal(
			assigned.response.headers.get("location"),
			`/programs/day?dayId=${context.day_id}`,
		);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM workout_sessions WHERE training_day_id = $1 AND session_id = $2",
					[context.day_id, session.id],
				)
			).rows[0].count,
			1,
		);
		const assignedPage = await client.request(`/programs/day?dayId=${context.day_id}`);
		assert.match(assignedPage.text, /1 session is assigned to this training day/);
		assert.match(assignedPage.text, /Contextual strength/);
	});

	test("a day without active templates makes contextual creation the primary next action", async () => {
		const context = await createPlanningFixture();
		await db.query("UPDATE sessions SET is_archived = TRUE");
		const client = agent();
		await login(client, "user-one@example.com");

		const day = await client.request(`/programs/day?dayId=${context.day_id}`);
		assert.equal(day.response.status, 200);
		assert.match(day.text, /No active templates are available/);
		assert.match(day.text, /<select[\s\S]*?disabled/);
		assert.match(
			day.text,
			new RegExp(
				`day-panel__create-link--primary[^>]*href="/library\\?createSessionForDay=${context.day_id}"`,
			),
		);
	});

	test("foreign day context cannot control Library state or create a template", async () => {
		const context = await createPlanningFixture();
		const client = agent();
		await login(client, "user-one@example.com");

		const library = await client.request(
			`/library?createSessionForDay=${context.foreign_day_id}`,
		);
		assert.equal(library.response.status, 404);
		assert.doesNotMatch(library.text, /Private foreign/);

		const ordinaryLibrary = await client.request("/library");

		const created = await client.request("/sessions", {
			method: "POST",
			form: {
				_csrf: csrfFrom(ordinaryLibrary.text),
				name: "Safe fallback template",
				notes: "",
				contextDayId: String(context.foreign_day_id),
			},
		});
		assert.equal(created.response.status, 404);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM sessions WHERE name = 'Safe fallback template'",
				)
			).rows[0].count,
			0,
		);

		const globalSession = (
			await db.query(
				"SELECT id FROM sessions WHERE owner_user_id IS NULL AND is_archived = FALSE ORDER BY id LIMIT 1",
			)
		).rows[0];
		const crossAccountAssignment = await client.request("/workout_sessions", {
			method: "POST",
			form: {
				_csrf: csrfFrom(ordinaryLibrary.text),
				sessionId: String(globalSession.id),
				trainingDayId: String(context.foreign_day_id),
			},
		});
		assert.equal(crossAccountAssignment.response.status, 404);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM workout_sessions WHERE training_day_id = $1",
					[context.foreign_day_id],
				)
			).rows[0].count,
			0,
		);
	});

	test("program analytics aggregate owned history with stable boundaries, null handling, and separate units", async () => {
		const context = (
			await db.query(`
				WITH owner AS (
					SELECT id AS user_id FROM users WHERE email = 'user-one@example.com'
				), selected_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT user_id, 'Analytics program', DATE '2026-08-03' FROM owner
					RETURNING id
				), empty_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT user_id, 'Empty analytics program', DATE '2026-08-03' FROM owner
					RETURNING id
				), cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Boundary cycle', 15, 1 FROM selected_program
					RETURNING id
				), template AS (
					SELECT id FROM sessions WHERE owner_user_id IS NULL ORDER BY id LIMIT 1
				)
				SELECT owner.user_id, selected_program.id AS program_id,
				       empty_program.id AS empty_program_id, cycle.id AS cycle_id,
				       template.id AS session_id
				FROM owner, selected_program, empty_program, cycle, template
			`)
		).rows[0];

		await db.query(
			`INSERT INTO training_days (cycle_id, day_order, scheduled_date)
			 SELECT $1, boundary.day_order, DATE '2026-08-03' + boundary.day_offset
			 FROM (VALUES (1, 0), (7, 6), (8, 7), (15, 14))
			      AS boundary(day_order, day_offset)`,
			[context.cycle_id],
		);
		await db.query(
			`INSERT INTO workout_sessions
			 (training_day_id, session_id, workout_session_order, status, started_at, finished_at)
			 SELECT td.id, $2, 1,
			        (CASE
			           WHEN td.day_order IN (1, 8) THEN 'finished'
			           WHEN td.day_order = 7 THEN 'cancelled'
			           ELSE 'planned'
			         END)::workout_session_status,
			        CASE WHEN td.day_order IN (1, 8)
			             THEN TIMESTAMPTZ '2026-08-03 12:00:00+00' END,
			        CASE
			          WHEN td.day_order = 1 THEN TIMESTAMPTZ '2026-08-12 10:00:00+00'
			          WHEN td.day_order = 8 THEN TIMESTAMPTZ '2026-08-12 10:30:00+00'
			        END
			 FROM training_days td
			 WHERE td.cycle_id = $1`,
			[context.cycle_id, context.session_id],
		);
		const ownedSessions = (
			await db.query(
				`SELECT ws.id, td.day_order
				 FROM workout_sessions ws
				 JOIN training_days td ON td.id = ws.training_day_id
				 WHERE td.cycle_id = $1 ORDER BY td.day_order`,
				[context.cycle_id],
			)
		).rows;
		const sessionByDay = new Map(ownedSessions.map((row) => [row.day_order, row.id]));
		const performedLogs = (
			await db.query(
				`INSERT INTO workout_step_logs
				 (workout_session_id, status, step_order, completed_at)
				 VALUES
				 ($1, 'performed', 1, TIMESTAMPTZ '2026-08-12 09:00:00+00'),
				 ($1, 'skipped', 2, TIMESTAMPTZ '2026-08-12 09:05:00+00'),
				 ($2, 'performed', 1, TIMESTAMPTZ '2026-08-12 09:30:00+00')
				 RETURNING id, workout_session_id, status`,
				[sessionByDay.get(1), sessionByDay.get(8)],
			)
		).rows.filter((row) => row.status === "performed");
		await db.query(
			`INSERT INTO workout_set_logs
			 (workout_step_log_id, set_order, reps, load_value, load_unit)
			 VALUES
			 ($1, 1, 8, 10, 'Kilograms'),
			 ($1, 2, NULL, 20, 'Kilograms'),
			 ($1, 3, 5, NULL, 'Kilograms'),
			 ($1, 4, 6, 30, 'Libra'),
			 ($2, 1, 4, 5, 'Kilograms')`,
			[performedLogs[0].id, performedLogs[1].id],
		);

		const foreign = (
			await db.query(`
				WITH foreign_owner AS (
					SELECT id AS user_id FROM users WHERE email = 'user-two@example.com'
				), foreign_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT user_id, 'Foreign analytics', DATE '2026-08-03' FROM foreign_owner
					RETURNING id
				), foreign_cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Foreign cycle', 15, 1 FROM foreign_program RETURNING id
				), foreign_day AS (
					INSERT INTO training_days (cycle_id, day_order, scheduled_date)
					SELECT id, 1, DATE '2026-08-03' FROM foreign_cycle RETURNING id
				), foreign_session AS (
					INSERT INTO workout_sessions
					 (training_day_id, session_id, workout_session_order, status, started_at, finished_at)
					SELECT foreign_day.id, sessions.id, 1, 'finished',
					       TIMESTAMPTZ '2026-08-03 10:00:00+00',
					       TIMESTAMPTZ '2026-08-12 11:00:00+00'
					FROM foreign_day
					CROSS JOIN LATERAL (
						SELECT id FROM sessions WHERE owner_user_id IS NULL ORDER BY id LIMIT 1
					) sessions
					RETURNING id
				), foreign_log AS (
					INSERT INTO workout_step_logs
					 (workout_session_id, status, step_order, completed_at)
					SELECT id, 'performed', 1, TIMESTAMPTZ '2026-08-12 11:00:00+00'
					FROM foreign_session RETURNING id
				)
				SELECT foreign_program.id AS program_id,
				       foreign_owner.user_id, foreign_log.id AS workout_step_log_id
				FROM foreign_program, foreign_owner, foreign_log
			`)
		).rows[0];
		await db.query(
			`INSERT INTO workout_set_logs
			 (workout_step_log_id, set_order, reps, load_value, load_unit)
			 VALUES ($1, 1, 1000, 1000, 'Kilograms')`,
			[foreign.workout_step_log_id],
		);

		const { default: getProgramAnalytics } =
			await import("../../src/features/programAnalytics/getProgramAnalytics.js");
		const analytics = await getProgramAnalytics(
			{ programId: context.program_id, userId: context.user_id },
			db,
		);
		assert.deepEqual(analytics?.activity, [
			{ dateKey: "2026-08-12", finishedCount: 2 },
		]);
		assert.deepEqual(
			analytics?.adherence.map((week) => ({
				weekIndex: week.weekIndex,
				weekStartDate: week.weekStartDate,
				weekEndDate: week.weekEndDate,
				scheduledCount: week.scheduledCount,
				finishedCount: week.finishedCount,
				cancelledCount: week.cancelledCount,
				plannedCount: week.plannedCount,
				completionRate: week.completionRate,
			})),
			[
				{
					weekIndex: 0,
					weekStartDate: "2026-08-03",
					weekEndDate: "2026-08-09",
					scheduledCount: 2,
					finishedCount: 1,
					cancelledCount: 1,
					plannedCount: 0,
					completionRate: 0.5,
				},
				{
					weekIndex: 1,
					weekStartDate: "2026-08-10",
					weekEndDate: "2026-08-16",
					scheduledCount: 1,
					finishedCount: 1,
					cancelledCount: 0,
					plannedCount: 0,
					completionRate: 1,
				},
				{
					weekIndex: 2,
					weekStartDate: "2026-08-17",
					weekEndDate: "2026-08-17",
					scheduledCount: 1,
					finishedCount: 0,
					cancelledCount: 0,
					plannedCount: 1,
					completionRate: 0,
				},
			],
		);
		assert.deepEqual(analytics?.performedWork, {
			performedStepCount: 2,
			recordedSetCount: 5,
			completedRepetitionCount: 23,
			setsWithRepetitionsCount: 4,
		});
		assert.deepEqual(analytics?.loadVolume, [
			{ unit: "Kilograms", volume: 100, setCount: 2 },
			{ unit: "Libra", volume: 180, setCount: 1 },
		]);

		assert.equal(
			await getProgramAnalytics(
				{ programId: context.program_id, userId: foreign.user_id },
				db,
			),
			null,
		);
		assert.deepEqual(
			await getProgramAnalytics(
				{ programId: context.empty_program_id, userId: context.user_id },
				db,
			),
			{
				activity: [],
				adherence: [],
				performedWork: {
					performedStepCount: 0,
					recordedSetCount: 0,
					completedRepetitionCount: 0,
					setsWithRepetitionsCount: 0,
				},
				loadVolume: [],
			},
		);

		const workoutSessionsRepository =
			await import("../../src/features/workoutSessions/repository.js");
		const markers =
			await workoutSessionsRepository.findMarkersByProgramIdAndDateRangeForUser(
				{
					programId: context.program_id,
					userId: context.user_id,
					startDate: "2026-08-03",
					endDate: "2026-08-09",
				},
				db,
			);
		assert.deepEqual(
			markers.map((row) => row.status),
			["finished", "cancelled"],
		);
		assert.deepEqual(
			await workoutSessionsRepository.findMarkersByProgramIdAndDateRangeForUser(
				{
					programId: context.program_id,
					userId: foreign.user_id,
					startDate: "2026-08-03",
					endDate: "2026-08-09",
				},
				db,
			),
			[],
		);

		const client = agent();
		await login(client);
		assert.equal(
			(await client.request(`/programs?programId=${context.program_id}`)).response
				.status,
			200,
		);
		const dashboard = await client.request("/");
		assert.equal(dashboard.response.status, 200);
		assert.match(dashboard.text, /Training at a glance/);
		assert.match(dashboard.text, /data-chart-scheduled="\[2,1,1\]"/);
		assert.match(dashboard.text, /data-chart-finished="\[1,1,0\]"/);
		assert.match(dashboard.text, /data-chart-cancelled="\[1,0,0\]"/);
		assert.match(dashboard.text, /dashboard-heatmap__cell--many/);
		assert.match(dashboard.text, /View weekly adherence data/);
		assert.match(dashboard.text, /Recorded workload/);
		assert.match(dashboard.text, /100<\/span> kg/);
		assert.match(dashboard.text, /180<\/span> lb/);

		assert.equal(
			(await client.request(`/programs?programId=${context.empty_program_id}`)).response
				.status,
			200,
		);
		const emptyDashboard = await client.request("/");
		assert.equal(emptyDashboard.response.status, 200);
		assert.match(emptyDashboard.text, /Your progress story starts here/);
		assert.match(emptyDashboard.text, /No activity in this calendar yet/);
		assert.match(emptyDashboard.text, /No adherence data yet/);
		assert.match(emptyDashboard.text, /No workload recorded yet/);
		assert.doesNotMatch(emptyDashboard.text, /data-adherence-chart/);
	});

	test("exercise progress aggregates immutable owned snapshots with stable dates and separate units", async () => {
		const context = (
			await db.query(`
				WITH owners AS (
					SELECT id, email FROM users
					WHERE email IN ('user-one@example.com', 'user-two@example.com')
				), owner_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'Exercise progress', DATE '2026-08-01' FROM owners
					WHERE email = 'user-one@example.com'
					RETURNING id, user_id
				), foreign_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'Foreign progress', DATE '2026-08-01' FROM owners
					WHERE email = 'user-two@example.com'
					RETURNING id, user_id
				), owner_cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Progress cycle', 7, 1 FROM owner_program
					RETURNING id
				), foreign_cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Foreign cycle', 1, 1 FROM foreign_program
					RETURNING id
				), owner_template AS (
					INSERT INTO sessions (owner_user_id, name)
					SELECT user_id, 'Mutable progress template' FROM owner_program
					RETURNING id
				), foreign_template AS (
					INSERT INTO sessions (owner_user_id, name)
					SELECT user_id, 'Foreign progress template' FROM foreign_program
					RETURNING id
				), exercise AS (
					INSERT INTO exercises (name, created_by_user_id)
					SELECT 'Mutable squat', user_id FROM owner_program
					RETURNING id
				), variant AS (
					INSERT INTO exercise_variants (exercise_id, owner_user_id, name)
					SELECT exercise.id, owner_program.user_id, 'Mutable back squat'
					FROM exercise, owner_program
					RETURNING id
				)
				SELECT
					owner_program.user_id,
					owner_program.id AS program_id,
					foreign_program.user_id AS foreign_user_id,
					foreign_program.id AS foreign_program_id,
					owner_cycle.id AS cycle_id,
					foreign_cycle.id AS foreign_cycle_id,
					owner_template.id AS template_id,
					foreign_template.id AS foreign_template_id,
					exercise.id AS exercise_id,
					variant.id AS variant_id
				FROM owner_program, foreign_program, owner_cycle, foreign_cycle,
					owner_template, foreign_template, exercise, variant
			`)
		).rows[0];

		await db.query(
			`INSERT INTO training_days (cycle_id, day_order, scheduled_date)
			 SELECT $1, values.day_order, values.scheduled_date
			 FROM (VALUES
				(1, DATE '2026-08-15'),
				(2, DATE '2026-09-01'),
				(3, DATE '2026-09-01'),
				(4, DATE '2026-09-02'),
				(5, DATE '2026-09-03'),
				(6, DATE '2026-09-04')
			 ) AS values(day_order, scheduled_date)`,
			[context.cycle_id],
		);
		await db.query(
			`INSERT INTO workout_sessions
			 (training_day_id, session_id, workout_session_order, status,
			  started_at, finished_at, session_name)
			 SELECT
				td.id,
				$2,
				1,
				(CASE WHEN td.day_order = 6 THEN 'cancelled' ELSE 'finished' END)::workout_session_status,
				CASE WHEN td.day_order = 6 THEN NULL
					ELSE TIMESTAMPTZ '2026-08-15 08:00:00+00' END,
				CASE td.day_order
					WHEN 1 THEN TIMESTAMPTZ '2026-08-15 09:00:00+00'
					WHEN 2 THEN TIMESTAMPTZ '2026-09-01 10:00:00+00'
					WHEN 3 THEN TIMESTAMPTZ '2026-09-01 12:00:00+00'
					WHEN 4 THEN TIMESTAMPTZ '2026-09-02 10:00:00+00'
					WHEN 5 THEN TIMESTAMPTZ '2026-09-03 10:00:00+00'
				END,
				CASE td.day_order
					WHEN 2 THEN 'Morning strength'
					WHEN 3 THEN 'No-set strength'
					ELSE 'Progress workout'
				END
			 FROM training_days td
			 WHERE td.cycle_id = $1`,
			[context.cycle_id, context.template_id],
		);

		const progressLogs = (
			await db.query(
				`INSERT INTO workout_step_logs
				 (workout_session_id, status, step_order, exercise_variant_id,
				  exercise_name, exercise_variant_name, completed_at)
				 SELECT
					ws.id,
					'performed',
					values.step_order,
					$2,
					values.exercise_name,
					values.variant_name,
					ws.finished_at
				 FROM workout_sessions ws
				 JOIN training_days td ON td.id = ws.training_day_id
				 JOIN (VALUES
					(1, 1, 'Snapshot squat', 'Snapshot back squat'),
					(2, 1, 'Snapshot squat', 'Snapshot back squat'),
					(2, 2, 'Snapshot squat', 'Snapshot back squat'),
					(3, 1, 'Snapshot squat', 'Snapshot back squat'),
					(4, 1, 'Snapshot squat', 'Renamed back squat'),
					(5, 1, NULL, NULL),
					(6, 1, 'Snapshot squat', 'Snapshot back squat')
				 ) AS values(day_order, step_order, exercise_name, variant_name)
					ON values.day_order = td.day_order
				 WHERE td.cycle_id = $1
				 RETURNING id, workout_session_id, step_order`,
				[context.cycle_id, context.variant_id],
			)
		).rows;
		const ownedSessions = (
			await db.query(
				`SELECT ws.id, td.day_order
				 FROM workout_sessions ws
				 JOIN training_days td ON td.id = ws.training_day_id
				 WHERE td.cycle_id = $1`,
				[context.cycle_id],
			)
		).rows;
		const dayBySession = new Map(
			ownedSessions.map((row) => [Number(row.id), Number(row.day_order)]),
		);
		const logByDayAndOrder = new Map(
			progressLogs.map((row) => [
				`${dayBySession.get(Number(row.workout_session_id))}:${row.step_order}`,
				row.id,
			]),
		);
		await db.query(
			`INSERT INTO workout_set_logs
			 (workout_step_log_id, set_order, reps, load_value, load_unit)
			 VALUES
				($1, 1, 5, 100, 'Kilograms'),
				($2, 1, 8, 102.5, 'Kilograms'),
				($2, 2, NULL, 105, 'Kilograms'),
				($2, 3, 0, 200, 'Kilograms'),
				($3, 1, 10, NULL, 'Kilograms'),
				($3, 2, 6, 20, 'Libra'),
				($3, 3, 10001, 1000001, 'Kilograms'),
				($4, 1, 4, 500, 'Kilograms')`,
			[
				logByDayAndOrder.get("1:1"),
				logByDayAndOrder.get("2:1"),
				logByDayAndOrder.get("2:2"),
				logByDayAndOrder.get("4:1"),
			],
		);

		const foreign = (
			await db.query(
				`WITH day AS (
					INSERT INTO training_days (cycle_id, day_order, scheduled_date)
					VALUES ($1, 1, DATE '2026-09-01') RETURNING id
				), workout AS (
					INSERT INTO workout_sessions
					 (training_day_id, session_id, workout_session_order, status,
					  started_at, finished_at, session_name)
					SELECT day.id, $2, 1, 'finished',
						TIMESTAMPTZ '2026-09-01 08:00:00+00',
						TIMESTAMPTZ '2026-09-01 09:00:00+00',
						'Foreign workout'
					FROM day RETURNING id
				), step AS (
					INSERT INTO workout_step_logs
					 (workout_session_id, status, step_order, exercise_name,
					  exercise_variant_name, completed_at)
					SELECT id, 'performed', 1, 'Foreign squat',
						'Foreign stance', TIMESTAMPTZ '2026-09-01 09:00:00+00'
					FROM workout RETURNING id
				)
				SELECT id AS step_id FROM step`,
				[context.foreign_cycle_id, context.foreign_template_id],
			)
		).rows[0];
		await db.query(
			`INSERT INTO workout_set_logs
			 (workout_step_log_id, set_order, reps, load_value, load_unit)
			 VALUES ($1, 1, 1000, 1000, 'Kilograms')`,
			[foreign.step_id],
		);

		await db.query(
			`UPDATE exercises SET name = 'Renamed mutable squat', is_archived = TRUE
			 WHERE id = $1`,
			[context.exercise_id],
		);
		await db.query("DELETE FROM exercise_variants WHERE id = $1", [context.variant_id]);

		const { default: getExerciseProgressChoices } =
			await import("../../src/features/exerciseProgress/getExerciseProgressChoices.js");
		const { default: getExerciseProgress } =
			await import("../../src/features/exerciseProgress/getExerciseProgress.js");
		const { toExerciseProgressKey } =
			await import("../../src/features/exerciseProgress/mapper.js");

		const choices = await getExerciseProgressChoices(
			{ userId: context.user_id, programId: context.program_id },
			db,
		);
		assert.equal(choices.length, 2);
		const oldIdentity = choices.find(
			(choice) => choice.exerciseVariantName === "Snapshot back squat",
		);
		const renamedIdentity = choices.find(
			(choice) => choice.exerciseVariantName === "Renamed back squat",
		);
		assert.deepEqual(oldIdentity, {
			key: toExerciseProgressKey("Snapshot squat", "Snapshot back squat"),
			exerciseName: "Snapshot squat",
			exerciseVariantName: "Snapshot back squat",
			occurrenceCount: 3,
			firstDate: "2026-08-15",
			lastDate: "2026-09-01",
		});
		assert.equal(renamedIdentity?.occurrenceCount, 1);
		assert.equal(
			(
				await db.query(
					"SELECT COUNT(*)::integer AS count FROM workout_step_logs WHERE exercise_variant_id IS NOT NULL",
				)
			).rows[0].count,
			0,
		);

		const progress = await getExerciseProgress(
			{
				userId: context.user_id,
				programId: context.program_id,
				exerciseKey: oldIdentity.key,
				filters: { fromDate: "2026-09-01", toDate: "2026-09-01" },
				pointLimit: 10,
			},
			db,
		);
		assert.equal(progress?.selection.occurrenceCount, 3);
		assert.deepEqual(progress?.summary, {
			occurrenceCount: 2,
			performedStepCount: 3,
			recordedSetCount: 6,
			setsWithRepetitionsCount: 4,
			completedRepetitionCount: 24,
			setsWithLoadCount: 4,
			setsWithVolumeCount: 3,
			units: [
				{
					unit: "Kilograms",
					loadObservationCount: 3,
					maximumLoad: 200,
					volumeSetCount: 2,
					volume: 820,
				},
				{
					unit: "Libra",
					loadObservationCount: 1,
					maximumLoad: 20,
					volumeSetCount: 1,
					volume: 120,
				},
			],
		});
		assert.deepEqual(
			progress?.occurrences.map((occurrence) => [
				occurrence.workoutSessionId,
				occurrence.dateKey,
				occurrence.sessionName,
				occurrence.performedStepCount,
				occurrence.recordedSetCount,
			]),
			[
				[
					ownedSessions.find((row) => row.day_order === 2).id,
					"2026-09-01",
					"Morning strength",
					2,
					6,
				],
				[
					ownedSessions.find((row) => row.day_order === 3).id,
					"2026-09-01",
					"No-set strength",
					1,
					0,
				],
			],
		);
		assert.deepEqual(
			progress?.series.map((series) => [
				series.unit,
				series.points.map((point) => [
					point.workoutSessionId,
					point.maximumLoad,
					point.volume,
				]),
			]),
			[
				[
					"Kilograms",
					[[ownedSessions.find((row) => row.day_order === 2).id, 200, 820]],
				],
				["Libra", [[ownedSessions.find((row) => row.day_order === 2).id, 20, 120]]],
			],
		);
		assert.equal(progress?.isTruncated, false);

		const latestOnly = await getExerciseProgress(
			{
				userId: context.user_id,
				programId: context.program_id,
				exerciseKey: oldIdentity.key,
				filters: { fromDate: null, toDate: null },
				pointLimit: 1,
			},
			db,
		);
		assert.equal(latestOnly?.totalOccurrenceCount, 3);
		assert.equal(latestOnly?.returnedOccurrenceCount, 1);
		assert.equal(latestOnly?.isTruncated, true);
		assert.equal(
			latestOnly?.occurrences[0].workoutSessionId,
			ownedSessions.find((row) => row.day_order === 3).id,
		);

		assert.deepEqual(
			await getExerciseProgressChoices(
				{ userId: context.user_id, programId: context.foreign_program_id },
				db,
			),
			[],
		);
		assert.equal(
			await getExerciseProgress(
				{
					userId: context.user_id,
					programId: context.foreign_program_id,
					exerciseKey: oldIdentity.key,
					filters: { fromDate: null, toDate: null },
				},
				db,
			),
			null,
		);

		const anonymous = agent();
		const anonymousProgress = await anonymous.request(
			`/progress?programId=${context.program_id}`,
		);
		assert.equal(anonymousProgress.response.status, 302);
		assert.equal(
			anonymousProgress.response.headers.get("location"),
			`/auth/login?returnTo=${encodeURIComponent(
				`/progress?programId=${context.program_id}`,
			)}`,
		);

		const client = agent();
		await login(client);
		const firstUse = await client.request("/progress");
		assert.equal(firstUse.response.status, 200);
		assert.match(firstUse.text, /Exercise progress/);
		assert.match(firstUse.text, /data-progress-state="choose-program"/);
		assert.match(firstUse.text, /aria-current="page"[\s\S]*?<span>Progress<\/span>/);

		const programSelection = await client.request(
			`/progress?programId=${context.program_id}`,
		);
		assert.equal(programSelection.response.status, 200);
		assert.match(programSelection.text, /Snapshot back squat/);
		assert.match(programSelection.text, /Renamed back squat/);
		assert.match(programSelection.text, /data-progress-state="choose-exercise"/);
		assert.doesNotMatch(programSelection.text, /Foreign squat|Foreign stance/);

		const progressPage = await client.request(
			`/progress?programId=${context.program_id}&exerciseKey=${encodeURIComponent(
				oldIdentity.key,
			)}&fromDate=2026-09-01&toDate=2026-09-01&pointLimit=10`,
		);
		assert.equal(progressPage.response.status, 200);
		assert.match(progressPage.text, /Recorded exercise results by finished workout/);
		assert.match(progressPage.text, /Snapshot squat — Snapshot back squat/);
		assert.match(progressPage.text, /4 of 6 recorded sets have a valid load and unit/);
		assert.match(progressPage.text, /200 Kilograms/);
		assert.match(progressPage.text, /820 repetitions × Kilograms/);
		assert.match(progressPage.text, /20 Libra/);
		assert.match(progressPage.text, /120 repetitions × Libra/);
		assert.match(
			progressPage.text,
			new RegExp(
				`href="/history/${ownedSessions.find((row) => row.day_order === 2).id}"`,
			),
		);
		assert.match(
			progressPage.text,
			new RegExp(
				`href="/history/${ownedSessions.find((row) => row.day_order === 3).id}"`,
			),
		);
		assert.doesNotMatch(progressPage.text, /Foreign workout|Foreign squat|1000/);
		assert.doesNotMatch(
			progressPage.text,
			/method="POST"|method="PATCH"|method="DELETE"/,
		);

		const emptyRange = await client.request(
			`/progress?programId=${context.program_id}&exerciseKey=${encodeURIComponent(
				oldIdentity.key,
			)}&fromDate=2027-01-01&toDate=2027-01-31`,
		);
		assert.equal(emptyRange.response.status, 200);
		assert.match(emptyRange.text, /data-progress-state="no-results"/);
		assert.match(emptyRange.text, /No results in this date range/);
		assert.doesNotMatch(
			emptyRange.text,
			/Recorded exercise results by finished workout/,
		);

		const unavailableProgram = await client.request(
			`/progress?programId=${context.foreign_program_id}`,
		);
		assert.equal(unavailableProgram.response.status, 200);
		assert.match(unavailableProgram.text, /data-progress-state="unavailable-program"/);
		assert.doesNotMatch(unavailableProgram.text, /Foreign progress|Foreign squat/);

		const foreignExerciseKey = toExerciseProgressKey("Foreign squat", "Foreign stance");
		const unavailableExercise = await client.request(
			`/progress?programId=${context.program_id}&exerciseKey=${encodeURIComponent(
				foreignExerciseKey,
			)}`,
		);
		assert.equal(unavailableExercise.response.status, 200);
		assert.match(
			unavailableExercise.text,
			/data-progress-state="unavailable-exercise"/,
		);
		assert.match(unavailableExercise.text, /Exercise unavailable/);
		assert.doesNotMatch(unavailableExercise.text, /Foreign squat|Foreign stance/);

		for (const invalidQuery of [
			"programId=0",
			"exerciseKey=not-a-key",
			"fromDate=2026-02-30",
			"fromDate=2026-09-02&toDate=2026-09-01",
			"pointLimit=201",
		]) {
			const invalid = await client.request(`/progress?${invalidQuery}`);
			assert.equal(invalid.response.status, 400);
			assert.match(invalid.text, /Invalid query parameters/);
		}

		const terminalCountBefore = (
			await db.query(
				"SELECT COUNT(*)::integer AS count FROM workout_sessions WHERE status IN ('finished', 'cancelled')",
			)
		).rows[0].count;
		assert.equal(
			(await client.request("/progress", { method: "POST" })).response.status,
			403,
		);
		assert.equal(
			(
				await db.query(
					"SELECT COUNT(*)::integer AS count FROM workout_sessions WHERE status IN ('finished', 'cancelled')",
				)
			).rows[0].count,
			terminalCountBefore,
		);
	});

	test("workout history reads owned terminal snapshots with stable filtering and pagination", async () => {
		const context = (
			await db.query(`
				WITH owners AS (
					SELECT id, email FROM users
					WHERE email IN ('user-one@example.com', 'user-two@example.com')
				), owner_program_a AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'History A', DATE '2026-08-01' FROM owners
					WHERE email = 'user-one@example.com' RETURNING id, user_id
				), owner_program_b AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'History B', DATE '2026-08-01' FROM owners
					WHERE email = 'user-one@example.com' RETURNING id
				), foreign_program AS (
					INSERT INTO programs (user_id, name, start_date)
					SELECT id, 'Foreign history', DATE '2026-08-01' FROM owners
					WHERE email = 'user-two@example.com' RETURNING id, user_id
				), owner_cycle_a AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'A', 5, 1 FROM owner_program_a RETURNING id
				), owner_cycle_b AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'B', 5, 1 FROM owner_program_b RETURNING id
				), foreign_cycle AS (
					INSERT INTO cycles (program_id, name, cycle_size, cycle_order)
					SELECT id, 'Foreign', 5, 1 FROM foreign_program RETURNING id
				), owner_template AS (
					INSERT INTO sessions (owner_user_id, name, notes)
					SELECT user_id, 'Mutable session name', 'Mutable session notes'
					FROM owner_program_a RETURNING id
				), foreign_template AS (
					INSERT INTO sessions (owner_user_id, name)
					SELECT user_id, 'Foreign session' FROM foreign_program RETURNING id
				), owner_days AS (
					INSERT INTO training_days (cycle_id, day_order, scheduled_date)
					SELECT owner_cycle_a.id, values.day_order, values.scheduled_date
					FROM owner_cycle_a
					CROSS JOIN (VALUES
						(1, DATE '2026-08-01'),
						(2, DATE '2026-08-03'),
						(3, DATE '2026-08-04'),
						(4, DATE '2026-08-05')
					) AS values(day_order, scheduled_date)
					RETURNING id, day_order
				), owner_b_day AS (
					INSERT INTO training_days (cycle_id, day_order, scheduled_date)
					SELECT id, 1, DATE '2026-08-06' FROM owner_cycle_b RETURNING id
				), foreign_day AS (
					INSERT INTO training_days (cycle_id, day_order, scheduled_date)
					SELECT id, 1, DATE '2026-08-07' FROM foreign_cycle RETURNING id
				), owner_sessions AS (
					INSERT INTO workout_sessions
						(training_day_id, session_id, workout_session_order, status,
						 started_at, finished_at, session_name, notes)
					SELECT days.id, owner_template.id, 1,
						(CASE
							WHEN days.day_order IN (1, 3) THEN 'finished'
							WHEN days.day_order = 2 THEN 'cancelled'
							ELSE 'planned'
						END)::workout_session_status,
						CASE WHEN days.day_order IN (1, 3)
							THEN TIMESTAMPTZ '2026-08-03 12:00:00+00' END,
						CASE
							WHEN days.day_order = 1 THEN TIMESTAMPTZ '2026-09-05 10:00:00+00'
							WHEN days.day_order = 3 THEN TIMESTAMPTZ '2026-08-03 15:00:00+00'
						END,
						'Snapshot session', 'Workout note <safe>'
					FROM owner_days days CROSS JOIN owner_template
					RETURNING id, status, training_day_id
				), owner_b_session AS (
					INSERT INTO workout_sessions
						(training_day_id, session_id, workout_session_order, status, session_name)
					SELECT owner_b_day.id, owner_template.id, 1, 'cancelled', 'Program B session'
					FROM owner_b_day, owner_template RETURNING id
				), foreign_session AS (
					INSERT INTO workout_sessions
						(training_day_id, session_id, workout_session_order, status,
						 started_at, finished_at, session_name)
					SELECT foreign_day.id, foreign_template.id, 1, 'finished',
						TIMESTAMPTZ '2026-09-06 09:00:00+00',
						TIMESTAMPTZ '2026-09-06 10:00:00+00', 'Foreign snapshot'
					FROM foreign_day, foreign_template RETURNING id
				)
				SELECT
					owner_program_a.user_id,
					owner_program_a.id AS program_a_id,
					owner_program_b.id AS program_b_id,
					foreign_program.id AS foreign_program_id,
					foreign_program.user_id AS foreign_user_id,
					owner_template.id AS template_id,
					(SELECT os.id FROM owner_sessions os
						JOIN owner_days od ON od.id = os.training_day_id
						WHERE od.day_order = 1) AS finished_id,
					(SELECT id FROM owner_sessions WHERE status = 'cancelled') AS cancelled_id,
					(SELECT id FROM owner_sessions WHERE status = 'planned') AS planned_id,
					foreign_session.id AS foreign_session_id
				FROM owner_program_a, owner_program_b, foreign_program,
					owner_template, foreign_session
			`)
		).rows[0];

		const stepLogs = (
			await db.query(
				`INSERT INTO workout_step_logs
					(workout_session_id, status, step_order, name, step_type_name,
					 exercise_name, exercise_variant_name, planned_sets, planned_reps,
					 planned_load_value, planned_load_unit, completed_at, notes)
				 VALUES
					($1, 'performed', 1, 'Primary movement', 'exercise',
					 'Snapshot squat', 'Snapshot back squat', 2, 8, 100, 'Kilograms',
					 TIMESTAMPTZ '2026-09-05 09:30:00+00', 'Step note'),
					($1, 'skipped', 2, 'Accessory', 'exercise',
					 'Snapshot row', 'Snapshot cable row', 3, 12, NULL, NULL,
					 TIMESTAMPTZ '2026-09-05 09:40:00+00', NULL)
				 RETURNING id, step_order`,
				[context.finished_id],
			)
		).rows;
		await db.query(
			`INSERT INTO workout_set_logs
				(workout_step_log_id, set_order, reps, load_value, load_unit)
			 VALUES ($1, 2, 7, 102.5, 'Kilograms'), ($1, 1, 8, 100, 'Kilograms')`,
			[stepLogs[0].id],
		);
		await db.query(
			"UPDATE sessions SET name = 'Changed template', is_archived = TRUE WHERE id = $1",
			[context.template_id],
		);

		const { default: getWorkoutHistoryPage } =
			await import("../../src/features/workoutHistory/getWorkoutHistoryPage.js");
		const { default: getWorkoutHistoryDetail } =
			await import("../../src/features/workoutHistory/getWorkoutHistoryDetail.js");
		const unfiltered = await getWorkoutHistoryPage(
			{
				userId: context.user_id,
				filters: { programId: null, fromDate: null, toDate: null },
				page: 1,
				pageSize: 2,
			},
			db,
		);
		assert.equal(unfiltered.totalCount, 4);
		assert.equal(unfiltered.totalPages, 2);
		assert.deepEqual(
			unfiltered.items.map((item) => [item.historyDate, item.sessionName]),
			[
				["2026-09-05", "Snapshot session"],
				["2026-08-06", "Program B session"],
			],
		);
		assert.deepEqual(
			await getWorkoutHistoryPage(
				{
					userId: context.user_id,
					filters: { programId: null, fromDate: null, toDate: null },
					page: 99,
					pageSize: 2,
				},
				db,
			),
			{ items: [], totalCount: 4, page: 99, pageSize: 2, totalPages: 2 },
		);

		const filtered = await getWorkoutHistoryPage(
			{
				userId: context.user_id,
				filters: {
					programId: context.program_a_id,
					fromDate: "2026-08-03",
					toDate: "2026-08-03",
				},
				page: 1,
				pageSize: 10,
			},
			db,
		);
		assert.deepEqual(
			filtered.items.map((item) => [item.status, item.historyDate]),
			[
				["finished", "2026-08-03"],
				["cancelled", "2026-08-03"],
			],
		);
		assert.equal(
			(
				await getWorkoutHistoryPage(
					{
						userId: context.foreign_user_id,
						filters: {
							programId: context.program_a_id,
							fromDate: null,
							toDate: null,
						},
					},
					db,
				)
			).totalCount,
			0,
		);

		const detail = await getWorkoutHistoryDetail(
			{ workoutSessionId: context.finished_id, userId: context.user_id },
			db,
		);
		assert.equal(detail?.sessionName, "Snapshot session");
		assert.equal(detail?.notes, "Workout note <safe>");
		assert.deepEqual(
			detail?.steps.map((step) => [
				step.exerciseName,
				step.exerciseVariantName,
				step.plannedSets,
				step.status,
			]),
			[
				["Snapshot squat", "Snapshot back squat", 2, "performed"],
				["Snapshot row", "Snapshot cable row", 3, "skipped"],
			],
		);
		assert.deepEqual(
			detail?.steps[0].sets.map((set) => [
				set.order,
				set.reps,
				set.loadValue,
				set.loadUnit,
			]),
			[
				[1, 8, 100, "Kilograms"],
				[2, 7, 102.5, "Kilograms"],
			],
		);
		assert.deepEqual(
			await getWorkoutHistoryDetail(
				{ workoutSessionId: context.cancelled_id, userId: context.user_id },
				db,
			),
			{
				id: context.cancelled_id,
				status: "cancelled",
				historyDate: "2026-08-03",
				scheduledDate: "2026-08-03",
				startedAt: null,
				finishedAt: null,
				programId: context.program_a_id,
				programName: "History A",
				sessionName: "Snapshot session",
				notes: "Workout note <safe>",
				steps: [],
			},
		);
		assert.equal(
			await getWorkoutHistoryDetail(
				{ workoutSessionId: context.planned_id, userId: context.user_id },
				db,
			),
			null,
		);
		assert.equal(
			await getWorkoutHistoryDetail(
				{ workoutSessionId: context.foreign_session_id, userId: context.user_id },
				db,
			),
			null,
		);

		const anonymous = agent();
		const anonymousHistory = await anonymous.request(
			`/history?programId=${context.program_a_id}`,
		);
		assert.equal(anonymousHistory.response.status, 302);
		assert.equal(
			anonymousHistory.response.headers.get("location"),
			`/auth/login?returnTo=${encodeURIComponent(`/history?programId=${context.program_a_id}`)}`,
		);

		const client = agent();
		await login(client);
		const historyPage = await client.request(
			`/history?programId=${context.program_a_id}&fromDate=2026-08-03&toDate=2026-08-03`,
		);
		assert.equal(historyPage.response.status, 200);
		assert.match(historyPage.text, /Workout history/);
		assert.match(historyPage.text, /aria-current="page"[\s\S]*?<span>History<\/span>/);
		assert.match(historyPage.text, /Finished/);
		assert.match(historyPage.text, /Cancelled/);
		assert.match(historyPage.text, /datetime="2026-08-03"/);
		assert.match(
			historyPage.text,
			new RegExp(
				`href="/history/\\d+\\?programId=${context.program_a_id}&amp;fromDate=2026-08-03&amp;toDate=2026-08-03"`,
			),
		);
		assert.doesNotMatch(historyPage.text, /Foreign snapshot/);

		const detailPage = await client.request(
			`/history/${context.finished_id}?programId=${context.program_a_id}&page=2`,
		);
		assert.equal(detailPage.response.status, 200);
		assert.match(detailPage.text, /Snapshot back squat/);
		assert.match(detailPage.text, /Snapshot squat/);
		assert.match(detailPage.text, /100 Kilograms/);
		assert.match(detailPage.text, /102\.5 Kilograms/);
		assert.match(detailPage.text, /Workout note &lt;safe&gt;/);
		assert.doesNotMatch(detailPage.text, /Workout note <safe>/);
		assert.match(
			detailPage.text,
			new RegExp(`href="/history\\?programId=${context.program_a_id}&amp;page=2"`),
		);
		assert.doesNotMatch(
			detailPage.text,
			/method="POST"|method="PATCH"|method="DELETE"/,
		);

		const cancelledPage = await client.request(`/history/${context.cancelled_id}`);
		assert.equal(cancelledPage.response.status, 200);
		assert.match(cancelledPage.text, /No workout results/);

		let hiddenResponse = null;
		for (const hiddenId of [context.foreign_session_id, context.planned_id, 999999]) {
			const hidden = await client.request(`/history/${hiddenId}`);
			assert.equal(hidden.response.status, 404);
			assert.match(hidden.text, /Workout not found/);
			assert.match(hidden.text, /may not exist or may not belong to this account/);
			if (hiddenResponse === null) hiddenResponse = hidden.text;
			else assert.equal(hidden.text, hiddenResponse);
		}
		assert.equal((await client.request("/history/not-a-session")).response.status, 400);
		assert.equal(
			(await client.request("/history?fromDate=2026-09-02&toDate=2026-09-01")).response
				.status,
			400,
		);
		assert.equal((await client.request("/history?page=10001")).response.status, 400);

		const foreignFilter = await client.request(
			`/history?programId=${context.foreign_program_id}`,
		);
		assert.equal(foreignFilter.response.status, 200);
		assert.match(foreignFilter.text, /No sessions match these filters/);
		assert.match(foreignFilter.text, /Unavailable program/);
		assert.doesNotMatch(foreignFilter.text, /Foreign snapshot/);

		const outOfRange = await client.request(`/history?page=99`);
		assert.equal(outOfRange.response.status, 200);
		assert.match(outOfRange.text, /Return to the first page/);
	});

	test("an owned workout flows from planned logging into analytics, history, and exercise progress", async () => {
		const fixture = await createWorkoutLifecycleFixture({ stepCount: 2 });
		const workoutSessionId = fixture.workoutSessionIds[0];
		const client = agent();
		await login(client);
		assert.equal(
			(await client.request(`/programs?programId=${fixture.program_id}`)).response
				.status,
			200,
		);

		const plannedPage = await client.request(
			`/?daysDifference=0&workoutSessionId=${workoutSessionId}`,
		);
		assert.equal(plannedPage.response.status, 200);
		assert.match(plannedPage.text, /Ready to start/);
		assert.match(plannedPage.text, /0 of 1 scheduled sessions finished/);
		const csrf = csrfFrom(plannedPage.text);

		const started = await client.request(
			`/workout_sessions/${workoutSessionId}/start`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(started.response.status, 302);
		const stepLogs = (
			await db.query(
				`SELECT id, status, step_order FROM workout_step_logs
				 WHERE workout_session_id = $1 ORDER BY step_order`,
				[workoutSessionId],
			)
		).rows;
		assert.deepEqual(
			stepLogs.map((step) => ({ status: step.status, step_order: step.step_order })),
			[
				{ status: "planned", step_order: 1 },
				{ status: "planned", step_order: 2 },
			],
		);

		const performed = await client.request(
			`/workout_step_logs/${stepLogs[0].id}/perform`,
			{
				method: "POST",
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId,
					"logFormRows[0][performedReps]": "8",
					"logFormRows[0][performedLoadValue]": "12.5",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
					"logFormRows[1][performedReps]": "6",
					"logFormRows[1][performedLoadValue]": "20",
					"logFormRows[1][performedLoadUnit]": "Libra",
				},
			},
		);
		assert.equal(performed.response.status, 302);
		assert.equal(
			(
				await client.request(`/workout_step_logs/${stepLogs[1].id}/skip`, {
					method: "POST",
					form: { _csrf: csrf, daysDifference: "0", workoutSessionId },
				})
			).response.status,
			302,
		);

		const resolvedPage = await client.request(
			`/?daysDifference=0&workoutSessionId=${workoutSessionId}`,
		);
		assert.match(resolvedPage.text, /2 of 2 steps resolved/);
		assert.match(resolvedPage.text, /All steps resolved/);
		assert.equal(
			(
				await client.request(`/workout_sessions/${workoutSessionId}/finish`, {
					method: "POST",
					form: { _csrf: csrf, daysDifference: "0" },
				})
			).response.status,
			302,
		);

		const { default: getProgramAnalytics } =
			await import("../../src/features/programAnalytics/getProgramAnalytics.js");
		const analytics = await getProgramAnalytics(
			{ programId: fixture.program_id, userId: fixture.user_id },
			db,
		);
		assert.ok(analytics);
		assert.equal(analytics.activity.length, 1);
		assert.equal(analytics.activity[0].finishedCount, 1);
		assert.deepEqual(
			analytics.adherence.map((week) => ({
				scheduledCount: week.scheduledCount,
				finishedCount: week.finishedCount,
				cancelledCount: week.cancelledCount,
				plannedCount: week.plannedCount,
				inProgressCount: week.inProgressCount,
				completionRate: week.completionRate,
			})),
			[
				{
					scheduledCount: 1,
					finishedCount: 1,
					cancelledCount: 0,
					plannedCount: 0,
					inProgressCount: 0,
					completionRate: 1,
				},
			],
		);
		assert.deepEqual(analytics.performedWork, {
			performedStepCount: 1,
			recordedSetCount: 2,
			completedRepetitionCount: 14,
			setsWithRepetitionsCount: 2,
		});
		assert.deepEqual(analytics.loadVolume, [
			{ unit: "Kilograms", volume: 100, setCount: 1 },
			{ unit: "Libra", volume: 120, setCount: 1 },
		]);

		const finishedPage = await client.request(
			`/?daysDifference=0&workoutSessionId=${workoutSessionId}`,
		);
		assert.equal(finishedPage.response.status, 200);
		assert.match(finishedPage.text, /Workout complete/);
		assert.match(finishedPage.text, /1 of 1 scheduled sessions finished/);
		assert.match(finishedPage.text, /1 finished workout across 1 active day/);
		assert.match(finishedPage.text, /data-chart-scheduled="\[1\]"/);
		assert.match(finishedPage.text, /data-chart-finished="\[1\]"/);
		assert.match(finishedPage.text, /data-chart-cancelled="\[0\]"/);
		assert.match(finishedPage.text, /dashboard-heatmap__cell--one/);
		assert.match(finishedPage.text, /View activity data/);
		assert.match(finishedPage.text, /View weekly adherence data/);
		assert.match(finishedPage.text, /aria-label="100 kilograms"/);
		assert.match(finishedPage.text, /aria-label="120 pounds"/);
		assert.doesNotMatch(
			finishedPage.text,
			/>Start session<|>Complete step<|>Skip step<|>Finish session</,
		);

		const historyPage = await client.request(
			`/history?programId=${fixture.program_id}`,
		);
		assert.equal(historyPage.response.status, 200);
		assert.match(historyPage.text, /Lifecycle session/);
		assert.match(historyPage.text, /Finished/);
		assert.match(
			historyPage.text,
			new RegExp(
				`href="/history/${workoutSessionId}\\?programId=${fixture.program_id}"`,
			),
		);

		const historyDetail = await client.request(
			`/history/${workoutSessionId}?programId=${fixture.program_id}`,
		);
		assert.equal(historyDetail.response.status, 200);
		assert.match(historyDetail.text, /Lifecycle step 1/);
		assert.match(historyDetail.text, /Completed/);
		assert.match(historyDetail.text, /Skipped/);
		assert.match(historyDetail.text, /12\.5 Kilograms/);
		assert.match(historyDetail.text, /20 Libra/);
		assert.doesNotMatch(
			historyDetail.text,
			/method="POST"|method="PATCH"|method="DELETE"/,
		);

		const snapshotIdentity = (
			await db.query(
				`SELECT
					wsl.exercise_name,
					wsl.exercise_variant_name,
					TO_CHAR((ws.finished_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
						AS completion_date
				 FROM workout_step_logs wsl
				 JOIN workout_sessions ws ON ws.id = wsl.workout_session_id
				 WHERE wsl.workout_session_id = $1 AND wsl.status = 'performed'`,
				[workoutSessionId],
			)
		).rows[0];
		const { toExerciseProgressKey } =
			await import("../../src/features/exerciseProgress/mapper.js");
		const { default: getExerciseProgress } =
			await import("../../src/features/exerciseProgress/getExerciseProgress.js");
		const exerciseKey = toExerciseProgressKey(
			snapshotIdentity.exercise_name,
			snapshotIdentity.exercise_variant_name,
		);
		const lifecycleProgress = await getExerciseProgress(
			{
				userId: fixture.user_id,
				programId: fixture.program_id,
				exerciseKey,
				filters: {
					fromDate: snapshotIdentity.completion_date,
					toDate: snapshotIdentity.completion_date,
				},
				pointLimit: 25,
			},
			db,
		);
		assert.ok(lifecycleProgress);
		assert.deepEqual(lifecycleProgress.summary, {
			occurrenceCount: 1,
			performedStepCount: 1,
			recordedSetCount: 2,
			setsWithRepetitionsCount: 2,
			completedRepetitionCount: 14,
			setsWithLoadCount: 2,
			setsWithVolumeCount: 2,
			units: [
				{
					unit: "Kilograms",
					loadObservationCount: 1,
					maximumLoad: 12.5,
					volumeSetCount: 1,
					volume: 100,
				},
				{
					unit: "Libra",
					loadObservationCount: 1,
					maximumLoad: 20,
					volumeSetCount: 1,
					volume: 120,
				},
			],
		});

		const progressSelection = await client.request(
			`/progress?programId=${fixture.program_id}`,
		);
		assert.equal(progressSelection.response.status, 200);
		assert.ok(progressSelection.text.includes(snapshotIdentity.exercise_name));
		assert.ok(progressSelection.text.includes(snapshotIdentity.exercise_variant_name));

		const progressPath =
			`/progress?programId=${fixture.program_id}` +
			`&exerciseKey=${encodeURIComponent(exerciseKey)}` +
			`&fromDate=${snapshotIdentity.completion_date}` +
			`&toDate=${snapshotIdentity.completion_date}&pointLimit=25`;
		const progressPage = await client.request(progressPath);
		assert.equal(progressPage.response.status, 200);
		assert.match(progressPage.text, /Recorded exercise results by finished workout/);
		assert.match(progressPage.text, /2 of 2 recorded sets have valid repetitions/);
		assert.match(progressPage.text, /12\.5 Kilograms/);
		assert.match(progressPage.text, /100 repetitions × Kilograms/);
		assert.match(progressPage.text, /20 Libra/);
		assert.match(progressPage.text, /120 repetitions × Libra/);
		assert.match(progressPage.text, new RegExp(`href="/history/${workoutSessionId}"`));
		assert.match(progressPage.text, /exercise-progress-table-scroll/);
		assert.doesNotMatch(
			progressPage.text,
			/method="POST"|method="PATCH"|method="DELETE"|<canvas/,
		);

		const emptyProgressPage = await client.request(
			`/progress?programId=${fixture.program_id}&exerciseKey=${encodeURIComponent(
				exerciseKey,
			)}&fromDate=2099-01-01&toDate=2099-01-01`,
		);
		assert.equal(emptyProgressPage.response.status, 200);
		assert.match(emptyProgressPage.text, /data-progress-state="no-results"/);

		assert.equal(
			(
				await client.request(`/workout_step_logs/${stepLogs[0].id}/perform`, {
					method: "POST",
					form: {
						_csrf: csrf,
						daysDifference: "0",
						workoutSessionId,
						"logFormRows[0][performedReps]": "100",
						"logFormRows[0][performedLoadValue]": "100",
						"logFormRows[0][performedLoadUnit]": "Kilograms",
					},
				})
			).response.status,
			409,
		);
		assert.equal(
			(
				await client.request(`/workout_sessions/${workoutSessionId}/finish`, {
					method: "POST",
					form: { _csrf: csrf, daysDifference: "0" },
				})
			).response.status,
			409,
		);
		assert.deepEqual(
			await getProgramAnalytics(
				{ programId: fixture.program_id, userId: fixture.user_id },
				db,
			),
			analytics,
		);
		assert.deepEqual(
			await getExerciseProgress(
				{
					userId: fixture.user_id,
					programId: fixture.program_id,
					exerciseKey,
					filters: {
						fromDate: snapshotIdentity.completion_date,
						toDate: snapshotIdentity.completion_date,
					},
					pointLimit: 25,
				},
				db,
			),
			lifecycleProgress,
		);
		assert.equal(
			await getProgramAnalytics(
				{
					programId: fixture.program_id,
					userId: (
						await db.query("SELECT id FROM users WHERE email = 'user-two@example.com'")
					).rows[0].id,
				},
				db,
			),
			null,
		);
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
		const csrf = csrfFrom((await attacker.request("/profile")).text);
		assert.equal(
			(
				await attacker.request(`/workout_sessions/${rows[0].id}/finish`, {
					method: "POST",
					form: { _csrf: csrf, daysDifference: "0" },
				})
			).response.status,
			404,
		);
		assert.equal(
			(
				await attacker.request(`/workout_sessions/${rows[0].id}?_method=PATCH`, {
					method: "POST",
					form: { _csrf: csrf, trainingDayId: "1" },
				})
			).response.status,
			404,
		);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					rows[0].id,
				])
			).rows[0].status,
			"planned",
		);
	});

	test("workout sessions enforce ordered transitions and immutable terminal state", async () => {
		const fixture = await createWorkoutLifecycleFixture({
			stepCount: 2,
			workoutCount: 2,
		});
		const [workoutSessionId, competingWorkoutSessionId] = fixture.workoutSessionIds;
		const client = agent();
		await login(client);
		await client.request(`/programs?programId=${fixture.program_id}`);
		const profile = await client.request("/profile");
		const csrf = csrfFrom(profile.text);

		const started = await client.request(
			`/workout_sessions/${workoutSessionId}/start`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(started.response.status, 302);
		const startedState = (
			await db.query(
				`SELECT status, started_at, finished_at,
				        (SELECT count(*)::int FROM workout_step_logs
				         WHERE workout_session_id = ws.id) AS step_count
				 FROM workout_sessions ws WHERE id = $1`,
				[workoutSessionId],
			)
		).rows[0];
		assert.equal(startedState.status, "in_progress");
		assert.ok(startedState.started_at);
		assert.equal(startedState.finished_at, null);
		assert.equal(startedState.step_count, 2);

		const repeatedStart = await client.request(
			`/workout_sessions/${workoutSessionId}/start`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(repeatedStart.response.status, 409);
		assert.match(repeatedStart.response.headers.get("content-type"), /text\/html/);
		assert.match(repeatedStart.text, /can no longer be started/i);
		assert.match(repeatedStart.text, /role="alert"[^>]*data-workout-feedback/);
		assert.doesNotMatch(repeatedStart.text, /constraint|workout_sessions/i);
		assert.deepEqual(
			(
				await db.query(
					`SELECT started_at,
					        (SELECT count(*)::int FROM workout_step_logs
					         WHERE workout_session_id = ws.id) AS step_count
					 FROM workout_sessions ws WHERE id = $1`,
					[workoutSessionId],
				)
			).rows[0],
			{ started_at: startedState.started_at, step_count: 2 },
		);
		const competingStart = await client.request(
			`/workout_sessions/${competingWorkoutSessionId}/start`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(competingStart.response.status, 409);
		assert.match(competingStart.text, /another workout session is already active/i);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					competingWorkoutSessionId,
				])
			).rows[0].status,
			"planned",
		);
		const activeCancellation = await client.request(
			`/workout_sessions/${workoutSessionId}?_method=PATCH`,
			{
				method: "POST",
				form: { _csrf: csrf, trainingDayId: fixture.training_day_id },
			},
		);
		assert.equal(activeCancellation.response.status, 409);
		assert.match(activeCancellation.text, /can no longer be cancelled/i);
		assert.equal(
			(
				await db.query("SELECT status FROM workout_sessions WHERE id = $1", [
					workoutSessionId,
				])
			).rows[0].status,
			"in_progress",
		);

		const unfinished = await client.request(
			`/workout_sessions/${workoutSessionId}/finish`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(unfinished.response.status, 409);
		assert.match(unfinished.text, /complete or skip every workout step/i);
		assert.match(unfinished.text, /Workout not updated/);
		assert.deepEqual(
			(
				await db.query(
					"SELECT status, finished_at FROM workout_sessions WHERE id = $1",
					[workoutSessionId],
				)
			).rows[0],
			{ status: "in_progress", finished_at: null },
		);

		await db.query(
			`UPDATE workout_step_logs
			 SET status = (CASE WHEN step_order = 1 THEN 'performed' ELSE 'skipped' END)::workout_step_log_status,
			     completed_at = NOW()
			 WHERE workout_session_id = $1`,
			[workoutSessionId],
		);
		const finished = await client.request(
			`/workout_sessions/${workoutSessionId}/finish`,
			{
				method: "POST",
				form: { _csrf: csrf, daysDifference: "0" },
			},
		);
		assert.equal(finished.response.status, 302);
		const finishedState = (
			await db.query(
				"SELECT status, started_at, finished_at FROM workout_sessions WHERE id = $1",
				[workoutSessionId],
			)
		).rows[0];
		assert.equal(finishedState.status, "finished");
		assert.ok(finishedState.finished_at);

		for (const request of [
			{
				path: `/workout_sessions/${workoutSessionId}/start`,
				form: { _csrf: csrf, daysDifference: "0" },
			},
			{
				path: `/workout_sessions/${workoutSessionId}/finish`,
				form: { _csrf: csrf, daysDifference: "0" },
			},
			{
				path: `/workout_sessions/${workoutSessionId}?_method=PATCH`,
				form: { _csrf: csrf, trainingDayId: fixture.training_day_id },
			},
		]) {
			const result = await client.request(request.path, {
				method: "POST",
				form: request.form,
			});
			assert.equal(result.response.status, 409);
		}
		assert.deepEqual(
			(
				await db.query(
					"SELECT status, started_at, finished_at FROM workout_sessions WHERE id = $1",
					[workoutSessionId],
				)
			).rows[0],
			finishedState,
		);
	});

	test("planned cancellation is terminal and an empty started session can finish", async () => {
		const fixture = await createWorkoutLifecycleFixture({
			stepCount: 0,
			workoutCount: 2,
		});
		const [cancelledId, emptyId] = fixture.workoutSessionIds;
		const client = agent();
		await login(client);
		await client.request(`/programs?programId=${fixture.program_id}`);
		const csrf = csrfFrom((await client.request("/profile")).text);

		const cancelled = await client.request(
			`/workout_sessions/${cancelledId}?_method=PATCH`,
			{
				method: "POST",
				form: { _csrf: csrf, trainingDayId: fixture.training_day_id },
			},
		);
		assert.equal(cancelled.response.status, 302);
		assert.deepEqual(
			(
				await db.query(
					"SELECT status, started_at, finished_at FROM workout_sessions WHERE id = $1",
					[cancelledId],
				)
			).rows[0],
			{ status: "cancelled", started_at: null, finished_at: null },
		);

		for (const request of [
			{
				path: `/workout_sessions/${cancelledId}?_method=PATCH`,
				form: { _csrf: csrf, trainingDayId: fixture.training_day_id },
			},
			{
				path: `/workout_sessions/${cancelledId}/start`,
				form: { _csrf: csrf, daysDifference: "0" },
			},
			{
				path: `/workout_sessions/${cancelledId}/finish`,
				form: { _csrf: csrf, daysDifference: "0" },
			},
		]) {
			const result = await client.request(request.path, {
				method: "POST",
				form: request.form,
			});
			assert.equal(result.response.status, 409);
		}

		assert.equal(
			(
				await client.request(`/workout_sessions/${emptyId}/start`, {
					method: "POST",
					form: { _csrf: csrf, daysDifference: "0" },
				})
			).response.status,
			302,
		);
		const activeEmptyPage = await client.request(
			`/?daysDifference=0&workoutSessionId=${emptyId}`,
		);
		assert.equal(activeEmptyPage.response.status, 200);
		assert.match(activeEmptyPage.text, /Nothing to log/);
		assert.match(activeEmptyPage.text, /Finish session/);
		assert.doesNotMatch(activeEmptyPage.text, /Complete step/);
		assert.equal(
			(
				await client.request(`/workout_sessions/${emptyId}/finish`, {
					method: "POST",
					form: { _csrf: csrf, daysDifference: "0" },
				})
			).response.status,
			302,
		);
		assert.equal(
			(await db.query("SELECT status FROM workout_sessions WHERE id = $1", [emptyId]))
				.rows[0].status,
			"finished",
		);

		const historyPage = await client.request(
			`/history?programId=${fixture.program_id}`,
		);
		assert.equal(historyPage.response.status, 200);
		assert.match(historyPage.text, /Cancelled/);
		assert.match(historyPage.text, /Finished/);

		const cancelledHistory = await client.request(`/history/${cancelledId}`);
		assert.equal(cancelledHistory.response.status, 200);
		assert.match(cancelledHistory.text, /No workout results/);
		assert.match(
			cancelledHistory.text,
			/cancelled before exercise results were recorded/,
		);

		const emptyHistory = await client.request(`/history/${emptyId}`);
		assert.equal(emptyHistory.response.status, 200);
		assert.match(emptyHistory.text, /No exercises recorded/);
		assert.match(emptyHistory.text, /finished without exercise steps/);
		assert.deepEqual(
			(
				await db.query(
					`SELECT id, status FROM workout_sessions
					 WHERE id = ANY($1::int[]) ORDER BY id`,
					[fixture.workoutSessionIds],
				)
			).rows,
			[
				{ id: cancelledId, status: "cancelled" },
				{ id: emptyId, status: "finished" },
			],
		);
	});

	test("concurrent starts preserve one active session and one exact step snapshot", async () => {
		const fixture = await createWorkoutLifecycleFixture({
			stepCount: 2,
			workoutCount: 2,
		});
		const { default: startWorkoutSession } =
			await import("../../src/features/workoutSessions/startWorkoutSession.js");
		const { default: WorkoutSessionLifecycleError } =
			await import("../../src/features/workoutSessions/WorkoutSessionLifecycleError.js");

		const results = await Promise.allSettled(
			fixture.workoutSessionIds.map((workoutSessionId) =>
				startWorkoutSession({ workoutSessionId, userId: fixture.user_id }),
			),
		);
		assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
		const rejected = results.find((result) => result.status === "rejected");
		assert.ok(rejected);
		assert.ok(rejected.reason instanceof WorkoutSessionLifecycleError);
		assert.equal(rejected.reason.reason, "active_session");

		const sessions = (
			await db.query(
				`SELECT ws.id, ws.status, ws.session_name, count(wsl.id)::int AS step_count
				 FROM workout_sessions ws
				 LEFT JOIN workout_step_logs wsl ON wsl.workout_session_id = ws.id
				 WHERE ws.id = ANY($1::int[])
				 GROUP BY ws.id ORDER BY ws.id`,
				[fixture.workoutSessionIds],
			)
		).rows;
		assert.deepEqual(sessions.map((session) => session.status).sort(), [
			"in_progress",
			"planned",
		]);
		assert.deepEqual(
			sessions.map((session) => session.step_count).sort((a, b) => a - b),
			[0, 2],
		);
		const activeSession = sessions.find((session) => session.status === "in_progress");
		assert.equal(activeSession.session_name, "Lifecycle session");
		assert.deepEqual(
			(
				await db.query(
					`SELECT name, step_type_name, exercise_name, exercise_variant_name,
					        planned_sets, planned_reps
					 FROM workout_step_logs
					 WHERE workout_session_id = $1
					 ORDER BY step_order`,
					[activeSession.id],
				)
			).rows,
			[
				{
					name: "Lifecycle step 1",
					step_type_name: "exercise",
					exercise_name: "Push Up",
					exercise_variant_name: "Bodyweight Push Up",
					planned_sets: 2,
					planned_reps: 8,
				},
				{
					name: "Lifecycle step 2",
					step_type_name: "exercise",
					exercise_name: "Push Up",
					exercise_variant_name: "Bodyweight Push Up",
					planned_sets: 2,
					planned_reps: 8,
				},
			],
		);
	});

	test("performed and skipped steps persist once with owned parent identity", async () => {
		const fixture = await createWorkoutLifecycleFixture({
			stepCount: 2,
			workoutCount: 2,
		});
		const stepLogs = await startFixtureWorkout(fixture);
		const [performedStep, skippedStep] = stepLogs;
		const client = agent();
		await login(client);
		await client.request(`/programs?programId=${fixture.program_id}`);
		const csrf = csrfFrom((await client.request("/profile")).text);

		const performed = await client.request(
			`/workout_step_logs/${performedStep.id}/perform`,
			{
				method: "POST",
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: fixture.workoutSessionIds[1],
					"logFormRows[0][performedReps]": "8",
					"logFormRows[0][performedLoadValue]": "12.5",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
					"logFormRows[1][performedReps]": "6",
					"logFormRows[1][performedLoadValue]": "20",
					"logFormRows[1][performedLoadUnit]": "Libra",
				},
			},
		);
		assert.equal(performed.response.status, 302);
		assert.equal(
			performed.response.headers.get("location"),
			`/?daysDifference=0&workoutSessionId=${fixture.workoutSessionIds[0]}`,
		);
		const performedState = (
			await db.query(
				"SELECT status, completed_at FROM workout_step_logs WHERE id = $1",
				[performedStep.id],
			)
		).rows[0];
		assert.equal(performedState.status, "performed");
		assert.ok(performedState.completed_at);
		assert.deepEqual(
			(
				await db.query(
					`SELECT set_order, reps, load_value, load_unit
					 FROM workout_set_logs WHERE workout_step_log_id = $1
					 ORDER BY set_order`,
					[performedStep.id],
				)
			).rows,
			[
				{ set_order: 1, reps: 8, load_value: 12.5, load_unit: "Kilograms" },
				{ set_order: 2, reps: 6, load_value: 20, load_unit: "Libra" },
			],
		);

		const repeatedPerform = await client.request(
			`/workout_step_logs/${performedStep.id}/perform`,
			{
				method: "POST",
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: fixture.workoutSessionIds[0],
					"logFormRows[0][performedReps]": "100",
					"logFormRows[0][performedLoadValue]": "100",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
				},
			},
		);
		assert.equal(repeatedPerform.response.status, 409);
		assert.match(repeatedPerform.response.headers.get("content-type"), /text\/html/);
		assert.match(repeatedPerform.text, /can no longer be performed/i);
		assert.match(repeatedPerform.text, /role="alert"[^>]*data-workout-feedback/);
		assert.doesNotMatch(repeatedPerform.text, /constraint|workout_set_logs/i);
		assert.equal(
			(
				await client.request(`/workout_step_logs/${performedStep.id}/skip`, {
					method: "POST",
					form: {
						_csrf: csrf,
						daysDifference: "0",
						workoutSessionId: fixture.workoutSessionIds[0],
					},
				})
			).response.status,
			409,
		);
		assert.deepEqual(
			(
				await db.query(
					"SELECT status, completed_at FROM workout_step_logs WHERE id = $1",
					[performedStep.id],
				)
			).rows[0],
			performedState,
		);
		assert.equal(
			(
				await db.query(
					"SELECT count(*)::int AS count FROM workout_set_logs WHERE workout_step_log_id = $1",
					[performedStep.id],
				)
			).rows[0].count,
			2,
		);

		const skipped = await client.request(`/workout_step_logs/${skippedStep.id}/skip`, {
			method: "POST",
			form: {
				_csrf: csrf,
				daysDifference: "0",
				workoutSessionId: fixture.workoutSessionIds[1],
			},
		});
		assert.equal(skipped.response.status, 302);
		assert.equal(
			skipped.response.headers.get("location"),
			`/?daysDifference=0&workoutSessionId=${fixture.workoutSessionIds[0]}`,
		);
		assert.deepEqual(
			(
				await db.query(
					`SELECT wsl.status, wsl.completed_at,
					        count(wssl.id)::int AS set_count
					 FROM workout_step_logs wsl
					 LEFT JOIN workout_set_logs wssl ON wssl.workout_step_log_id = wsl.id
					 WHERE wsl.id = $1 GROUP BY wsl.id`,
					[skippedStep.id],
				)
			).rows.map((row) => ({
				status: row.status,
				completed: Boolean(row.completed_at),
				set_count: row.set_count,
			})),
			[{ status: "skipped", completed: true, set_count: 0 }],
		);
		for (const request of [
			{
				path: `/workout_step_logs/${skippedStep.id}/skip`,
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: fixture.workoutSessionIds[0],
				},
			},
			{
				path: `/workout_step_logs/${skippedStep.id}/perform`,
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: fixture.workoutSessionIds[0],
					"logFormRows[0][performedReps]": "8",
					"logFormRows[0][performedLoadValue]": "",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
				},
			},
		]) {
			assert.equal(
				(
					await client.request(request.path, {
						method: "POST",
						form: request.form,
					})
				).response.status,
				409,
			);
		}
	});

	test("invalid workout sets rerender beside preserved safe values without writes", async () => {
		const fixture = await createWorkoutLifecycleFixture({ stepCount: 1 });
		const [step] = await startFixtureWorkout(fixture);
		const client = agent();
		await login(client);
		await client.request(`/programs?programId=${fixture.program_id}`);
		const csrf = csrfFrom((await client.request("/profile")).text);

		const result = await client.request(`/workout_step_logs/${step.id}/perform`, {
			method: "POST",
			form: {
				_csrf: csrf,
				daysDifference: "0",
				workoutSessionId: fixture.workoutSessionIds[0],
				"logFormRows[0][performedReps]": "-4",
				"logFormRows[0][performedLoadValue]": "27.5",
				"logFormRows[0][performedLoadUnit]": "Kilograms",
			},
		});

		assert.equal(result.response.status, 422);
		assert.match(result.text, /role="alert"[^>]*data-workout-feedback/);
		assert.match(result.text, /Reps cannot be negative/);
		assert.match(result.text, /value="-4"/);
		assert.match(result.text, /value="27.5"/);
		assert.match(result.text, /aria-invalid="true"/);
		assert.deepEqual(
			(
				await db.query(
					`SELECT wsl.status, wsl.completed_at,
					        count(wssl.id)::int AS set_count
					 FROM workout_step_logs wsl
					 LEFT JOIN workout_set_logs wssl ON wssl.workout_step_log_id = wsl.id
					 WHERE wsl.id = $1 GROUP BY wsl.id`,
					[step.id],
				)
			).rows[0],
			{ status: "planned", completed_at: null, set_count: 0 },
		);
	});

	test("step actions reject inactive sessions and cross-account identities", async () => {
		const inactiveFixture = await createWorkoutLifecycleFixture({ stepCount: 1 });
		const inactiveStep = (
			await db.query(
				`INSERT INTO workout_step_logs
				 (workout_session_id, session_step_id, status, step_order, name)
				 SELECT $1, id, 'planned', step_order, name
				 FROM session_steps WHERE session_id = $2 RETURNING id`,
				[inactiveFixture.workoutSessionIds[0], inactiveFixture.session_id],
			)
		).rows[0];
		const owner = agent();
		await login(owner);
		const ownerCsrf = csrfFrom((await owner.request("/profile")).text);
		for (const request of [
			{
				path: `/workout_step_logs/${inactiveStep.id}/skip`,
				form: {
					_csrf: ownerCsrf,
					daysDifference: "0",
					workoutSessionId: inactiveFixture.workoutSessionIds[0],
				},
			},
			{
				path: `/workout_step_logs/${inactiveStep.id}/perform`,
				form: {
					_csrf: ownerCsrf,
					daysDifference: "0",
					workoutSessionId: inactiveFixture.workoutSessionIds[0],
					"logFormRows[0][performedReps]": "8",
					"logFormRows[0][performedLoadValue]": "",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
				},
			},
		]) {
			assert.equal(
				(
					await owner.request(request.path, {
						method: "POST",
						form: request.form,
					})
				).response.status,
				409,
			);
		}

		const ownedFixture = await createWorkoutLifecycleFixture({ stepCount: 1 });
		const [ownedStep] = await startFixtureWorkout(ownedFixture);
		const attacker = agent();
		await login(attacker, "user-two@example.com");
		const attackerCsrf = csrfFrom((await attacker.request("/profile")).text);
		for (const request of [
			{
				path: `/workout_step_logs/${ownedStep.id}/skip`,
				form: {
					_csrf: attackerCsrf,
					daysDifference: "0",
					workoutSessionId: ownedFixture.workoutSessionIds[0],
				},
			},
			{
				path: `/workout_step_logs/${ownedStep.id}/perform`,
				form: {
					_csrf: attackerCsrf,
					daysDifference: "0",
					workoutSessionId: ownedFixture.workoutSessionIds[0],
					"logFormRows[0][performedReps]": "8",
					"logFormRows[0][performedLoadValue]": "",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
				},
			},
		]) {
			assert.equal(
				(
					await attacker.request(request.path, {
						method: "POST",
						form: request.form,
					})
				).response.status,
				404,
			);
		}
		assert.deepEqual(
			(
				await db.query(
					`SELECT wsl.status, wsl.completed_at,
					        count(wssl.id)::int AS set_count
					 FROM workout_step_logs wsl
					 LEFT JOIN workout_set_logs wssl ON wssl.workout_step_log_id = wsl.id
					 WHERE wsl.id = $1 GROUP BY wsl.id`,
					[ownedStep.id],
				)
			).rows[0],
			{ status: "planned", completed_at: null, set_count: 0 },
		);
	});

	test("failed set persistence rolls the performed step back completely", async () => {
		const fixture = await createWorkoutLifecycleFixture({ stepCount: 1 });
		const [step] = await startFixtureWorkout(fixture);
		const client = agent();
		await login(client);
		const csrf = csrfFrom((await client.request("/profile")).text);
		await db.query(`
			CREATE OR REPLACE FUNCTION fail_workout_set_insert() RETURNS trigger AS $$
			BEGIN
				RAISE EXCEPTION 'simulated set insert failure';
			END;
			$$ LANGUAGE plpgsql;
			CREATE TRIGGER fail_workout_set_insert
			BEFORE INSERT ON workout_set_logs
			FOR EACH ROW EXECUTE FUNCTION fail_workout_set_insert();
		`);

		try {
			const result = await client.request(`/workout_step_logs/${step.id}/perform`, {
				method: "POST",
				form: {
					_csrf: csrf,
					daysDifference: "0",
					workoutSessionId: fixture.workoutSessionIds[0],
					"logFormRows[0][performedReps]": "8",
					"logFormRows[0][performedLoadValue]": "10",
					"logFormRows[0][performedLoadUnit]": "Kilograms",
				},
			});
			assert.equal(result.response.status, 500);
			assert.deepEqual(
				(
					await db.query(
						`SELECT wsl.status, wsl.completed_at,
						        count(wssl.id)::int AS set_count
						 FROM workout_step_logs wsl
						 LEFT JOIN workout_set_logs wssl ON wssl.workout_step_log_id = wsl.id
						 WHERE wsl.id = $1 GROUP BY wsl.id`,
						[step.id],
					)
				).rows[0],
				{ status: "planned", completed_at: null, set_count: 0 },
			);
		} finally {
			await db.query(
				"DROP TRIGGER IF EXISTS fail_workout_set_insert ON workout_set_logs",
			);
			await db.query("DROP FUNCTION IF EXISTS fail_workout_set_insert()");
		}
	});

	test("concurrent perform and skip submissions produce one immutable result", async () => {
		const fixture = await createWorkoutLifecycleFixture({ stepCount: 1 });
		const [step] = await startFixtureWorkout(fixture);
		const { default: performWorkoutStepLog } =
			await import("../../src/features/workoutSessionStepLogs/performWorkoutStepLog.js");
		const { default: skipWorkoutStepLog } =
			await import("../../src/features/workoutSessionStepLogs/skipWorkoutStepLog.js");
		const { default: WorkoutStepLogLifecycleError } =
			await import("../../src/features/workoutSessionStepLogs/WorkoutStepLogLifecycleError.js");

		const results = await Promise.allSettled([
			performWorkoutStepLog({
				workoutStepLogId: step.id,
				logFormRows: [
					{
						performedReps: 8,
						performedLoadValue: 10,
						performedLoadUnit: "Kilograms",
					},
				],
				userId: fixture.user_id,
			}),
			skipWorkoutStepLog({
				workoutStepLogId: step.id,
				userId: fixture.user_id,
			}),
		]);
		assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
		const rejected = results.find((result) => result.status === "rejected");
		assert.ok(rejected);
		assert.ok(rejected.reason instanceof WorkoutStepLogLifecycleError);

		const persisted = (
			await db.query(
				`SELECT wsl.status, wsl.completed_at,
				        count(wssl.id)::int AS set_count
				 FROM workout_step_logs wsl
				 LEFT JOIN workout_set_logs wssl ON wssl.workout_step_log_id = wsl.id
				 WHERE wsl.id = $1 GROUP BY wsl.id`,
				[step.id],
			)
		).rows[0];
		assert.ok(persisted.completed_at);
		assert.ok(["performed", "skipped"].includes(persisted.status));
		assert.equal(persisted.set_count, persisted.status === "performed" ? 1 : 0);
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
