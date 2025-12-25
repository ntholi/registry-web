import { users } from '@auth/_database';
import { terms } from '@registry/_database';
import {
	bigint,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { semesterModules } from './modules';

export const attendanceStatus = pgEnum('attendance_status', [
	'present',
	'absent',
	'late',
	'excused',
	'na',
]);

export type AttendanceStatus = (typeof attendanceStatus.enumValues)[number];

export const attendance = pgTable(
	'attendance',
	{
		id: serial().primaryKey(),
		assignedModuleId: integer().notNull(),
		stdNo: bigint({ mode: 'number' }).notNull(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		weekNumber: integer().notNull(),
		status: attendanceStatus().notNull().default('na'),
		markedBy: text().references(() => users.id, { onDelete: 'set null' }),
		markedAt: timestamp().defaultNow(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		uniqueAttendance: unique().on(
			table.stdNo,
			table.termId,
			table.semesterModuleId,
			table.weekNumber
		),
		stdNoIdx: index('fk_attendance_std_no').on(table.stdNo),
		termIdIdx: index('fk_attendance_term_id').on(table.termId),
		semesterModuleIdIdx: index('fk_attendance_semester_module_id').on(
			table.semesterModuleId
		),
		weekNumberIdx: index('idx_attendance_week_number').on(table.weekNumber),
		assignedModuleIdIdx: index('fk_attendance_assigned_module_id').on(
			table.assignedModuleId
		),
	})
);
