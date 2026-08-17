export function initializeMuscleRoleForm(root = document) {
	const addButton = root.querySelector("#add-muscle-role-relation");
	const list = root.querySelector("#muscle-role-list");
	const muscleSelect = root.querySelector("#muscle-select");
	const muscleRoleSelect = root.querySelector("#muscle-role-select");
	const muscleMessage = root.querySelector("#muscle-role-list-message");

	if (
		!addButton ||
		!list ||
		!muscleSelect ||
		!muscleRoleSelect ||
		!muscleMessage
	) {
		return;
	}

	addButton.addEventListener("click", () => {
		const index = Array.from(list.querySelectorAll("li")).length;

		const muscleId = muscleSelect.value;
		const muscleName = muscleSelect.options[muscleSelect.selectedIndex].text;

		const muscleRoleId = muscleRoleSelect.value;
		const muscleRoleName =
			muscleRoleSelect.options[muscleRoleSelect.selectedIndex].text;

		if (!muscleId || !muscleRoleId) return;

		const item = document.createElement("li");
		item.className = "musclePerformingListItem";

		muscleMessage.textContent = `${index + 1} muscle relation(s) added`;

		const summary = document.createElement("p");
		summary.textContent = `${muscleName} (${muscleRoleName})`;

		const muscleInput = document.createElement("input");
		muscleInput.type = "hidden";
		muscleInput.name = `muscleGroup[${index}][muscleId]`;
		muscleInput.value = muscleId;

		const roleInput = document.createElement("input");
		roleInput.type = "hidden";
		roleInput.name = `muscleGroup[${index}][muscleRoleId]`;
		roleInput.value = muscleRoleId;

		const removeButton = document.createElement("button");
		removeButton.type = "button";
		removeButton.textContent = "X";
		removeButton.className = "simple-button";
		removeButton.addEventListener("click", () => {
			item.remove();
			const listSize = Array.from(list.querySelectorAll("li")).length;
			muscleMessage.textContent =
				listSize === 0
					? "No muscle relation found"
					: `${Array.from(list.querySelectorAll("li")).length} muscle relation(s) added`;
		});

		item.append(summary, muscleInput, roleInput, removeButton);
		list.appendChild(item);
	});
}

initializeMuscleRoleForm();
