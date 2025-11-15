import {
	index,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { schools } from '@/core/database/schema';
import { roomTypes as roomTypesTable } from './room-types';

export { roomTypes } from './room-types';

export const rooms = pgTable(
	'rooms',
	{
		id: serial().primaryKey(),
		name: text().notNull(),
		capacity: integer().notNull(),
		typeId: integer()
			.references(() => roomTypesTable.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		typeIdIdx: index('fk_rooms_type_id').on(table.typeId),
	})
);

export const roomSchools = pgTable(
	'room_schools',
	{
		roomId: integer()
			.references(() => rooms.id, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.roomId, table.schoolId] }),
		roomIdIdx: index('fk_room_schools_room_id').on(table.roomId),
		schoolIdIdx: index('fk_room_schools_school_id').on(table.schoolId),
	})
);
