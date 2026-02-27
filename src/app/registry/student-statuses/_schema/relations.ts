import { users } from '@auth/users/_schema/users';
import { studentSemesters } from '@registry/students/_schema/studentSemesters';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { studentStatusApprovals } from './studentStatusApprovals';
import { studentStatuses } from './studentStatuses';

export const studentStatusesRelations = relations(
	studentStatuses,
	({ one, many }) => ({
		student: one(students, {
			fields: [studentStatuses.stdNo],
			references: [students.stdNo],
		}),
		semester: one(studentSemesters, {
			fields: [studentStatuses.semesterId],
			references: [studentSemesters.id],
		}),
		creator: one(users, {
			fields: [studentStatuses.createdBy],
			references: [users.id],
		}),
		approvals: many(studentStatusApprovals),
	})
);

export const studentStatusApprovalsRelations = relations(
	studentStatusApprovals,
	({ one }) => ({
		application: one(studentStatuses, {
			fields: [studentStatusApprovals.applicationId],
			references: [studentStatuses.id],
		}),
		responder: one(users, {
			fields: [studentStatusApprovals.respondedBy],
			references: [users.id],
		}),
	})
);
