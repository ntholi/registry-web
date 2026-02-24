import type { questionPapers } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import QuestionPaperRepository from './repository';

class QuestionPaperService extends BaseService<typeof questionPapers, 'id'> {
	declare repository: QuestionPaperRepository;

	constructor() {
		super(new QuestionPaperRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['admin', 'library'],
			updateRoles: ['admin', 'library'],
			deleteRoles: ['admin', 'library'],
			activityTypes: {
				create: 'question_paper_uploaded',
				update: 'question_paper_updated',
				delete: 'question_paper_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return this.repository.findByIdWithRelations(id);
	}

	async getQuestionPapers(
		page: number,
		search: string,
		moduleId?: number,
		termId?: number
	) {
		return this.repository.getQuestionPapersWithFilters(
			page,
			search,
			moduleId,
			termId
		);
	}
}

export const questionPapersService = serviceWrapper(
	QuestionPaperService,
	'QuestionPaperService'
);
