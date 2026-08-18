export default function createUserFormViewModel() {
	return {
		modal: {
			id: "createUserModal",
			title: "Create profile",
		},
		form: {
			id: "create-user-form",
			heading: "Create profile",
			description:
				"Set up the profile used for programs and workout history.",
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
			},
		],
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Create profile" },
		},
	};
}
