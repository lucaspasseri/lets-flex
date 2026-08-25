import createTabs from "./tabs.js";

export function initialize(root = document) {
	root.querySelectorAll("[data-tabs]").forEach((element) => createTabs(element));
}
