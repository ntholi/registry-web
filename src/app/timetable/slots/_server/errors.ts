export interface OverflowOption {
	venueId: string;
	venueName: string;
	capacity: number;
}

export interface AllocationInfo {
	id: number;
	moduleCode: string;
	moduleName: string;
}

export class TimetablePlanningError extends Error {
	readonly digest?: string;
	readonly allocationId?: number;
	readonly allocationInfo?: AllocationInfo;
	readonly canAllowOverflow: boolean;
	readonly overflowOptions: OverflowOption[];

	constructor(
		message: string,
		allocationInfo?: AllocationInfo,
		overflowOptions?: OverflowOption[]
	) {
		const canAllowOverflow = message.includes('NO_VENUE_CAPACITY:');
		const cleanMessage = message.replace('NO_VENUE_CAPACITY:', '');
		const userMessage = allocationInfo
			? `Unable to allocate slot for ${allocationInfo.moduleCode} (${allocationInfo.moduleName}). ${cleanMessage}`
			: cleanMessage;
		super(userMessage);
		this.name = 'TimetablePlanningError';
		this.allocationId = allocationInfo?.id;
		this.allocationInfo = allocationInfo;
		this.canAllowOverflow = canAllowOverflow;
		this.overflowOptions = overflowOptions ?? [];
	}
}
