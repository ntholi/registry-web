import { graduationClearance } from '@registry/graduation-clearance/_schema/graduationClearance';
import { graduationDates } from '@registry/graduation-dates/_schema/graduationDates';
import { graduationRequestReceipts } from '@registry/graduation-request-receipts/_schema/graduationRequestReceipts';
import { studentPrograms } from '@registry/students/_schema/studentPrograms';
import { relations } from 'drizzle-orm';
import { graduationRequests } from './graduationRequests';

export const graduationRequestsRelations = relations(
	graduationRequests,
	({ one, many }) => ({
		studentProgram: one(studentPrograms, {
			fields: [graduationRequests.studentProgramId],
			references: [studentPrograms.id],
		}),
		graduationDate: one(graduationDates, {
			fields: [graduationRequests.graduationDateId],
			references: [graduationDates.id],
		}),
		graduationRequestReceipts: many(graduationRequestReceipts),
		graduationClearances: many(graduationClearance),
	})
);
