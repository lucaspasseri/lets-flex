import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import expressEjsLayouts from "express-ejs-layouts";
import methodOverride from "method-override";
import connectPgSimple from "connect-pg-simple";
import pool from "./db/pool.js";
import { createPassport } from "./src/config/passport.js";
import createAuthRouter from "./src/interfaces/routes/auth.js";
import csrfProtection from "./src/interfaces/middleware/csrfProtection.js";
import {
	exposePrincipal,
	requireAuthentication,
} from "./src/interfaces/middleware/auth.js";

import libraryRouter from "./src/interfaces/routes/library.js";
import indexRouter from "./src/interfaces/routes/index.js";
import profileRouter from "./src/interfaces/routes/profile.js";

import programsRouter from "./src/interfaces/routes/programs.js";

import cyclesRouter from "./src/interfaces/routes/cycles.js";
import sessionRouter from "./src/interfaces/routes/sessions.js";
import exerciseTemplatesRouter from "./src/interfaces/routes/exerciseTemplates.js";
import workoutSessionsRouter from "./src/interfaces/routes/workoutSessions.js";
import workoutStepLogRouter from "./src/interfaces/routes/workoutStepLogs.js";
import exerciseVariantsRouter from "./src/interfaces/routes/exerciseVariants.js";

import playgroundRouter from "./src/interfaces/routes/playground.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(options = {}) {
	const app = express();
	const passport = options.passport ?? createPassport();
	const sessionSecret = process.env.SESSION_SECRET;
	if (!sessionSecret) {
		throw new Error("SESSION_SECRET is required");
	}
	if (process.env.NODE_ENV === "production") {
		app.set("trust proxy", 1);
	}

	app.set("view engine", "ejs");
	app.set("views", path.join(__dirname, "views"));
	app.use(expressEjsLayouts);
	app.set("layout", "./layouts/pageShell");

	app.use(express.urlencoded({ extended: true }));
	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.json());
	app.use(methodOverride("_method"));

	const PgSession = connectPgSimple(session);
	const sessionStore =
		options.sessionStore ??
		new PgSession({
			pool,
			tableName: "session",
			createTableIfMissing: false,
		});
	const sessionMaxAge = Number(process.env.SESSION_MAX_AGE_MS || 1_296_000_000);
	if (!Number.isFinite(sessionMaxAge) || sessionMaxAge <= 0) {
		throw new Error("SESSION_MAX_AGE_MS must be a positive number");
	}
	app.use(
		session({
			name: "lets_flex_session",
			secret: sessionSecret,
			store: sessionStore,
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
				maxAge: sessionMaxAge,
			},
		}),
	);
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(csrfProtection);
	app.use(exposePrincipal);

	app.use("/auth", createAuthRouter(passport));
	app.use(requireAuthentication);

	app.use("/", indexRouter);
	app.use("/profile", profileRouter);
	app.use("/library", libraryRouter);

	app.use("/programs", programsRouter);

	app.use("/cycles", cyclesRouter);
	app.use("/sessions", sessionRouter);
	app.use("/admin/library/exercises", exerciseTemplatesRouter);
	app.use("/", exerciseVariantsRouter);
	app.use("/workout_sessions", workoutSessionsRouter);
	app.use("/workout_step_logs", workoutStepLogRouter);

	if (process.env.NODE_ENV !== "production") {
		app.use("/playground", playgroundRouter);
	}

	app.use((_req, res) => {
		res.status(404).send("Not found");
	});

	app.use((err, _req, res, next) => {
		if (res.headersSent) {
			next(err);
			return;
		}
		if (err instanceof Error && err.name === "ResourceNotFoundError") {
			res.status(404).send("Not found");
			return;
		}
		console.error(err instanceof Error ? err.stack : err);
		res.status(500).send("Something broke!");
	});

	return app;
}
