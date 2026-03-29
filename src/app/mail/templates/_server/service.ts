import type { mailTemplates } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { MailTriggerType } from '../../_lib/triggers';
import MailTemplateRepository from './repository';

class MailTemplateService extends BaseService<typeof mailTemplates, 'id'> {
	private repo: MailTemplateRepository;

	constructor() {
		const repo = new MailTemplateRepository();
		super(repo, {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { 'mail-templates': ['create'] },
			updateAuth: { 'mail-templates': ['update'] },
			deleteAuth: { 'mail-templates': ['delete'] },
			activityTypes: {
				create: 'mail_template_created',
				update: 'mail_template_updated',
				delete: 'mail_template_deleted',
			},
		});
		this.repo = repo;
	}

	async findByTriggerType(triggerType: MailTriggerType) {
		return withPermission(
			() => this.repo.findByTriggerType(triggerType),
			'dashboard'
		);
	}
}

export const mailTemplatesService = serviceWrapper(
	MailTemplateService,
	'MailTemplateService'
);
