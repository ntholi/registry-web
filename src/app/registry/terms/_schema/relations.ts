import { relations } from 'drizzle-orm';
import {
	assessments,
	assignedModules,
	graduationDates,
	registrationRequests,
	users,
} from '@/core/database';
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
