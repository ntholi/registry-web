import { relations } from 'drizzle-orm';
import { assessments, semesterModules } from '@/core/database';
import { modules } from './modules';

export const modulesRelations = relations(modules, ({ many }) => ({
	semesterModules: many(semesterModules),
	assessments: many(assessments),
}));
