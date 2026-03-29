'use server';

import type { mailTemplates } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { mailTemplatesService } from './service';

type MailTemplate = typeof mailTemplates.$inferInsert;

export async function getMailTemplates(page = 1, search = '') {
	return mailTemplatesService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'createdAt', order: 'desc' }],
	});
}

export async function getMailTemplate(id: string) {
	return mailTemplatesService.get(id);
}

export const createMailTemplate = createAction(async (data: MailTemplate) =>
	mailTemplatesService.create(data)
);

export const updateMailTemplate = createAction(
	async (id: string, data: MailTemplate) =>
		mailTemplatesService.update(id, data)
);

export const deleteMailTemplate = createAction(async (id: string) => {
	await mailTemplatesService.delete(id);
});

export const toggleMailTemplateActive = createAction(async (id: string) => {
	const template = await mailTemplatesService.get(id);
	return mailTemplatesService.update(id, { isActive: !template?.isActive });
});
