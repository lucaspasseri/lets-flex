import { createApp } from "./app.js";

const port = process.env.PORT || 3000;
console.log("[application] startup started");
const app = createApp();

app.listen(port, () => {
	console.log(`[application] startup completed: listening on http://localhost:${port}`);
});
