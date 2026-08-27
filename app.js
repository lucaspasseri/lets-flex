import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import expressEjsLayouts from "express-ejs-layouts";
import methodOverride from "method-override";

import libraryRouter from "./src/interfaces/routes/library.js";
import indexRouter from "./src/interfaces/routes/index.js";
import profileRouter from "./src/interfaces/routes/profile.js";

import programsRouter from "./src/interfaces/routes/programs.js";

import usersRouter from "./src/interfaces/routes/users.js";
import cyclesRouter from "./src/interfaces/routes/cycles.js";
import sessionRouter from "./src/interfaces/routes/sessions.js";
import exerciseTemplatesRouter from "./src/interfaces/routes/exerciseTemplates.js";
import workoutSessionsRouter from "./src/interfaces/routes/workoutSessions.js";
import workoutStepLogRouter from "./src/interfaces/routes/workoutStepLogs.js";

import playgroundRouter from "./src/interfaces/routes/playground.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
	const app = express();
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

	app.use(
		session({
			secret: sessionSecret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
			},
		}),
	);
	app.use(express.urlencoded({ extended: true }));
	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.json());
	app.use(methodOverride("_method"));

	app.use("/", indexRouter);
	app.use("/profile", profileRouter);
	app.use("/library", libraryRouter);

	app.use("/programs", programsRouter);

	app.use("/users", usersRouter);
	app.use("/cycles", cyclesRouter);
	app.use("/sessions", sessionRouter);
	app.use("/exerciseTemplates", exerciseTemplatesRouter);
	app.use("/workout_sessions", workoutSessionsRouter);
	app.use("/workout_step_logs", workoutStepLogRouter);

	if (process.env.NODE_ENV !== "production") {
		app.use("/playground", playgroundRouter);
	}

	app.use((_req, res) => {
		res.status(404).send("Not found");
	});

	app.use((err, _req, res, _next) => {
		console.error(err instanceof Error ? err.stack : err);
		res.status(500).send("Something broke!");
	});

	return app;
}
