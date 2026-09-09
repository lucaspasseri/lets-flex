/** @param {{password: {connected: boolean}, google: {connected: boolean, email: string | null}}} methods */
export default function createAuthenticationMethodsViewModel(methods) {
	const hasPassword = methods.password.connected;
	const hasGoogle = methods.google.connected;
	return {
		password: {
			label: "Password",
			status: hasPassword ? "Connected" : "Not set",
			showAddForm: !hasPassword,
		},
		google: {
			label: "Google",
			status: hasGoogle ? "Connected" : "Not linked",
			email: methods.google.email,
			action: !hasGoogle
				? { label: "Link Google account", path: "/auth/google/link" }
				: hasPassword
					? { label: "Change Google account", path: "/auth/google/replace" }
					: null,
		},
	};
}
