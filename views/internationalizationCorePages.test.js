import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import ejs from "ejs";
import { i18n } from "../src/infrastructure/i18n/i18n.js";
import { createWorkoutHistoryListPageViewModel } from "./viewModels/workoutHistoryPage/createWorkoutHistoryPageViewModel.js";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);
const portuguese = i18n.getFixedT("pt-BR");

test("core account and history pages render application copy in Portuguese", async () => {
	const login = await renderFile(path.resolve("views/login.ejs"), {
		t: portuguese,
		csrfToken: "test-token",
		returnTo: "/",
		googleAuthUrl: "/auth/google",
		email: "member@example.com",
		errors: [],
		activeTab: "signin",
	});
	assert.match(login, /Seu espaço de treino/);
	assert.match(login, /Continuar com o Google/);
	assert.match(login, /Entrar no Let(?:&#39;|')s Flex/);
	assert.doesNotMatch(login, />Your training workspace</);

	const profile = await renderFile(path.resolve("views/profile.ejs"), {
		t: portuguese,
		currentUser: { id: 1, name: "Member", email: "member@example.com", role: "user" },
		authenticationMethods: {
			password: { label: "Senha", status: "Conectado", showAddForm: false },
			google: { label: "Google", status: "Não vinculada", email: null, action: null },
		},
		csrfToken: "test-token",
	});
	assert.match(profile, /Métodos de autenticação/);
	assert.match(profile, /Sair com segurança/);

	const historyViewModel = createWorkoutHistoryListPageViewModel({
		page: {},
		translate: portuguese,
		filters: { programId: null, fromDate: null, toDate: null },
		data: {
			currentUser: {
				id: 1,
				name: "Member",
				role: "user",
				dateOfBirth: null,
				anamnesis: null,
			},
			programs: [],
			history: { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 },
		},
	});
	const history = await renderFile(path.resolve("views/history/index.ejs"), {
		...historyViewModel,
		t: portuguese,
	});
	assert.match(history, /Histórico de treinos/);
	assert.match(history, /Encontre um treino/);
});
