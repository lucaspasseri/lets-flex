import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { getAllMovementPatterns } from "./db/movement_patterns/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", async (_req, res) => {
	const movements = await getAllMovementPatterns();

	res.render("index", { movements });
});

app.use((err, req, res, next) => {
	console.error(err.stack); // Log the error for debugging
	res.status(500).send("Something broke!"); // Send a generic response
});

app.listen(port, () => {
	console.log("Listen on http://localhost:" + port);
});
