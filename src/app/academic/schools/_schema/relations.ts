import { structures } from '@academic/structures/_schema/structures';
import { relations } from 'drizzle-orm';
import { programs } from './programs';
import { schools } from './schools';

export const schoolsRelations = relations(schools, ({ many }) => ({
	programs: many(programs),
}));

export const programsRelations = relations(programs, ({ many, one }) => ({
	school: one(schools, {
		fields: [programs.schoolId],
		references: [schools.id],
	}),
	structures: many(structures),
}));
