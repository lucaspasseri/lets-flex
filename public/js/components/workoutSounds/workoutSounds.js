import { createBrowserTranslator } from "../../i18n.js";

export const WORKOUT_SOUND_STORAGE_KEY = "lets-flex-workout-sounds";
export const PENDING_WORKOUT_COMPLETION_KEY = "lets-flex-pending-workout-completion";
const PENDING_COMPLETION_TTL_MS = 60_000;

const FALLBACK_MESSAGES = {
	workout: {
		soundEnabled: "Workout completion sound on.",
		soundDisabled: "Workout completion sound off.",
	},
};

/** @type {any} */
let activeOscillator = null;

/** @returns {Storage | null} */
function getStorage(name) {
	try {
		return globalThis?.[name] ?? null;
	} catch {
		return null;
	}
}

/** @param {Storage | null} [storage] @returns {boolean} */
export function readWorkoutSoundPreference(storage = getStorage("localStorage")) {
	if (!storage) return false;

	try {
		return storage.getItem(WORKOUT_SOUND_STORAGE_KEY) === "enabled";
	} catch {
		return false;
	}
}

/** @param {boolean} enabled @param {Storage | null} [storage] @returns {boolean} */
export function persistWorkoutSoundPreference(
	enabled,
	storage = getStorage("localStorage"),
) {
	if (!storage) return enabled;

	try {
		storage.setItem(WORKOUT_SOUND_STORAGE_KEY, enabled ? "enabled" : "disabled");
	} catch {
		// The preference still applies for this visit when persistence is unavailable.
	}

	return enabled;
}

/**
 * Plays a short two-note completion cue. Audio is best-effort and every browser/audio
 * failure is converted into a false result so it cannot interrupt workout navigation.
 * @param {{audioContextFactory?: () => any}} [dependencies]
 * @returns {Promise<boolean>}
 */
export async function playWorkoutCompletionSound(dependencies = {}) {
	try {
		activeOscillator?.stop();
	} catch {
		// An oscillator may already have stopped.
	}
	activeOscillator = null;

	try {
		const audioContextFactory =
			dependencies.audioContextFactory ?? getAudioContextFactory();
		if (!audioContextFactory) return false;

		const context = audioContextFactory();
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		const startAt = Number(context.currentTime) || 0;
		const endAt = startAt + 0.24;

		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(660, startAt);
		oscillator.frequency.setValueAtTime(880, startAt + 0.1);
		gain.gain.setValueAtTime(0.0001, startAt);
		gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
		oscillator.connect(gain);
		gain.connect(context.destination);
		oscillator.start(startAt);
		oscillator.stop(endAt);
		activeOscillator = oscillator;

		if (context.state === "suspended" && typeof context.resume === "function") {
			await context.resume();
		}
		return true;
	} catch {
		activeOscillator = null;
		return false;
	}
}

/**
 * Initializes the preference control and one-shot completion event bridge.
 * @param {Document | HTMLElement | any} [root]
 * @param {{localStorage?: Storage | null, sessionStorage?: Storage | null, audioContextFactory?: () => any, now?: () => number}} [dependencies]
 */
export function initializeWorkoutSounds(root = document, dependencies = {}) {
	const translate = createBrowserTranslator(root, FALLBACK_MESSAGES);
	const localStorage =
		dependencies.localStorage === undefined
			? getStorage("localStorage")
			: dependencies.localStorage;
	const sessionStorage =
		dependencies.sessionStorage === undefined
			? getStorage("sessionStorage")
			: dependencies.sessionStorage;
	const enabled = readWorkoutSoundPreference(localStorage);
	const preference = root.querySelector?.("[data-workout-sound-selector]");
	const option = preference?.querySelector?.("[data-workout-sound-option]");

	if (option) {
		option.checked = enabled;
		const status = preference.querySelector("[data-workout-sound-status]");
		updatePreferenceStatus(status, enabled, translate);
		option.addEventListener("change", () => {
			const nextEnabled = Boolean(option.checked);
			persistWorkoutSoundPreference(nextEnabled, localStorage);
			updatePreferenceStatus(status, nextEnabled, translate);
		});
	}

	root.querySelectorAll?.("[data-workout-finish-form]").forEach((form) => {
		if (form.dataset.workoutSoundInitialized === "true") return;
		form.dataset.workoutSoundInitialized = "true";
		form.addEventListener("submit", () => {
			writePendingCompletion(
				form.dataset.workoutSessionId,
				sessionStorage,
				dependencies.now,
			);
		});
	});

	const finishedWorkout = root.querySelector?.(
		'[data-workout-state="finished"][data-workout-session-id]',
	);
	if (
		!finishedWorkout ||
		!consumePendingCompletion(
			finishedWorkout.dataset.workoutSessionId,
			sessionStorage,
			dependencies.now,
		)
	)
		return;

	if (readWorkoutSoundPreference(localStorage)) {
		void playWorkoutCompletionSound({
			audioContextFactory: dependencies.audioContextFactory,
		});
	}
}

/** @returns {(() => any) | null} */
function getAudioContextFactory() {
	const AudioContextConstructor =
		globalThis?.AudioContext ?? globalThis?.webkitAudioContext;
	return typeof AudioContextConstructor === "function"
		? () => new AudioContextConstructor()
		: null;
}

/** @param {HTMLElement | null | undefined} status @param {boolean} enabled @param {Function} translate */
function updatePreferenceStatus(status, enabled, translate) {
	if (!status) return;
	status.textContent = translate(
		enabled ? "workout.soundEnabled" : "workout.soundDisabled",
	);
	status.hidden = false;
}

/** @param {string | undefined} workoutSessionId @param {Storage | null} storage @param {(() => number) | undefined} now */
function writePendingCompletion(workoutSessionId, storage, now = Date.now) {
	if (!workoutSessionId || !storage) return;

	try {
		storage.setItem(
			PENDING_WORKOUT_COMPLETION_KEY,
			JSON.stringify({ id: workoutSessionId, timestamp: now() }),
		);
	} catch {
		// Completion sound is optional when session storage is unavailable.
	}
}

/** @param {string | undefined} workoutSessionId @param {Storage | null} storage @param {(() => number) | undefined} now @returns {boolean} */
function consumePendingCompletion(workoutSessionId, storage, now = Date.now) {
	if (!workoutSessionId || !storage) return false;

	try {
		const raw = storage.getItem(PENDING_WORKOUT_COMPLETION_KEY);
		storage.removeItem(PENDING_WORKOUT_COMPLETION_KEY);
		if (!raw) return false;
		const pending = JSON.parse(raw);
		return (
			pending?.id === workoutSessionId &&
			Number.isFinite(pending.timestamp) &&
			now() - pending.timestamp <= PENDING_COMPLETION_TTL_MS
		);
	} catch {
		return false;
	}
}
