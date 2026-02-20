import type { feedbackQuestions } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import FeedbackQuestionRepository from './repository';

class FeedbackQuestionService extends BaseService<
	typeof feedbackQuestions,
	'id'
> {
	constructor() {
		super(new FeedbackQuestionRepository(), {
			findAllRoles: ['academic', 'admin'],
			byIdRoles: ['academic', 'admin'],
			createRoles: ['academic', 'admin'],
			updateRoles: ['academic', 'admin'],
			deleteRoles: ['academic', 'admin'],
		});
	}

	override async get(id: string) {
		return withAuth(
			async () => (this.repository as FeedbackQuestionRepository).findById(id),
			['academic', 'admin']
		);
	}

	async findAllWithCategories() {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).findAllWithCategories(),
			['academic', 'admin']
		);
	}

	async findQuestionBoard() {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).findQuestionBoard(),
			['academic', 'admin']
		);
	}

	async reorderQuestions(ids: string[]) {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).reorderQuestions(ids),
			['academic', 'admin']
		);
	}

	async reorderCategories(ids: string[]) {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).reorderCategories(ids),
			['academic', 'admin']
		);
	}
}

export const feedbackQuestionsService = serviceWrapper(
	FeedbackQuestionService,
	'FeedbackQuestionsService'
);
