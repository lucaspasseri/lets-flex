import * as accordion from "./accordion/index.js";
import * as tabs from "./tabs/index.js";
import * as modal from "./modal/index.js";
import * as workoutTracker from "./workoutTracker/index.js";

export function initializeComponents(root = document) {
	accordion.initialize(root);
	tabs.initialize(root);
	modal.initialize(root);
	workoutTracker.initialize(root);
}
