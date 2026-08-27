import asyncHandler from "../../../utils/asyncControllerHandler.js";

const components = new Set(["accordion", "button", "form", "modal", "tabs", "test"]);

async function show(req, res) {
	const component = req.params.component ?? "test";
	if (!components.has(component)) {
		res.status(404).send("Not found");
		return;
	}

	res.render(`playground/${component}`, {
		layout: "./layouts/playgroundShell",
	});
}

export const playgroundController = {
	show: asyncHandler(show),
};
