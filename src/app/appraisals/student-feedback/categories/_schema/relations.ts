import { relations } from 'drizzle-orm';
import { studentFeedbackQuestions } from '../../questions/_schema/studentFeedbackQuestions';
import { studentFeedbackCategories } from './studentFeedbackCategories';

export const studentFeedbackCategoriesRelations = relations(
	studentFeedbackCategories,
	({ many }) => ({
		questions: many(studentFeedbackQuestions),
	})
);
