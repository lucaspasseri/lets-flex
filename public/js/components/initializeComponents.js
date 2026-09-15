import * as accordion from "./accordion/index.js";
import * as tabs from "./tabs/index.js";
import * as modal from "./modal/index.js";
import * as workoutTracker from "./workoutTracker/index.js";
import * as adherenceChart from "./adherenceChart/index.js";
import * as applicationChrome from "./applicationChrome/index.js";
import { initializeMediaFallback } from "./mediaFallback/mediaFallback.js";
import { initializeFormSubmissionFeedback } from "./formSubmissionFeedback/formSubmissionFeedback.js";
import { initializeWorkoutSounds } from "./workoutSounds/workoutSounds.js";

export function initializeComponents(root = document) {
	applicationChrome.initialize(root);
	accordion.initialize(root);
	tabs.initialize(root);
	modal.initialize(root);
	initializeWorkoutSounds(root);
	initializeFormSubmissionFeedback(root);
	workoutTracker.initialize(root);
	adherenceChart.initialize(root);
	initializeMediaFallback(root);
}
