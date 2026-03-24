import { users } from '@auth/users/_schema/users';
import { studentStatuses } from '@registry/student-statuses/_schema/studentStatuses';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { letterRecipients } from './letterRecipients';
import { letters } from './letters';
import { letterTemplates } from './letterTemplates';

export const letterTemplatesRelations = relations(
	letterTemplates,
	({ one, many }) => ({
		creator: one(users, {
			fields: [letterTemplates.createdBy],
			references: [users.id],
		}),
		letters: many(letters),
		recipients: many(letterRecipients),
	})
);

export const letterRecipientsRelations = relations(
	letterRecipients,
	({ one }) => ({
		template: one(letterTemplates, {
			fields: [letterRecipients.templateId],
			references: [letterTemplates.id],
		}),
	})
);

export const lettersRelations = relations(letters, ({ one }) => ({
	template: one(letterTemplates, {
		fields: [letters.templateId],
		references: [letterTemplates.id],
	}),
	student: one(students, {
		fields: [letters.stdNo],
		references: [students.stdNo],
	}),
	recipient: one(letterRecipients, {
		fields: [letters.recipientId],
		references: [letterRecipients.id],
	}),
	status: one(studentStatuses, {
		fields: [letters.statusId],
		references: [studentStatuses.id],
	}),
	creator: one(users, {
		fields: [letters.createdBy],
		references: [users.id],
	}),
}));
