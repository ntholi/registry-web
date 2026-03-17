import type { studentFeedbackCategories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import StudentFeedbackCategoryRepository from './repository';

class StudentFeedbackCategoryService extends BaseService<
	typeof studentFeedbackCategories,
	'id'
> {
	constructor() {
		super(new StudentFeedbackCategoryRepository(), {
			findAllAuth: { 'student-feedback-categories': ['read'] },
			byIdAuth: { 'student-feedback-categories': ['read'] },
			createAuth: { 'student-feedback-categories': ['create'] },
			updateAuth: { 'student-feedback-categories': ['update'] },
			deleteAuth: { 'student-feedback-categories': ['delete'] },
			activityTypes: {
				create: 'student_feedback_category_created',
				update: 'student_feedback_category_updated',
				delete: 'student_feedback_category_deleted',
			},
		});
	}

	override async delete(id: string) {
		return withPermission(
			async (session) => {
				const repo = this.repository as StudentFeedbackCategoryRepository;
				const hasQuestions = await repo.hasQuestions(id);

				if (hasQuestions) {
					throw new Error(
						'Category cannot be deleted because it contains questions'
					);
				}

				const audit = this.buildAuditOptions(session, 'delete');
				await repo.delete(id, audit);
			},
			{ 'student-feedback-categories': ['delete'] }
		);
	}
}

export const studentFeedbackCategoriesService = serviceWrapper(
	StudentFeedbackCategoryService,
	'StudentFeedbackCategoriesService'
);
