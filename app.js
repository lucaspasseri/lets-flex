import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import programsRouter from "./routes/programs.js";
import cyclesRouter from "./routes/cycles.js";
import sessionRouter from "./routes/sessions.js";
import sessionStepsRouter from "./routes/session_steps.js";
import exercisesRouter from "./routes/exercises.js";
import exerciseMusclesRouter from "./routes/exercise_muscles.js";
import exerciseVariantsRouter from "./routes/exercise_variants.js";
import profileRouter from "./routes/profile.js";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
	session({
		secret: "your-secret-key",
		resave: false,
		saveUninitialized: false,
	}),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/programs", programsRouter);
app.use("/cycles", cyclesRouter);
app.use("/sessions", sessionRouter);
app.use("/session_steps", sessionStepsRouter);
app.use("/exercises", exercisesRouter);
app.use("/exercise_muscles", exerciseMusclesRouter);
app.use("/exercise_variants", exerciseVariantsRouter);
app.use("/profile", profileRouter);

app.use((err, _req, res, _next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

app.listen(port, () => {
	console.log("Listen on http://localhost:" + port);
});
