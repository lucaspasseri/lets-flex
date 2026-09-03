import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { Client } from "pg";
import { schemaSql } from "../../db/schema.js";
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

	test("a local account can securely request and complete a password reset", async () => {
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
			throw new Error("Password reset email delivery failed (provider_rejected)");
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
			assert.doesNotMatch(diagnostics[0], /user-one|password-reset\?token/);
		} finally {
			emailService.sendPasswordReset = sendPasswordReset;
			console.error = originalConsoleError;
		}
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
		assert.equal(unchanged.program_count, 1);
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
