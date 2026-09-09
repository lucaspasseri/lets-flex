import * as authIdentitiesRepository from "./authIdentitiesRepository.js";

/**
 * Returns a presentation-neutral summary of credentials attached to one user.
 * @param {{userId: number}} input
 */
export default async function getAuthenticationMethods({ userId }) {
	const identities = await authIdentitiesRepository.findByUserId({ userId });
	const local = identities.find((identity) => identity.provider === "local");
	const google = identities.find((identity) => identity.provider === "google");
	return {
		password: { connected: Boolean(local) },
		google: {
			connected: Boolean(google),
			email: google?.provider_email ?? null,
		},
	};
}
