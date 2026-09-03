export default class FakeEmailService {
	constructor() {
		this.deliveries = [];
	}

	async sendPasswordReset(message) {
		this.deliveries.push(structuredClone(message));
	}

	clear() {
		this.deliveries.length = 0;
	}
}
