import { relations } from 'drizzle-orm';
import { schools } from '@/core/database/schema';
import { roomSchools, rooms, roomTypes } from './schema/rooms';

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
	rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ many, one }) => ({
	type: one(roomTypes, {
		fields: [rooms.typeId],
		references: [roomTypes.id],
	}),
	roomSchools: many(roomSchools),
}));

export const roomSchoolsRelations = relations(roomSchools, ({ one }) => ({
	room: one(rooms, {
		fields: [roomSchools.roomId],
		references: [rooms.id],
	}),
	school: one(schools, {
		fields: [roomSchools.schoolId],
		references: [schools.id],
	}),
}));
