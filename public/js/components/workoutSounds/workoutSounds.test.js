import assert from "node:assert/strict";
import test from "node:test";

import {
	WORKOUT_SOUND_STORAGE_KEY,
	PENDING_WORKOUT_COMPLETION_KEY,
	initializeWorkoutSounds,
	persistWorkoutSoundPreference,
	playWorkoutCompletionSound,
	readWorkoutSoundPreference,
} from "./workoutSounds.js";

class StorageFake {
	values = new Map();

	getItem(key) {
		return this.values.get(key) ?? null;
	}

	setItem(key, value) {
		this.values.set(key, String(value));
	}

	removeItem(key) {
		this.values.delete(key);
	}
}

function createAudioContextFactory({ state = "running", resumeFails = false } = {}) {
	const oscillator = {
		frequency: {
			setValueAtTime() {},
		},
		connect() {},
		startAt: null,
		stopAt: null,
		start(value) {
			this.startAt = value;
		},
		stop(value) {
			this.stopAt = value;
		},
	};
	const gain = {
		gain: {
			setValueAtTime() {},
			exponentialRampToValueAtTime() {},
		},
		connect() {},
	};
	const context = {
		currentTime: 10,
		state,
		destination: {},
		createOscillator: () => oscillator,
		createGain: () => gain,
		resume: async () => {
			if (resumeFails) throw new Error("autoplay blocked");
			context.state = "running";
		},
	};

	return { context, oscillator, factory: () => context };
}

test("workout sound preference is opt-in and storage failures are safe", () => {
	const storage = new StorageFake();
	assert.equal(readWorkoutSoundPreference(storage), false);
	assert.equal(persistWorkoutSoundPreference(true, storage), true);
	assert.equal(storage.getItem(WORKOUT_SOUND_STORAGE_KEY), "enabled");
	assert.equal(readWorkoutSoundPreference(storage), true);
	assert.equal(persistWorkoutSoundPreference(false, storage), false);
	assert.equal(readWorkoutSoundPreference(storage), false);

	const failingStorage = {
		getItem() {
			throw new Error("storage unavailable");
		},
		setItem() {
			throw new Error("storage unavailable");
		},
	};
	assert.equal(readWorkoutSoundPreference(failingStorage), false);
	assert.equal(persistWorkoutSoundPreference(true, failingStorage), true);
});

test("completion cue uses one short playback and swallows autoplay failures", async () => {
	const first = createAudioContextFactory({ state: "suspended" });
	assert.equal(
		await playWorkoutCompletionSound({ audioContextFactory: first.factory }),
		true,
	);
	assert.equal(first.oscillator.startAt, 10);
	assert.equal(first.oscillator.stopAt, 10.24);

	const blocked = createAudioContextFactory({ state: "suspended", resumeFails: true });
	assert.equal(
		await playWorkoutCompletionSound({ audioContextFactory: blocked.factory }),
		false,
	);
	assert.equal(
		await playWorkoutCompletionSound({
			audioContextFactory: () => {
				throw new Error("unsupported");
			},
		}),
		false,
	);
});

test("completion sound only consumes a matching recent finish marker", async () => {
	const localStorage = new StorageFake();
	const sessionStorage = new StorageFake();
	const finishForm = {
		dataset: { workoutSessionId: "42" },
		listeners: new Map(),
		addEventListener(type, listener) {
			this.listeners.set(type, listener);
		},
	};
	const submissionRoot = {
		querySelector: () => null,
		querySelectorAll: () => [finishForm],
	};

	initializeWorkoutSounds(submissionRoot, {
		localStorage,
		sessionStorage,
		now: () => 1000,
	});
	finishForm.listeners.get("submit")();
	assert.match(
		sessionStorage.getItem(PENDING_WORKOUT_COMPLETION_KEY) ?? "",
		/"id":"42"/,
	);

	const finishedWorkout = { dataset: { workoutSessionId: "42" } };
	const sound = createAudioContextFactory();
	const finishedRoot = {
		querySelector(selector) {
			return selector.includes('data-workout-state="finished"')
				? finishedWorkout
				: null;
		},
		querySelectorAll: () => [],
	};
	persistWorkoutSoundPreference(true, localStorage);
	initializeWorkoutSounds(finishedRoot, {
		localStorage,
		sessionStorage,
		audioContextFactory: sound.factory,
		now: () => 1001,
	});
	await Promise.resolve();
	assert.equal(sessionStorage.getItem(PENDING_WORKOUT_COMPLETION_KEY), null);
	assert.equal(sound.oscillator.startAt, 10);
});
