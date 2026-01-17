import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { users } from '@auth/users/_schema/users';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { assignedModules } from './assignedModules';

export const assignedModulesRelations = relations(
	assignedModules,
	({ one }) => ({
		user: one(users, {
			fields: [assignedModules.userId],
			references: [users.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [assignedModules.semesterModuleId],
			references: [semesterModules.id],
		}),
		term: one(terms, {
			fields: [assignedModules.termId],
			references: [terms.id],
		}),
	})
);
