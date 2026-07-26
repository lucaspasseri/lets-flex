import { format } from "date-fns";

export function toLoggedUser(user) {
	return {
		id: user.id,
		name: user.name,
		dob: format(user.date_of_birth, "dd/MM/yyyy"),
		anamnesis: user.anamnesis,
	};
}
