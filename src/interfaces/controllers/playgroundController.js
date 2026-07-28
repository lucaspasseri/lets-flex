import asyncHandler from "../../../utils/asyncControllerHandler.js";

async function show(req, res) {
	const { component } = req.params;

	const path = "playground/";

	console.log({ component });

	res.render(component ? path + component : path + "test", {
		layout: "./layouts/playgroundShell",
	});
}

export const playgroundController = {
	show: asyncHandler(show),
};
