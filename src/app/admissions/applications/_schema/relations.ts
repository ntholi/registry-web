import { programs } from '@academic/schools/_schema/programs';
import { applicants } from '@admissions/applicants/_schema/applicants';
import { intakePeriods } from '@admissions/intake-periods/_schema/intakePeriods';
import { users } from '@auth/users/_schema/users';
import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import { relations } from 'drizzle-orm';
import { applicationNotes } from './applicationNotes';
import { applicationReceipts } from './applicationReceipts';
import { applicationStatusHistory } from './applicationStatusHistory';
import { applications } from './applications';

export const applicationsRelations = relations(
	applications,
	({ one, many }) => ({
		applicant: one(applicants, {
			fields: [applications.applicantId],
			references: [applicants.id],
		}),
		intakePeriod: one(intakePeriods, {
			fields: [applications.intakePeriodId],
			references: [intakePeriods.id],
		}),
		firstChoiceProgram: one(programs, {
			fields: [applications.firstChoiceProgramId],
			references: [programs.id],
			relationName: 'firstChoiceProgram',
		}),
		secondChoiceProgram: one(programs, {
			fields: [applications.secondChoiceProgramId],
			references: [programs.id],
			relationName: 'secondChoiceProgram',
		}),
		createdByUser: one(users, {
			fields: [applications.createdBy],
			references: [users.id],
		}),
		receipts: many(applicationReceipts),
		statusHistory: many(applicationStatusHistory),
		notes: many(applicationNotes),
	})
);

export const applicationReceiptsRelations = relations(
	applicationReceipts,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationReceipts.applicationId],
			references: [applications.id],
		}),
		receipt: one(paymentReceipts, {
			fields: [applicationReceipts.receiptId],
			references: [paymentReceipts.id],
		}),
	})
);

export const applicationStatusHistoryRelations = relations(
	applicationStatusHistory,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationStatusHistory.applicationId],
			references: [applications.id],
		}),
		changedByUser: one(users, {
			fields: [applicationStatusHistory.changedBy],
			references: [users.id],
		}),
	})
);

export const applicationNotesRelations = relations(
	applicationNotes,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationNotes.applicationId],
			references: [applications.id],
		}),
		createdByUser: one(users, {
			fields: [applicationNotes.createdBy],
			references: [users.id],
		}),
	})
);
