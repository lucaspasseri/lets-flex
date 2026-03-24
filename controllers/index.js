import * as movementsPatternsDb from "../db/movement_patterns/index.js";

async function getIndex(_req, res) {
	const movements = await movementsPatternsDb.getAllMovementPatterns();

	res.render("index", { data: { movements, title: "Let's Flex!" } });
}

export { getIndex };
