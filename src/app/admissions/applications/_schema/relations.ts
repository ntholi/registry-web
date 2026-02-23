import { programs } from '@academic/schools/_schema/programs';
import { applicants } from '@admissions/applicants/_schema/applicants';
import { intakePeriods } from '@admissions/intake-periods/_schema/intakePeriods';
import { bankDeposits } from '@admissions/payments/_schema/bankDeposits';
import { mobileDeposits } from '@admissions/payments/_schema/mobileDeposits';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { applicationNotes } from './applicationNotes';
import { applicationScores } from './applicationScores';
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
		bankDeposits: many(bankDeposits),
		mobileDeposits: many(mobileDeposits),
		statusHistory: many(applicationStatusHistory),
		notes: many(applicationNotes),
		scores: one(applicationScores, {
			fields: [applications.id],
			references: [applicationScores.applicationId],
		}),
	})
);

export const applicationScoresRelations = relations(
	applicationScores,
	({ one }) => ({
		application: one(applications, {
			fields: [applicationScores.applicationId],
			references: [applications.id],
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
