import type { DashboardRole } from '@/core/auth/permissions';
import type { letterTemplates } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import LetterTemplateRepository from './repository';

class LetterTemplateService extends BaseService<typeof letterTemplates, 'id'> {
	private repo: LetterTemplateRepository;

	constructor() {
		const repo = new LetterTemplateRepository();
		super(repo, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { 'letter-templates': ['create'] },
			updateAuth: { 'letter-templates': ['update'] },
			deleteAuth: { 'letter-templates': ['delete'] },
			activityTypes: {
				create: 'letter_template_created',
				update: 'letter_template_updated',
				delete: 'letter_template_deleted',
			},
		});
		this.repo = repo;
	}

	async findAllActive(role?: DashboardRole) {
		return withPermission(() => this.repo.findAllActive(role), 'dashboard');
	}
}

export const letterTemplatesService = serviceWrapper(
	LetterTemplateService,
	'LetterTemplateService'
);
