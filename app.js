import express from "express";
import pool from "./db/pool.js";

const hostname = "127.0.0.1";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", async (_req, res) => {
	const { rows } = await pool.query("SELECT * FROM movement_patterns");

	console.log({ rows });

	res.send("Hello world!");
});

app.use((err, req, res, next) => {
	console.error(err.stack); // Log the error for debugging
	res.status(500).send("Something broke!"); // Send a generic response
});

app.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
