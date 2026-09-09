import * as accordion from "./accordion/index.js";
import * as tabs from "./tabs/index.js";
import * as modal from "./modal/index.js";
import * as workoutTracker from "./workoutTracker/index.js";
import * as adherenceChart from "./adherenceChart/index.js";
import * as applicationChrome from "./applicationChrome/index.js";

export function initializeComponents(root = document) {
	applicationChrome.initialize(root);
	accordion.initialize(root);
	tabs.initialize(root);
	modal.initialize(root);
	workoutTracker.initialize(root);
	adherenceChart.initialize(root);
}
