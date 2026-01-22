export class TimetablePlanningError extends Error {
	readonly digest?: string;

	constructor(message: string, allocationId?: number) {
		const userMessage = allocationId
			? `Unable to allocate slot for allocation ${allocationId}. ${message}`
			: message;
		super(userMessage);
		this.name = 'TimetablePlanningError';
	}
}
