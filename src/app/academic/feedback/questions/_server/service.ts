import type { feedbackQuestions } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import FeedbackQuestionRepository from './repository';

class FeedbackQuestionService extends BaseService<
	typeof feedbackQuestions,
	'id'
> {
	constructor() {
		super(new FeedbackQuestionRepository(), {
			findAllAuth: { 'feedback-questions': ['read'] },
			byIdAuth: { 'feedback-questions': ['read'] },
			createAuth: { 'feedback-questions': ['create'] },
			updateAuth: { 'feedback-questions': ['update'] },
			deleteAuth: { 'feedback-questions': ['delete'] },
			activityTypes: {
				create: 'feedback_question_created',
				update: 'feedback_question_updated',
				delete: 'feedback_question_deleted',
			},
		});
	}

	override async get(id: string) {
		return withPermission(
			async () => (this.repository as FeedbackQuestionRepository).findById(id),
			{ 'feedback-questions': ['read'] }
		);
	}

	async findAllWithCategories() {
		return withPermission(
			async () =>
				(this.repository as FeedbackQuestionRepository).findAllWithCategories(),
			{ 'feedback-questions': ['read'] }
		);
	}

	async findQuestionBoard() {
		return withPermission(
			async () =>
				(this.repository as FeedbackQuestionRepository).findQuestionBoard(),
			{ 'feedback-questions': ['read'] }
		);
	}

	async reorderQuestions(ids: string[]) {
		return withPermission(
			async () =>
				(this.repository as FeedbackQuestionRepository).reorderQuestions(ids),
			{ 'feedback-questions': ['update'] }
		);
	}

	async reorderCategories(ids: string[]) {
		return withPermission(
			async () =>
				(this.repository as FeedbackQuestionRepository).reorderCategories(ids),
			{ 'feedback-questions': ['update'] }
		);
	}
}

export const feedbackQuestionsService = serviceWrapper(
	FeedbackQuestionService,
	'FeedbackQuestionsService'
);
