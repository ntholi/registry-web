import type { studentFeedbackQuestions } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import StudentFeedbackQuestionRepository from './repository';

class StudentFeedbackQuestionService extends BaseService<
	typeof studentFeedbackQuestions,
	'id'
> {
	constructor() {
		super(new StudentFeedbackQuestionRepository(), {
			findAllAuth: { 'student-feedback-questions': ['read'] },
			byIdAuth: { 'student-feedback-questions': ['read'] },
			createAuth: { 'student-feedback-questions': ['create'] },
			updateAuth: { 'student-feedback-questions': ['update'] },
			deleteAuth: { 'student-feedback-questions': ['delete'] },
			activityTypes: {
				create: 'student_feedback_question_created',
				update: 'student_feedback_question_updated',
				delete: 'student_feedback_question_deleted',
			},
		});
	}

	override async get(id: string) {
		return withPermission(
			async () =>
				(this.repository as StudentFeedbackQuestionRepository).findById(id),
			{ 'student-feedback-questions': ['read'] }
		);
	}

	async findAllWithCategories() {
		return withPermission(
			async () =>
				(
					this.repository as StudentFeedbackQuestionRepository
				).findAllWithCategories(),
			{ 'student-feedback-questions': ['read'] }
		);
	}

	async findQuestionBoard() {
		return withPermission(
			async () =>
				(
					this.repository as StudentFeedbackQuestionRepository
				).findQuestionBoard(),
			{ 'student-feedback-questions': ['read'] }
		);
	}

	async reorderQuestions(ids: string[]) {
		return withPermission(
			async () =>
				(this.repository as StudentFeedbackQuestionRepository).reorderQuestions(
					ids
				),
			{ 'student-feedback-questions': ['update'] }
		);
	}

	async reorderCategories(ids: string[]) {
		return withPermission(
			async () =>
				(
					this.repository as StudentFeedbackQuestionRepository
				).reorderCategories(ids),
			{ 'student-feedback-questions': ['update'] }
		);
	}
}

export const studentFeedbackQuestionsService = serviceWrapper(
	StudentFeedbackQuestionService,
	'StudentFeedbackQuestionsService'
);
