const addButton = document.getElementById("add-muscle-role-relation");
const list = document.getElementById("muscle-role-list");

const muscleSelect = document.getElementById("muscle-select");
const muscleRoleSelect = document.getElementById("muscle-role-select");
const muscleMessage = document.getElementById("muscle-role-list-message");

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
