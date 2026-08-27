import js from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import promise from "eslint-plugin-promise";

export default [
	{
		ignores: ["node_modules/**", "coverage/**"],
	},
	js.configs.recommended,
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.node,
		},
		plugins: {
			import: importPlugin,
			promise,
		},
		rules: {
			"no-console": "off",
			"no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"import/no-duplicates": "error",
			"promise/param-names": "error",
		},
	},
	{
		files: ["public/js/**/*.js"],
		languageOptions: {
			globals: globals.browser,
		},
	},
];
