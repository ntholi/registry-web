import {
	index,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { schools } from '@/modules/academic/database';

export const roomTypes = pgTable('room_types', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});

export const rooms = pgTable(
	'rooms',
	{
		id: serial().primaryKey(),
		name: text().notNull().unique(),
		capacity: integer().notNull(),
		typeId: integer()
			.references(() => roomTypes.id, { onDelete: 'cascade' })
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
