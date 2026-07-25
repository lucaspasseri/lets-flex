import { format } from "date-fns";

export function toLoggedUser({ id, name, date_of_birth, anamnesis }) {
	const output = {
		id,
		name,
		dob: format(date_of_birth, "dd/MM/yyyy"),
		anamnesis,
	};

	return output;
}
