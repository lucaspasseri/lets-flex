import * as usersRepository from "../users/repository.js";
import * as userMapper from "../users/mapper.js";

/**
 * @typedef {import("../users/users.types.js").FindUserInput} FindUserInput
 * @typedef {import("./profilePageData.types.js").ProfilePageData} ProfilePageData
 */

/**
 * @param {FindUserInput} input
 * @returns {Promise<ProfilePageData>}
 */

async function getProfilePageData({ userId }) {
	const [userRow, userRows] = await Promise.all([
		usersRepository.findById({ userId }),
		usersRepository.findAll(),
	]);

	return {
		currentUser: userRow ? userMapper.toLoggedUser(userRow) : null,
		users: userRows.map(userMapper.toLoggedUser),
	};
}

export default getProfilePageData;
