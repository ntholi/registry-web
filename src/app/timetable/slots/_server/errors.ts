export interface OverflowOption {
	venueId: string;
	venueName: string;
	capacity: number;
}

export class TimetablePlanningError extends Error {
	readonly digest?: string;
	readonly allocationId?: number;
	readonly canAllowOverflow: boolean;
	readonly overflowOptions: OverflowOption[];

	constructor(
		message: string,
		allocationId?: number,
		overflowOptions?: OverflowOption[]
	) {
		const canAllowOverflow = message.includes('NO_VENUE_CAPACITY:');
		const cleanMessage = message.replace('NO_VENUE_CAPACITY:', '');
		const userMessage = allocationId
			? `Unable to allocate slot for allocation ${allocationId}. ${cleanMessage}`
			: cleanMessage;
		super(userMessage);
		this.name = 'TimetablePlanningError';
		this.allocationId = allocationId;
		this.canAllowOverflow = canAllowOverflow;
		this.overflowOptions = overflowOptions ?? [];
	}
}
