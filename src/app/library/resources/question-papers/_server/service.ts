import type { questionPapers } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import QuestionPaperRepository from './repository';

class QuestionPaperService extends BaseService<typeof questionPapers, 'id'> {
	declare repository: QuestionPaperRepository;

	constructor() {
		super(new QuestionPaperRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'question_paper_uploaded',
				update: 'question_paper_updated',
				delete: 'question_paper_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return withPermission(() => this.repository.findByIdWithRelations(id), {
			library: ['read'],
		});
	}

	async getQuestionPapers(
		page: number,
		search: string,
		moduleId?: number,
		termId?: number
	) {
		return withPermission(
			() =>
				this.repository.getQuestionPapersWithFilters(
					page,
					search,
					moduleId,
					termId
				),
			{ library: ['read'] }
		);
	}
}

export const questionPapersService = serviceWrapper(
	QuestionPaperService,
	'QuestionPaperService'
);
