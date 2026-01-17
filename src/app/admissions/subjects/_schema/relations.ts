import { subjectGrades } from '@admissions/academic-records/_schema/subjectGrades';
import { relations } from 'drizzle-orm';
import { subjects } from './subjects';

export const subjectsRelations = relations(subjects, ({ many }) => ({
	subjectGrades: many(subjectGrades),
}));
