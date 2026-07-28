import * as accordion from "./accordion/index.js";

export function initializeComponents(root = document) {
	console.log(123);
	accordion.initialize(root);
}
