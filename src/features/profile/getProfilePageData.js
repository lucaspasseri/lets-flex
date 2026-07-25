import * as usersRepository from "../users/repository.js";
import * as userMapper from "../users/mapper.js";

async function getProfilePageData({ userId }) {
	const [user, userArr] = await Promise.all([
		usersRepository.findById({ userId }),
		usersRepository.findAll(),
	]);

	const output = {
		user: user && userMapper.toLoggedUser(user),
		userArr: userArr.length && userArr.map(userMapper.toLoggedUser),
	};

	return output;
}

export default getProfilePageData;
