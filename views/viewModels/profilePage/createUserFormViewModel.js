/**
 * @typedef {import("../../../middlewares/validateRequestBody.js").ValidationErrors} ValidationErrors
 *
 * @typedef {object} CreateUserFormState
 * @property {Record<string, unknown>} [values] Submitted HTTP field values.
 * @property {ValidationErrors} [errors] Errors prepared by validation middleware.
 * @property {boolean} [open] Whether the modal should open after rendering.
 */

/**
 * Maps optional submission state onto the stable create-profile form contract.
 * Raw values are accepted only when they are strings; EJS escapes them when
 * rendering the corresponding controls.
 *
 * @param {CreateUserFormState} [state]
 */
export default function createUserFormViewModel({
	values = {},
	errors = { fieldErrors: {}, formErrors: [] },
	open = false,
} = {}) {
	/** @type {Record<string, unknown>} */
	const submittedValues = values && typeof values === "object" ? values : {};
	/** @param {string} name */
	const valueFor = name =>
		typeof submittedValues[name] === "string" ? submittedValues[name] : "";
	/** @param {string} name */
	const errorFor = name => errors.fieldErrors?.[name] ?? null;

	return {
		modal: {
			id: "createUserModal",
			title: "Create profile",
			openOnLoad: open,
		},
		form: {
			id: "create-user-form",
			heading: "Create profile",
			description: "Set up the profile used for programs and workout history.",
			action: "/users",
		},
		fields: [
			{
				id: "profile-name-input",
				name: "name",
				label: "Name",
				control: "input",
				type: "text",
				required: true,
				hint: "The name displayed throughout the app.",
				attributes: { autocomplete: "name", maxlength: 100 },
				value: valueFor("name"),
				error: errorFor("name"),
			},
			{
				id: "profile-date-of-birth-input",
				name: "dob",
				label: "Date of birth",
				control: "input",
				type: "date",
				required: true,
				hint: "Used as personal training context.",
				attributes: { autocomplete: "bday" },
				value: valueFor("dob"),
				error: errorFor("dob"),
			},
			{
				id: "profile-health-notes-input",
				name: "anamnesis",
				label: "Health notes",
				control: "textarea",
				hint: "Add relevant injuries, conditions, or movement limitations.",
				attributes: {
					rows: 5,
					maxlength: 1000,
					placeholder: "Describe any relevant health information...",
				},
				value: valueFor("anamnesis"),
				error: errorFor("anamnesis"),
			},
		],
		formErrors: errors.formErrors ?? [],
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Create profile" },
		},
	};
}
