import { initializeSearchAndFiltering } from "./searchAndFiltering.js";
import { initializeMuscleRoleForm } from "./manageMuscleRoleFormField.js";
import { initializeCreateSessionForm } from "./manageCreateSessionForm.js";
import { initializeDeleteExerciseForm } from "./configureDeleteExerciseFormAction.js";

const libraryPage = document.querySelector("[data-library-page]");
const createExerciseForm = document.querySelector("[data-create-exercise-form]");
const createSessionForm = document.querySelector("[data-create-session-form]");
const deleteExerciseForm = document.querySelector("[data-delete-exercise-form]");

if (libraryPage) initializeSearchAndFiltering(libraryPage);
if (createExerciseForm) initializeMuscleRoleForm(createExerciseForm);
if (createSessionForm) initializeCreateSessionForm(createSessionForm);
if (libraryPage && deleteExerciseForm) initializeDeleteExerciseForm(libraryPage, deleteExerciseForm);
