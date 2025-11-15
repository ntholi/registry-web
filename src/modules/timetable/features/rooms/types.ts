import type { rooms } from '@/core/database';

export type RoomWithRelations = typeof rooms.$inferSelect & {
	type: {
		id: number;
		name: string;
		description: string | null;
	};
	roomSchools: {
		school: {
			id: number;
			code: string;
			name: string;
		};
	}[];
};
