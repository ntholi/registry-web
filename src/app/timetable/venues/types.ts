import type { venues } from '@/core/database';

export type VenueWithRelations = typeof venues.$inferSelect & {
	type: {
		id: number;
		name: string;
		description: string | null;
	};
	venueSchools: {
		school: {
			id: number;
			code: string;
			name: string;
		};
	}[];
};
