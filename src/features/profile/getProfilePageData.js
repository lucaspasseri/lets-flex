import * as usersRepository from "../users/repository.js";
import * as userMapper from "../users/mapper.js";

/**
 * @typedef {import("../users/users.types.js").FindUserInput} FindUserInput
 * @typedef {import("../users/users.types.js").User} User
 */

/**
 * @typedef {object} ProfilePageData
 * @property {User | null} user
 * @property {User[]} userArr
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
		user: userRow ? userMapper.toLoggedUser(userRow) : null,
		userArr: userRows.map(userMapper.toLoggedUser),
	};
}

export default getProfilePageData;
