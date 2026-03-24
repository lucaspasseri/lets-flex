import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", async (_req, res) => {
	const { rows: movements } = await pool.query(
		"SELECT * FROM movement_patterns",
	);
	const { rows: goals } = await pool.query("SELECT * FROM goals");
	const { rows: step_types } = await pool.query(
		"SELECT * FROM movement_patterns",
	);

	res.render("index", { movements, goals, step_types });
});

app.use((err, req, res, next) => {
	console.error(err.stack); // Log the error for debugging
	res.status(500).send("Something broke!"); // Send a generic response
});

app.listen(port, () => {
	console.log("Listen on http://localhost:" + port);
});
