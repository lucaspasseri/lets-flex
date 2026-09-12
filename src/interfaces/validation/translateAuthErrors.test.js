import assert from "node:assert/strict";
import test from "node:test";
import translateAuthErrors from "./translateAuthErrors.js";

test("auth validation messages use the active locale while unknown issues remain unchanged", () => {
	const response = /** @type {*} */ ({
		locals: {
			t(key, options) {
				return (
					{
						"auth.validEmail": "Digite um endereço de e-mail válido.",
						"auth.passwordsMatch": "As senhas devem ser iguais.",
					}[key] ?? options.defaultValue
				);
			},
		},
	});

	assert.deepEqual(
		translateAuthErrors(response, [
			{ message: "Enter a valid email address." },
			{ message: "Passwords must match." },
			{ message: "An implementation detail." },
		]),
		[
			"Digite um endereço de e-mail válido.",
			"As senhas devem ser iguais.",
			"An implementation detail.",
		],
	);
});
