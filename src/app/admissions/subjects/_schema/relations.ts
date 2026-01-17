import { relations } from 'drizzle-orm';
import { subjectGrades } from '@/core/database';
import { subjects } from './subjects';

export const subjectsRelations = relations(subjects, ({ many }) => ({
	subjectGrades: many(subjectGrades),
}));
