import type { Session } from 'next-auth';
import type { feedbackCategories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import FeedbackCategoryRepository from './repository';

const MANAGE_POSITIONS = ['manager', 'program_leader', 'admin'];

function canManageCategories(session: Session) {
	return Promise.resolve(
		session.user?.role === 'academic' &&
			MANAGE_POSITIONS.includes(session.user.position ?? '')
	);
}

class FeedbackCategoryService extends BaseService<
	typeof feedbackCategories,
	'id'
> {
	constructor() {
		super(new FeedbackCategoryRepository(), {
			findAllRoles: ['academic'],
			byIdRoles: ['academic'],
			createRoles: canManageCategories,
			updateRoles: canManageCategories,
			deleteRoles: canManageCategories,
			activityTypes: {
				create: 'feedback_category_created',
				update: 'feedback_category_updated',
				delete: 'feedback_category_deleted',
			},
		});
	}

	override async delete(id: string) {
		return withAuth(async (session) => {
			const repo = this.repository as FeedbackCategoryRepository;
			const hasQuestions = await repo.hasQuestions(id);

			if (hasQuestions) {
				throw new Error(
					'Category cannot be deleted because it contains questions'
				);
			}

			const audit = this.buildAuditOptions(session, 'delete');
			await repo.delete(id, audit);
		}, canManageCategories);
	}
}

export const feedbackCategoriesService = serviceWrapper(
	FeedbackCategoryService,
	'FeedbackCategoriesService'
);
