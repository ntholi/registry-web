import { relations } from 'drizzle-orm';
import { programs, semesterModules } from '@/core/database';
import { structureSemesters } from './structureSemesters';
import { structures } from './structures';

export const structuresRelations = relations(structures, ({ many, one }) => ({
	program: one(programs, {
		fields: [structures.programId],
		references: [programs.id],
	}),
	semesters: many(structureSemesters),
}));

export const structureSemestersRelations = relations(
	structureSemesters,
	({ many, one }) => ({
		structure: one(structures, {
			fields: [structureSemesters.structureId],
			references: [structures.id],
		}),
		semesterModules: many(semesterModules),
	})
);
