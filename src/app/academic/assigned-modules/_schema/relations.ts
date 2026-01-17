import { relations } from 'drizzle-orm';
import { semesterModules, terms, users } from '@/core/database';
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
