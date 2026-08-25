import { initializeSearchAndFiltering } from "./searchAndFiltering.js";
import { initializeMuscleRoleForm } from "./manageMuscleRoleFormField.js";
import { initializeCreateSessionForm } from "./manageCreateSessionForm.js";
import { initializeDeleteExerciseForm } from "./configureDeleteExerciseFormAction.js";
import { initializeUpdateExerciseForm } from "./configureUpdateExerciseForm.js";
import { initializeUpdateSessionForm } from "./configureUpdateSessionForm.js";
import { initializeArchiveSessionForm } from "./configureArchiveSessionForm.js";

const libraryPage = document.querySelector("[data-library-page]");
const createExerciseForm = document.querySelector("[data-create-exercise-form]");
const createSessionForm = document.querySelector("[data-create-session-form]");
const deleteExerciseForm = document.querySelector("[data-delete-exercise-form]");
const updateExerciseForm = document.querySelector("[data-update-exercise-form]");
const updateSessionForm = document.querySelector("[data-update-session-form]");
const archiveSessionForm = document.querySelector("[data-archive-session-form]");

if (libraryPage) initializeSearchAndFiltering(libraryPage);
if (createExerciseForm) initializeMuscleRoleForm(createExerciseForm);
if (updateExerciseForm) initializeMuscleRoleForm(updateExerciseForm);
if (createSessionForm) initializeCreateSessionForm(createSessionForm);
if (updateSessionForm) initializeCreateSessionForm(updateSessionForm);
if (libraryPage && deleteExerciseForm)
	initializeDeleteExerciseForm(libraryPage, deleteExerciseForm);
if (libraryPage && updateExerciseForm)
	initializeUpdateExerciseForm(libraryPage, updateExerciseForm);
if (libraryPage && updateSessionForm)
	initializeUpdateSessionForm(libraryPage, updateSessionForm);
if (libraryPage && archiveSessionForm)
	initializeArchiveSessionForm(libraryPage, archiveSessionForm);
