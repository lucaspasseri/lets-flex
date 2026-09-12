import { initializeSearchAndFiltering } from "./searchAndFiltering.js";
import { initializeMuscleRoleForm } from "./manageMuscleRoleFormField.js";
import { initializeCreateSessionForm } from "./manageCreateSessionForm.js";
import { initializeDeleteExerciseForm } from "./configureDeleteExerciseFormAction.js";
import { initializeUpdateExerciseForm } from "./configureUpdateExerciseForm.js";
import { initializeUpdateSessionForm } from "./configureUpdateSessionForm.js";
import { initializeDeleteSessionForm } from "./configureDeleteSessionFormAction.js";
import { initializeVariantCreateForm } from "./configureVariantCreateForm.js";
import { createBrowserTranslator } from "../../i18n.js";

const libraryPage = document.querySelector("[data-library-page]");
const translate = createBrowserTranslator(document);
const createExerciseForm = document.querySelector("[data-create-exercise-form]");
const createSessionForm = document.querySelector("[data-create-session-form]");
const deleteExerciseForm = document.querySelector("[data-delete-exercise-form]");
const updateExerciseForm = document.querySelector("[data-update-exercise-form]");
const updateSessionForm = document.querySelector("[data-update-session-form]");
const deleteSessionForm = document.querySelector("[data-delete-session-form]");
const variantCreateForm = document.querySelector("[data-variant-create-form]");

if (libraryPage) initializeSearchAndFiltering(libraryPage);
if (createExerciseForm) initializeMuscleRoleForm(createExerciseForm, translate);
if (updateExerciseForm) initializeMuscleRoleForm(updateExerciseForm, translate);
if (createSessionForm) initializeCreateSessionForm(createSessionForm, translate);
if (updateSessionForm) initializeCreateSessionForm(updateSessionForm, translate);
if (libraryPage && deleteExerciseForm)
	initializeDeleteExerciseForm(libraryPage, deleteExerciseForm);
if (libraryPage && updateExerciseForm)
	initializeUpdateExerciseForm(libraryPage, updateExerciseForm);
if (libraryPage && updateSessionForm)
	initializeUpdateSessionForm(libraryPage, updateSessionForm);
if (libraryPage && deleteSessionForm)
	initializeDeleteSessionForm(libraryPage, deleteSessionForm);
if (variantCreateForm) initializeVariantCreateForm(variantCreateForm);
