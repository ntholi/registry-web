import type { Session } from 'next-auth';
import type { feedbackQuestions } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withPermission';
import FeedbackQuestionRepository from './repository';

const MANAGE_POSITIONS = ['manager', 'program_leader', 'admin'];

function canManageQuestions(session: Session) {
	return Promise.resolve(
		session.user?.role === 'academic' &&
			MANAGE_POSITIONS.includes(session.user.position ?? '')
	);
}

class FeedbackQuestionService extends BaseService<
	typeof feedbackQuestions,
	'id'
> {
	constructor() {
		super(new FeedbackQuestionRepository(), {
			findAllRoles: ['academic'],
			byIdRoles: ['academic'],
			createRoles: canManageQuestions,
			updateRoles: canManageQuestions,
			deleteRoles: canManageQuestions,
			activityTypes: {
				create: 'feedback_question_created',
				update: 'feedback_question_updated',
				delete: 'feedback_question_deleted',
			},
		});
	}

	override async get(id: string) {
		return withAuth(
			async () => (this.repository as FeedbackQuestionRepository).findById(id),
			['academic']
		);
	}

	async findAllWithCategories() {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).findAllWithCategories(),
			['academic']
		);
	}

	async findQuestionBoard() {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).findQuestionBoard(),
			['academic']
		);
	}

	async reorderQuestions(ids: string[]) {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).reorderQuestions(ids),
			canManageQuestions
		);
	}

	async reorderCategories(ids: string[]) {
		return withAuth(
			async () =>
				(this.repository as FeedbackQuestionRepository).reorderCategories(ids),
			canManageQuestions
		);
	}
}

export const feedbackQuestionsService = serviceWrapper(
	FeedbackQuestionService,
	'FeedbackQuestionsService'
);
