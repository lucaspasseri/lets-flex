import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import expressEjsLayouts from "express-ejs-layouts";
import methodOverride from "method-override";

import libraryRouter from "./routes/library.js";
import indexRouter from "./routes/index.js";
import profileRouter from "./routes/profile.js";

import programsRouter from "./routes/programs.js";

import usersRouter from "./routes/users.js";
import cyclesRouter from "./routes/cycles.js";
import sessionRouter from "./routes/sessions.js";
import exerciseTemplatesRouter from "./routes/exerciseTemplates.js";
import workoutSessionsRouter from "./routes/workout_sessions.js";
import workoutStepLogRouter from "./routes/workout_step_logs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressEjsLayouts);
app.set("layout", "./layouts/pageShell");

app.use(
	session({
		secret: "your-secret-key",
		resave: false,
		saveUninitialized: false,
	}),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));
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

app.use((err, _req, res, _next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

app.listen(port, () => {
	console.log("Listen on http://localhost:" + port);
});
