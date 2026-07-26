import * as usersRepository from "../users/repository.js";
import * as userMapper from "../users/mapper.js";

async function getProfilePageData({ userId }) {
	const [user, userArr] = await Promise.all([
		usersRepository.findById({ userId }),
		usersRepository.findAll(),
	]);

	return {
		user: user && userMapper.toLoggedUser(user),
		userArr: userArr.length && userArr.map(userMapper.toLoggedUser),
	};
}

export default getProfilePageData;
