import { eq } from 'drizzle-orm';
import { db, mailTemplates } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { MailTriggerType } from '../../_lib/triggers';

export default class MailTemplateRepository extends BaseRepository<
	typeof mailTemplates,
	'id'
> {
	constructor() {
		super(mailTemplates, mailTemplates.id);
	}

	async findByTriggerType(triggerType: MailTriggerType) {
		return db.query.mailTemplates.findFirst({
			where: eq(mailTemplates.triggerType, triggerType),
		});
	}
}
