import { assessments } from '@academic/assessments/_schema/assessments';
import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { relations } from 'drizzle-orm';
import { modules } from './modules';

export const modulesRelations = relations(modules, ({ many }) => ({
	semesterModules: many(semesterModules),
	assessments: many(assessments),
}));
