import * as accordion from "./accordion/index.js";
import * as tabs from "./tabs/index.js";

export function initializeComponents(root = document) {
	accordion.initialize(root);
	tabs.initialize(root);
}
