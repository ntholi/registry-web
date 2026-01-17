import { relations } from 'drizzle-orm';
import {
	graduationClearance,
	graduationDates,
	graduationRequestReceipts,
	studentPrograms,
} from '@/core/database';
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
