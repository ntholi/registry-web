import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { modules } from '@academic/modules/_schema/modules';
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { relations } from 'drizzle-orm';
import { modulePrerequisites } from './modulePrerequisites';
import { semesterModules } from './semesterModules';

export const semesterModulesRelations = relations(
	semesterModules,
	({ many, one }) => ({
		prerequisites: many(modulePrerequisites, {
			relationName: 'semesterModulePrerequisites',
		}),
		prerequisiteFor: many(modulePrerequisites, {
			relationName: 'prerequisiteModules',
		}),
		semester: one(structureSemesters, {
			fields: [semesterModules.semesterId],
			references: [structureSemesters.id],
		}),
		module: one(modules, {
			fields: [semesterModules.moduleId],
			references: [modules.id],
		}),
		assignedModules: many(assignedModules),
	})
);

export const modulePrerequisitesRelations = relations(
	modulePrerequisites,
	({ one }) => ({
		semesterModule: one(semesterModules, {
			fields: [modulePrerequisites.semesterModuleId],
			references: [semesterModules.id],
			relationName: 'semesterModulePrerequisites',
		}),
		prerequisite: one(semesterModules, {
			fields: [modulePrerequisites.prerequisiteId],
			references: [semesterModules.id],
			relationName: 'prerequisiteModules',
		}),
	})
);
