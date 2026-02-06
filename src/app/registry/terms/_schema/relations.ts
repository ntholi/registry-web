import { assessments } from '@academic/assessments/_schema/assessments';
import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { programs } from '@academic/schools/_schema/programs';
import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import { graduationDates } from '@registry/graduation/dates/_schema/graduationDates';
import { registrationRequests } from '@registry/registration-requests/_schema/registrationRequests';
import { relations } from 'drizzle-orm';
import { termRegistrationPrograms } from './termRegistrationPrograms';
import { termRegistrations } from './termRegistrations';
import { termSettings } from './termSettings';
import { terms } from './terms';

export const termsRelations = relations(terms, ({ many, one }) => ({
	assignedModules: many(assignedModules),
	assessments: many(assessments),
	registrationRequests: many(registrationRequests),
	graduations: many(graduationDates),
	settings: one(termSettings, {
		fields: [terms.id],
		references: [termSettings.termId],
	}),
	registrations: many(termRegistrations),
}));

export const termSettingsRelations = relations(termSettings, ({ one }) => ({
	term: one(terms, {
		fields: [termSettings.termId],
		references: [terms.id],
	}),
	createdByUser: one(users, {
		fields: [termSettings.createdBy],
		references: [users.id],
	}),
	updatedByUser: one(users, {
		fields: [termSettings.updatedBy],
		references: [users.id],
	}),
}));

export const termRegistrationsRelations = relations(
	termRegistrations,
	({ one, many }) => ({
		term: one(terms, {
			fields: [termRegistrations.termId],
			references: [terms.id],
		}),
		school: one(schools, {
			fields: [termRegistrations.schoolId],
			references: [schools.id],
		}),
		createdByUser: one(users, {
			fields: [termRegistrations.createdBy],
			references: [users.id],
		}),
		programs: many(termRegistrationPrograms),
	})
);

export const termRegistrationProgramsRelations = relations(
	termRegistrationPrograms,
	({ one }) => ({
		termRegistration: one(termRegistrations, {
			fields: [termRegistrationPrograms.termRegistrationId],
			references: [termRegistrations.id],
		}),
		program: one(programs, {
			fields: [termRegistrationPrograms.programId],
			references: [programs.id],
		}),
	})
);
