import assert from "node:assert/strict";
import test from "node:test";
import ejs from "ejs";
import path from "node:path";
import { i18n } from "../../../../src/infrastructure/i18n/i18n.js";

const componentsPath = path.resolve("views/partials/shared/components");
const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);

test("shared controls render localized Portuguese defaults and generic actions", async () => {
	const translate = i18n.getFixedT("pt-BR");
	const field = await renderFile(path.join(componentsPath, "form/field.ejs"), {
		language: "pt-BR",
		t: translate,
		field: {
			id: "program-name",
			name: "name",
			label: "Nome",
			control: "select",
			required: true,
			options: [],
		},
	});
	const button = await renderFile(path.join(componentsPath, "button/button.ejs"), {
		language: "pt-BR",
		t: translate,
		button: { labelKey: "actions.cancel", label: "Cancel" },
	});

	assert.match(field, /Obrigatório/);
	assert.match(field, /Selecione uma opção\.\.\./);
	assert.match(button, /Cancelar/);
});

test("shared modal, tabs, and feedback defaults follow the active locale", async () => {
	const translate = i18n.getFixedT("pt-BR");
	const modal = await renderFile(path.join(componentsPath, "modal/modal.ejs"), {
		language: "pt-BR",
		t: translate,
		modal: { id: "test-modal", showTitle: false },
	});
	const tabs = await renderFile(path.join(componentsPath, "tabs/tabs.ejs"), {
		language: "pt-BR",
		t: translate,
		tabs: { id: "test-tabs", tabArr: [{ heading: "Primeira", tabpanel: "Conteúdo" }] },
	});
	const feedback = await renderFile(path.join(componentsPath, "pageFeedback.ejs"), {
		language: "pt-BR",
		t: translate,
		pageFeedback: { title: "Falha", message: "Tente novamente." },
	});

	assert.match(modal, /aria-label="Modal genérico"/);
	assert.match(modal, /aria-label="Fechar modal"/);
	assert.match(tabs, /aria-label="Abas"/);
	assert.match(feedback, />Ação não concluída</);
});
