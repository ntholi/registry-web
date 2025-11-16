import { relations } from 'drizzle-orm';
import { schools, semesterModules, terms } from '@/modules/academic/database';
import { users } from '@/modules/auth/database';
import { lecturerAllocations } from './schema/lecturer-allocations';
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

export const lecturerAllocationsRelations = relations(
	lecturerAllocations,
	({ one }) => ({
		user: one(users, {
			fields: [lecturerAllocations.userId],
			references: [users.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [lecturerAllocations.semesterModuleId],
			references: [semesterModules.id],
		}),
		term: one(terms, {
			fields: [lecturerAllocations.termId],
			references: [terms.id],
		}),
	})
);
