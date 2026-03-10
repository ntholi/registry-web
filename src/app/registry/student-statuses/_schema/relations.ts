import { users } from '@auth/users/_schema/users';
import { studentSemesters } from '@registry/students/_schema/studentSemesters';
import { students } from '@registry/students/_schema/students';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { studentStatusApprovals } from './studentStatusApprovals';
import { studentStatusAttachments } from './studentStatusAttachments';
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
		term: one(terms, {
			fields: [studentStatuses.termId],
			references: [terms.id],
		}),
		creator: one(users, {
			fields: [studentStatuses.createdBy],
			references: [users.id],
		}),
		attachments: many(studentStatusAttachments),
		approvals: many(studentStatusApprovals),
	})
);

export const studentStatusAttachmentsRelations = relations(
	studentStatusAttachments,
	({ one }) => ({
		application: one(studentStatuses, {
			fields: [studentStatusAttachments.applicationId],
			references: [studentStatuses.id],
		}),
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
