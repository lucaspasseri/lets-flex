import createViewModelTranslator from "../translate.js";

/** @param {{password: {connected: boolean}, google: {connected: boolean, email: string | null}}} methods @param {Function} [translate] */
export default function createAuthenticationMethodsViewModel(methods, translate) {
	const t = createViewModelTranslator(translate);
	const hasPassword = methods.password.connected;
	const hasGoogle = methods.google.connected;
	return {
		password: {
			label: t("auth.password", { defaultValue: "Password" }),
			status: hasPassword
				? t("profile.connected", { defaultValue: "Connected" })
				: t("profile.notSet", { defaultValue: "Not set" }),
			showAddForm: !hasPassword,
		},
		google: {
			label: "Google",
			status: hasGoogle
				? t("profile.connected", { defaultValue: "Connected" })
				: t("profile.notLinked", { defaultValue: "Not linked" }),
			email: methods.google.email,
			action: !hasGoogle
				? {
						label: t("profile.linkGoogle", { defaultValue: "Link Google account" }),
						path: "/auth/google/link",
					}
				: hasPassword
					? {
							label: t("profile.changeGoogle", {
								defaultValue: "Change Google account",
							}),
							path: "/auth/google/replace",
						}
					: null,
		},
	};
}
